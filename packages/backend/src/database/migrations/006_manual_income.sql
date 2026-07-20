-- ============================================================
-- SalonOS — Migración 006: Ingresos Manuales
--
-- Registra ingresos que no están atados a una cita del sistema
-- (venta de producto suelta, clienta sin reserva, etc.). Se
-- mantiene separada de `payments` para no romper la trazabilidad
-- estricta 1:1 entre `payments` y `bookings` (booking_id es
-- NOT NULL + UNIQUE en payments por diseño).
--
-- Ejecutar con: docker cp + psql -f (NUNCA con Get-Content | pipe
-- de PowerShell — corrompe acentos UTF-8, ver migraciones 001b/005).
-- ============================================================

CREATE TABLE IF NOT EXISTS manual_income (
    id          SERIAL        PRIMARY KEY,
    amount      DECIMAL(10,2) NOT NULL,
    description VARCHAR(255)  NOT NULL,
    -- Categoría simple para diferenciar el origen en reportes futuros
    category    VARCHAR(50)   NOT NULL DEFAULT 'other',
    date        DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_manual_income_amount   CHECK (amount >= 0),
    CONSTRAINT chk_manual_income_category CHECK (category IN ('product_sale', 'walk_in_service', 'other'))
);

COMMENT ON TABLE manual_income IS 'Ingresos registrados manualmente sin cita asociada (venta de producto suelta, clienta sin reserva, etc.).';
COMMENT ON COLUMN manual_income.category IS 'product_sale=venta de producto, walk_in_service=servicio sin reserva previa, other=otros ingresos.';

CREATE INDEX IF NOT EXISTS idx_manual_income_date ON manual_income (date DESC);
