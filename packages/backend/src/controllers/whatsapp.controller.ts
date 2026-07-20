import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { pool } from '../config/database.js';

/**
 * Controlador de WhatsApp Business API.
 * Gestiona el handshake de verificación de Meta y procesa las respuestas
 * de interacción de los clientes a través de los webhooks de forma segura.
 */
export class WhatsAppController {

  /**
   * Resuelve la verificación del handshake inicial de Meta (GET /api/whatsapp/webhook).
   * Meta envía query params para validar la autenticidad y propiedad del endpoint.
   *
   * @param req Petición HTTP Express.
   * @param res Respuesta HTTP Express.
   */
  public static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[webhook] Error crítico: WHATSAPP_WEBHOOK_SECRET no está configurado.');
      res.status(500).send('Internal Server Error: Webhook secret not configured');
      return;
    }

    // Verificar que el modo sea subscribe y que el token de verificación sea idéntico al configurado
    if (mode === 'subscribe' && token === webhookSecret) {
      console.log('[webhook] Handshake de Meta verificado con éxito.');
      res.status(200).send(challenge);
      return;
    }

    console.warn('[webhook] Handshake fallido: credenciales de verificación incorrectas.');
    res.status(403).send('Forbidden: Token mismatch or invalid mode');
  }

  /**
   * Procesa las notificaciones webhook enviadas por Meta (POST /api/whatsapp/webhook).
   * Implementa validaciones criptográficas contra suplantación (Anti-Spoofing),
   * extracción de payloads de botones y control de idempotencia transaccional.
   *
   * @param req Petición HTTP Express conteniendo el rawBody y la cabecera de firma.
   * @param res Respuesta HTTP Express.
   * @param _next Función Next de Express.
   */
  public static async handleWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // 1. VALIDACIÓN DE SEGURIDAD CRÍTICA (ANTI-SPOOFING):
    // Meta firma cada cuerpo de petición POST usando HMAC-SHA256 con el App Secret.
    // Esto garantiza que la petición proviene exclusivamente de Meta y no ha sido alterada.
    const signatureHeader = req.headers['x-hub-signature-256'] as string;
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      console.warn('[webhook] Firma digital ausente o con formato incorrecto.');
      res.status(401).send('Unauthorized: Missing signature');
      return;
    }

    const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_WEBHOOK_SECRET;
    if (!appSecret) {
      console.error('[webhook] Error interno: WHATSAPP_APP_SECRET no está configurado en las variables.');
      res.status(500).send('Internal Server Error: Signature key missing');
      return;
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error(
        '[webhook] El cuerpo rawBody no está disponible. ' +
        'Asegurar que el parser de Express retenga el raw body.'
      );
      res.status(500).send('Internal Server Error: Raw body parser required');
      return;
    }

    // Extraer la firma en hexadecimal descartando el prefijo "sha256="
    const actualSignature = signatureHeader.substring(7);
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const actualBuf = Buffer.from(actualSignature, 'hex');

    // Usar crypto.timingSafeEqual para evitar fugas de información por tiempo de respuesta (Timing Attacks)
    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      console.warn('[webhook] Intento de acceso no autorizado: firma HMAC inválida.');
      res.status(401).send('Unauthorized: Signature validation failed');
      return;
    }

    // 2. EXTRACCIÓN Y PROCESAMIENTO DEL PAYLOAD:
    // Estructura del JSON de Meta para botones rápidos en plantillas (Quick Reply):
    // entry[0].changes[0].value.messages[0].button.payload
    const body = req.body;
    const changeValue = body?.entry?.[0]?.changes?.[0]?.value;
    const message = changeValue?.messages?.[0];
    const buttonPayload = message?.button?.payload;

    if (!buttonPayload) {
      // No es un mensaje de botón o no tiene payload; retornamos 200 OK para confirmar recepción a Meta
      res.status(200).send('Event acknowledged');
      return;
    }

    // Validar el patrón estandarizado "confirm:UUID" o "cancel:UUID"
    if (!buttonPayload.startsWith('confirm:') && !buttonPayload.startsWith('cancel:')) {
      console.warn(`[webhook] Payload de botón no reconocido: ${buttonPayload}`);
      res.status(200).send('Event acknowledged');
      return;
    }

    const [action, bookingId] = buttonPayload.split(':');

    try {
      // 3. CONTROL DE IDEMPOTENCIA Y VERIFICACIÓN DE ESTADOS:
      // Las redes móviles y Meta pueden reintentar el webhook si hay latencias o timeouts.
      // Validamos el estado actual antes de mutar la base de datos para evitar transiciones inconsistentes.
      const bookingQuery = 'SELECT status FROM bookings WHERE id = $1';
      const { rows } = await pool.query(bookingQuery, [bookingId]);

      if (rows.length === 0) {
        console.warn(`[webhook] Cita con ID ${bookingId} no encontrada.`);
        res.status(404).send('Booking not found');
        return;
      }

      const currentStatus = rows[0].status;
      const targetStatus = action === 'confirm' ? 'confirmed' : 'cancelled';

      // Si la cita ya está en el estado meta o ya ha sido completada, respondemos 200 OK e ignoramos.
      if (currentStatus === targetStatus || currentStatus === 'completed') {
        console.log(`[webhook] Evento ignorado (idempotencia): Cita ${bookingId} ya en estado "${currentStatus}".`);
        res.status(200).send('Duplicate action ignored');
        return;
      }

      // Solo permitimos mutar citas que se encuentren en estado inicial 'pending'
      if (currentStatus !== 'pending') {
        console.log(`[webhook] Cita ${bookingId} en estado "${currentStatus}" no permite confirmación/cancelación.`);
        res.status(200).send('Action not allowed for current state');
        return;
      }

      // 4. TRANSICIÓN DE ESTADO ATÓMICA:
      await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        [targetStatus, bookingId]
      );

      // Registrar la bitácora analítica en recordatorio_log
      await pool.query(
        `INSERT INTO recordatorio_log (booking_id, type, whatsapp_message_id, status)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, 'confirmation', message.id || null, targetStatus]
      );

      console.log(`[webhook] Cita ${bookingId} transicionada con éxito a "${targetStatus}" vía WhatsApp.`);
      res.status(200).send('Webhook processed successfully');
    } catch (err) {
      console.error('[webhook] Error al procesar webhook en base de datos:', err);
      res.status(500).send('Internal Server Error');
    }
  }
}
