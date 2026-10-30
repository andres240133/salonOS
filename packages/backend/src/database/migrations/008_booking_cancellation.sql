-- ============================================================
-- SalonOS — Migración 008: Motivo de cancelación en reservas
-- Ejecutar con: psql $DATABASE_URL -f 008_booking_cancellation.sql
-- ============================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
