import { pool } from '../config/database.js';
import { decrypt } from './crypto.js';

// Validar que las variables de entorno de Meta existan al arrancar en entornos de producción
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

if (process.env.NODE_ENV === 'production' && (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID)) {
  console.warn(
    '[whatsapp] ADVERTENCIA: Las variables de entorno WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no están definidas. ' +
    'Los envíos de WhatsApp fallarán en producción.'
  );
}

/** Helper interno para descifrar campos PII cifrados en formato "ciphertext:iv" */
function decryptField(stored: string): string {
  const [encrypted, iv] = stored.split(':');
  if (!encrypted || !iv) {
    throw new Error('[whatsapp] El formato de los datos cifrados no es válido (falta ciphertext o IV).');
  }
  return decrypt(encrypted, iv);
}

export class WhatsAppService {
  private static getApiUrl(): string {
    return `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`;
  }

  /**
   * Envía un mensaje de plantilla interactiva de bienvenida a un cliente.
   * La plantilla de Meta debe tener definidos los botones interactivos CTA (Call-to-Action):
   * - Botón 1 (URL): "Reservar en Línea 🗓️" (ej. https://salonos.app)
   * - Botón 2 (Phone call nativo): "Llamar al Salón 📞" (número de la estilista)
   *
   * @param toPhone Número telefónico destino en formato E.164.
   * @returns Booleano indicando si el mensaje fue enviado con éxito.
   */
  public static async sendWelcomeMessage(toPhone: string): Promise<boolean> {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.error('[whatsapp] Faltan credenciales de WhatsApp Cloud API.');
      return false;
    }

