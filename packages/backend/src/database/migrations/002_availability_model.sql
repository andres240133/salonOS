-- ============================================================
-- SalonOS — Migración 002: Modelo de Disponibilidad por Demanda
-- ============================================================

-- 1. Eliminar modelo de horario rígido (Fase 1 deprecada)
-- Documentación: Se descarta la jornada general para adaptar la lógica
-- a una realidad donde la estilista abre su agenda por semana/días puntuales.
DROP TABLE IF EXISTS business_hours CASCADE;

-- 2. Modelo de disponibilidad diaria exacta (por demanda)
-- Documentación: Solo las fechas registradas explícitamente aquí
-- definirán la jornada global disponible en el calendario público.
-- Los bloqueos de turnos internos seguirán siendo gestionados por time_blocks.
CREATE TABLE availability_slots (
    id          SERIAL      PRIMARY KEY,
    date        DATE        NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_availability_date UNIQUE (date),
    CONSTRAINT chk_availability_time CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_slots_date ON availability_slots (date);

-- 3. Plantillas de disponibilidad para clonado rápido
-- Documentación: Actúa como molde ("blueprint") para copiar fácilmente
-- una configuración recurrente hacia availability_slots.
CREATE TABLE availability_templates (
    id          SERIAL  PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    start_time  TIME    NOT NULL,
    end_time    TIME    NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_template_day UNIQUE (day_of_week),
    CONSTRAINT chk_template_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_template_time CHECK (end_time > start_time)
);

-- Seed de plantillas base: por defecto todas inactivas (demanda pura).
-- La dueña debe habilitar ("aplicar semana típica") las que le interesen.
INSERT INTO availability_templates (day_of_week, start_time, end_time, is_active) VALUES
    (0, '09:00', '18:00', FALSE), -- Domingo
    (1, '09:00', '18:00', FALSE), -- Lunes
    (2, '09:00', '18:00', FALSE), -- Martes
    (3, '09:00', '18:00', FALSE), -- Miércoles
    (4, '09:00', '18:00', FALSE), -- Jueves
    (5, '09:00', '18:00', FALSE), -- Viernes
    (6, '09:00', '18:00', FALSE)  -- Sábado
ON CONFLICT (day_of_week) DO NOTHING;
