-- ============================================================
-- SalonOS — Migración 005 — Catálogo inicial de servicios
-- Amplía el CHECK de categoría y siembra el catálogo base.
-- Ejecutar con: psql $DATABASE_URL -f 005_services_seed.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Ampliar CHECK de categoría para incluir 'Decoloración'
-- ============================================================

ALTER TABLE services DROP CONSTRAINT chk_services_category;
ALTER TABLE services ADD CONSTRAINT chk_services_category
  CHECK (category IN ('Corte', 'Color', 'Decoloración', 'Peinado', 'Tratamientos', 'Otros'));

-- ============================================================
-- 2. Catálogo inicial de servicios
--
-- price = 0.00 intencionalmente: la dueña define precios reales
-- desde el panel de administración antes de abrir la agenda.
-- ============================================================

-- Corte -------------------------------------------------------

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Corte de dama', NULL, 0.00, 45, 'Corte', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Corte de dama' AND category = 'Corte');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Corte con degradé', NULL, 0.00, 60, 'Corte', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Corte con degradé' AND category = 'Corte');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Corte + puntas', NULL, 0.00, 30, 'Corte', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Corte + puntas' AND category = 'Corte');

-- Color -------------------------------------------------------

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Tinte completo', NULL, 0.00, 90, 'Color', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Tinte completo' AND category = 'Color');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Retoque de raíz', NULL, 0.00, 60, 'Color', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Retoque de raíz' AND category = 'Color');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Tinte + tratamiento', NULL, 0.00, 120, 'Color', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Tinte + tratamiento' AND category = 'Color');

-- Decoloración ------------------------------------------------

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Decoloración completa', NULL, 0.00, 150, 'Decoloración', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Decoloración completa' AND category = 'Decoloración');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Balayage / mechas', NULL, 0.00, 180, 'Decoloración', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Balayage / mechas' AND category = 'Decoloración');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Técnica foilyage', NULL, 0.00, 210, 'Decoloración', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Técnica foilyage' AND category = 'Decoloración');

-- Peinado -----------------------------------------------------

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Peinado para evento', NULL, 0.00, 60, 'Peinado', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Peinado para evento' AND category = 'Peinado');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Brushing / blow dry', NULL, 0.00, 45, 'Peinado', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Brushing / blow dry' AND category = 'Peinado');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Planchado keratina', NULL, 0.00, 90, 'Peinado', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Planchado keratina' AND category = 'Peinado');

-- Tratamientos ------------------------------------------------

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Hidratación profunda', NULL, 0.00, 45, 'Tratamientos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Hidratación profunda' AND category = 'Tratamientos');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Tratamiento proteico', NULL, 0.00, 60, 'Tratamientos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Tratamiento proteico' AND category = 'Tratamientos');

INSERT INTO services (name, description, price, duration_minutes, category, is_active)
SELECT 'Botox capilar', NULL, 0.00, 90, 'Tratamientos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Botox capilar' AND category = 'Tratamientos');

COMMIT;
