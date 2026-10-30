-- ============================================================
-- SalonOS — Migración 007: Hora máxima de inicio (last_start_time)
-- Separa la última hora para iniciar cita (last_start_time) de la hora de cierre (end_time).
-- ============================================================

-- 1. availability_slots: agregar columna, backfill y NOT NULL
ALTER TABLE availability_slots
    ADD COLUMN IF NOT EXISTS last_start_time TIME;

UPDATE availability_slots
SET last_start_time = end_time
WHERE last_start_time IS NULL;

ALTER TABLE availability_slots
    ALTER COLUMN last_start_time SET NOT NULL;

ALTER TABLE availability_slots
    DROP CONSTRAINT IF EXISTS chk_availability_time;

ALTER TABLE availability_slots
    ADD CONSTRAINT chk_availability_time
    CHECK (start_time <= last_start_time AND last_start_time <= end_time AND end_time > start_time);

-- 2. availability_templates: agregar columna, backfill y NOT NULL
ALTER TABLE availability_templates
    ADD COLUMN IF NOT EXISTS last_start_time TIME;

UPDATE availability_templates
SET last_start_time = end_time
WHERE last_start_time IS NULL;

ALTER TABLE availability_templates
    ALTER COLUMN last_start_time SET NOT NULL;

ALTER TABLE availability_templates
    DROP CONSTRAINT IF EXISTS chk_template_time;

ALTER TABLE availability_templates
    ADD CONSTRAINT chk_template_time
    CHECK (start_time <= last_start_time AND last_start_time <= end_time AND end_time > start_time);

-- 3. Actualizar plantillas base con los nuevos defaults (06:00 / 18:00 / 21:00)
-- Solo actualiza filas que permanecen con los valores del seed original inactivo.
UPDATE availability_templates
SET start_time = '06:00', last_start_time = '18:00', end_time = '21:00'
WHERE is_active = FALSE
  AND start_time = '09:00'
  AND end_time = '18:00';
