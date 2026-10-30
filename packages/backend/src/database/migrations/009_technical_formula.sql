-- ============================================================
-- SalonOS — Migración 009: Fórmula técnica de color en reservas
-- Ejecutar con: psql $DATABASE_URL -f 009_technical_formula.sql
-- ============================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS technical_formula TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS technical_formula_updated_at TIMESTAMPTZ;