    /**
     * ESTRUCTURA DEL PAYLOAD JSON DE META CLOUD API:
     * - type: "template" define que se consumirá una plantilla pre-aprobada en Meta.
     * - components: Contiene los parámetros dinámicos a inyectar en la plantilla.
     *   En este caso, la plantilla de bienvenida "welcome_flow" es estática y contiene
     *   los botones CTA pre-configurados en el portal de desarrolladores, por lo que
     *   no requiere componentes o parámetros variables en el envío.
     */
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'template',
      template: {
        name: 'welcome_flow',
        language: {
          code: 'es',
        },
      },
    };

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json() as any;

      if (!response.ok) {
        console.error('[whatsapp] Error al enviar mensaje de bienvenida:', responseData);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[whatsapp] Error de red al enviar mensaje de bienvenida:', err);
      return false;
    }
  }

  /**
   * Envía un mensaje interactivo de confirmación de reserva.
   * Obtiene la cita, descifra la PII de la clienta, formatea montos en CRC y
   * fecha/hora local de Costa Rica, envía el mensaje e inserta el log correspondiente.
   *
   * @param bookingId UUID de la reserva a confirmar.
   * @returns Booleano que indica si el envío fue exitoso.
   */
  public static async sendBookingConfirmation(bookingId: string): Promise<boolean> {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.error('[whatsapp] Faltan credenciales de WhatsApp Cloud API.');
      return false;
    }

    try {
      // 1. Obtener los detalles de la cita y la clienta (unión de tablas)
      const query = `
        SELECT
          b.id AS booking_id,
          b.scheduled_at,
          c.name AS client_name,
          c.phone AS client_phone,
          s.name AS service_name,
          s.price AS service_price
        FROM bookings b
        JOIN clients c ON b.client_id = c.id
        JOIN services s ON b.service_id = s.id
        WHERE b.id = $1
      `;
      const { rows } = await pool.query(query, [bookingId]);

      if (rows.length === 0) {
        console.error(`[whatsapp] Reserva ${bookingId} no encontrada para confirmación.`);
        return false;
      }

      const row = rows[0];

      // 2. Descifrar los datos PII sensibles
      const clientName = decryptField(row.client_name);
      const clientPhone = decryptField(row.client_phone);

      // 3. Formatear la fecha/hora en la zona horaria de Costa Rica (America/Costa_Rica)
      const scheduledDate = new Date(row.scheduled_at);
      const dateStr = scheduledDate.toLocaleDateString('es-CR', {
        timeZone: 'America/Costa_Rica',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const timeStr = scheduledDate.toLocaleTimeString('es-CR', {
        timeZone: 'America/Costa_Rica',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const localDateTime = `${dateStr} a las ${timeStr}`;

      // 4. Formatear el precio estrictamente en Colones Costarricenses (₡)
      const priceNum = parseFloat(row.service_price);
      const formattedPrice = new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
      }).format(priceNum);

      /**
       * DISEÑO TÉCNICO DEL PAYLOAD DE LA PLANTILLA:
       * - "booking_confirmation" es una plantilla interactiva con variables en el cuerpo
       *   y dos botones de respuesta rápida (Quick Reply) con payloads dinámicos asociados:
       * - Parámetros del body:
       *   1. Nombre de la clienta (ej. "Sofía Rodríguez")
       *   2. Nombre del servicio (ej. "Corte + Balayage")
       *   3. Fecha y hora local de Costa Rica (ej. "jueves 28 de mayo a las 10:00 AM")
       *   4. Precio en Colones (ej. "₡45.000,00")
       * - Parámetros de los botones:
       *   Se envían payloads dinámicos para identificar qué acción e ID de cita se procesará
       *   cuando la clienta responda (ej. "confirm:UUID" o "cancel:UUID").
       */
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: clientPhone,
        type: 'template',
        template: {
          name: 'booking_confirmation',
          language: {
            code: 'es',
          },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: clientName },
                { type: 'text', text: row.service_name },
                { type: 'text', text: localDateTime },
                { type: 'text', text: formattedPrice },
              ],
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '0',
              parameters: [
                { type: 'payload', payload: `confirm:${bookingId}` },
              ],
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '1',
              parameters: [
                { type: 'payload', payload: `cancel:${bookingId}` },
              ],
            },
          ],
        },
      };

      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json() as any;
      const messageId = responseData?.messages?.[0]?.id;

      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }

      // Registrar éxito en la bitácora
      await pool.query(
        `INSERT INTO recordatorio_log (booking_id, type, whatsapp_message_id, status)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, 'confirmation', messageId || null, 'sent']
      );

      return true;
    } catch (err: any) {
      console.error('[whatsapp] Error al enviar confirmación de reserva:', err.message || err);

      // Registrar fallo en la bitácora de recordatorios para auditoría
      await pool.query(
        `INSERT INTO recordatorio_log (booking_id, type, status, error_message)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, 'confirmation', 'failed', err.message || 'Error desconocido']
      );

      return false;
    }
  }

  /**
   * Envía una notificación de cancelación automática por falta de confirmación.
   *
   * @param bookingId UUID de la reserva.
   * @param toPhone Teléfono de la clienta.
   * @param clientName Nombre de la clienta.
   * @param serviceName Nombre del servicio cancelado.
   * @param dateStr Fecha y hora formateada en el huso horario local.
   * @returns Booleano indicando el éxito del envío.
   */
  public static async sendAutoCancellationNotification(
    bookingId: string,
    toPhone: string,
    clientName: string,
    serviceName: string,
    dateStr: string
  ): Promise<boolean> {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.error('[whatsapp] Faltan credenciales de WhatsApp Cloud API.');
      return false;
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'template',
      template: {
        name: 'auto_cancellation',
        language: {
          code: 'es',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: clientName },
              { type: 'text', text: serviceName },
              { type: 'text', text: dateStr },
            ],
          },
        ],
      },
    };

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json() as any;
      const messageId = responseData?.messages?.[0]?.id;

      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }

      await pool.query(
        `INSERT INTO recordatorio_log (booking_id, type, whatsapp_message_id, status)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, 'auto_cancellation', messageId || null, 'sent']
      );

      return true;
    } catch (err: any) {
      console.error('[whatsapp] Error al enviar notificación de cancelación automática:', err.message || err);

      await pool.query(
        `INSERT INTO recordatorio_log (booking_id, type, status, error_message)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, 'auto_cancellation', 'failed', err.message || 'Error de red/API']
      );

      return false;
    }
  }
}
