import cron from 'node-cron';
import { pool } from '../config/database.js';
import { decrypt } from './crypto.js';
import { WhatsAppService } from './whatsapp.js';

/** Helper interno para descifrar campos PII cifrados en formato "ciphertext:iv" */
function decryptField(stored: string): string {
  const [encrypted, iv] = stored.split(':');
  if (!encrypted || !iv) {
    throw new Error('[cron] El formato de los datos cifrados no es válido.');
  }
  return decrypt(encrypted, iv);
}

/**
 * Procesa la cancelación automática de citas que no han sido confirmadas
 * dentro del límite de tiempo configurado en la variable CONFIRMATION_DEADLINE_HOURS.
 *
 * Algoritmo de Expiración y Liberación:
 * 1. Ejecuta un query UPDATE CTE atómico que cambia el estado de 'pending' a 'cancelled'
 *    para citas con scheduled_at menor o igual a NOW() + CONFIRMATION_DEADLINE_HOURS.
 *    Esto garantiza exclusión mutua a nivel de base de datos para no enviar recordatorios múltiples.
 * 2. Retorna las filas afectadas uniendo los datos de clienta y servicio.
 * 3. Descifra la PII de cada clienta y dispara la notificación de cancelación de forma paralela.
 */
export async function processAutoCancellations(): Promise<void> {
  const deadlineHours = parseInt(process.env.CONFIRMATION_DEADLINE_HOURS || '24', 10);

  const query = `
    WITH cancelled_bookings AS (
      UPDATE bookings
      SET status = 'cancelled'
      WHERE status = 'pending'
        AND scheduled_at <= NOW() + ($1 || ' hours')::INTERVAL
      RETURNING id, client_id, service_id, scheduled_at
    )
    SELECT
      cb.id AS booking_id,
      cb.scheduled_at,
      c.name AS client_name,
      c.phone AS client_phone,
      s.name AS service_name
    FROM cancelled_bookings cb
    JOIN clients c ON cb.client_id = c.id
    JOIN services s ON cb.service_id = s.id
  `;

  try {
    const { rows } = await pool.query(query, [deadlineHours]);

    if (rows.length === 0) {
      return;
    }

    console.log(`[cron] Se han cancelado automáticamente ${rows.length} citas por falta de confirmación.`);

    // Enviar notificaciones de WhatsApp en paralelo para avisar de la liberación del slot
    const notificationPromises = rows.map(async (row) => {
      try {
        const clientName = decryptField(row.client_name);
        const clientPhone = decryptField(row.client_phone);

        // Formatear la fecha/hora en la zona horaria de Costa Rica (America/Costa_Rica)
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

        await WhatsAppService.sendAutoCancellationNotification(
          row.booking_id,
          clientPhone,
          clientName,
          row.service_name,
          localDateTime
        );
      } catch (err: any) {
        console.error(
          `[cron] Error al procesar notificación de cancelación para la reserva ${row.booking_id}:`,
          err.message || err
        );
      }
    });

    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('[cron] Error crítico al ejecutar query de cancelaciones automáticas:', err);
    throw err;
  }
}

/**
 * Inicializa los procesos en segundo plano (Cron Jobs) de la aplicación.
 * El job de cancelaciones automáticas corre al inicio de cada hora (0 * * * *).
 */
export function initCronJobs(): void {
  cron.schedule('0 * * * *', async () => {
    console.log('[cron] Ejecutando job recurrente de liberación de citas...');
    try {
      await processAutoCancellations();
    } catch (err) {
      console.error('[cron] Error en el flujo del job recurrente:', err);
    }
  });

  console.log('[cron] Motor de tareas en segundo plano (Cron Jobs) inicializado.');
}
