-- ============================================================
-- SalonOS — Migración 004: Bitácora de Recordatorios y WhatsApp
-- ============================================================

-- Crear tipo enum de forma segura e idempotente para evitar errores si el script se vuelve a ejecutar.
DO $$ BEGIN
    CREATE TYPE tipo_recordatorio AS ENUM ('welcome', 'confirmation', 'auto_cancellation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Creación de la tabla de bitácora para almacenamiento de logs y rastros analíticos
CREATE TABLE IF NOT EXISTS recordatorio_log (
    id                  SERIAL            PRIMARY KEY,
    booking_id          UUID              NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type                tipo_recordatorio NOT NULL,
    whatsapp_message_id VARCHAR(255),         -- ID de mensaje de WhatsApp devuelto por Meta (wamid.xxx)
    status              VARCHAR(50)       NOT NULL, -- 'sent', 'failed', 'delivered', etc.
    error_message       TEXT,                 -- Mensaje de error si la entrega falló
    created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Índices optimizados para búsquedas rápidas por cita y orden cronológico
CREATE INDEX IF NOT EXISTS idx_recordatorio_log_booking_id ON recordatorio_log (booking_id);
CREATE INDEX IF NOT EXISTS idx_recordatorio_log_created_at ON recordatorio_log (created_at DESC);
