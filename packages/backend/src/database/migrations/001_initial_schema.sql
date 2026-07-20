-- ============================================================
-- SalonOS — Migración Inicial 001
-- Esquema PostgreSQL completo.
-- Ejecutar con: psql $DATABASE_URL -f 001_initial_schema.sql
-- ============================================================

-- Extensión necesaria para gen_random_uuid() en PostgreSQL < 14
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLA 1: stylist_users
-- Administradoras del sistema. Uso exclusivo de la dueña.
-- ============================================================
CREATE TABLE IF NOT EXISTS stylist_users (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL,
    -- bcrypt hash de la contraseña. NUNCA almacenar la contraseña en texto plano.
    password_hash  VARCHAR(255) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stylist_users_email UNIQUE (email),
    CONSTRAINT chk_stylist_users_email CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

COMMENT ON TABLE stylist_users IS 'Usuarios administradores del salon. Fase 1: solo un registro (la duena).';
COMMENT ON COLUMN stylist_users.password_hash IS 'Hash bcrypt (cost 12). Nunca almacenar contraseña en texto plano.';

-- ============================================================
-- TABLA 2: services
-- Catálogo de servicios ofrecidos. Soft-delete via is_active.
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    id               SERIAL       PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    price            DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER      NOT NULL,
    -- Agrupación para filtros en el flujo de reserva
    category         VARCHAR(50)  NOT NULL,
    -- false = desactivado sin romper historial de bookings existentes
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_services_price          CHECK (price >= 0),
    CONSTRAINT chk_services_duration       CHECK (duration_minutes > 0),
    CONSTRAINT chk_services_category       CHECK (category IN ('Corte', 'Color', 'Peinado', 'Tratamientos', 'Otros'))
);

COMMENT ON TABLE services IS 'Catalogo de servicios del salon. Soft-delete con is_active=false.';
COMMENT ON COLUMN services.duration_minutes IS 'Duracion en minutos usada para calcular slots de disponibilidad en la agenda.';
COMMENT ON COLUMN services.is_active IS 'false permite desactivar el servicio sin romper registros historicos de bookings.';

CREATE INDEX IF NOT EXISTS idx_services_category  ON services (category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services (is_active);

-- ============================================================
-- TABLA 3: clients
-- Directorio de clientas con datos PII cifrados en reposo.
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id         SERIAL      PRIMARY KEY,
    -- Nombre cifrado con AES-256-GCM en la capa de aplicación antes de insertar.
    name       TEXT        NOT NULL,
    -- Teléfono cifrado con AES-256-GCM. Formato E.164 antes del cifrado.
    phone      TEXT        NOT NULL,
    -- SHA-256(phone_e164 + SYSTEM_SALT). Permite búsqueda exacta sin desencriptar.
    phone_hash VARCHAR(64) NOT NULL,
    -- Notas técnicas visibles solo para la administradora (no son PII crítica).
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_clients_phone_hash UNIQUE (phone_hash)
);

COMMENT ON TABLE clients IS 'Directorio de clientas. name y phone cifrados en reposo (AES-256-GCM).';
COMMENT ON COLUMN clients.name IS 'Nombre completo cifrado con AES-256-GCM. Descifrar en capa de aplicacion.';
COMMENT ON COLUMN clients.phone IS 'Telefono en formato E.164 cifrado con AES-256-GCM. Descifrar en capa de aplicacion.';
COMMENT ON COLUMN clients.phone_hash IS 'SHA-256(phone_e164 || SYSTEM_SALT). Para busqueda exacta e identificacion unica sin descifrar toda la tabla.';

-- Índice para búsqueda rápida por hash de teléfono (upsert en reservas)
CREATE INDEX IF NOT EXISTS idx_clients_phone_hash ON clients (phone_hash);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC);

-- ============================================================
-- TABLA 4: bookings
-- Registro de citas. UUID como PK previene enumeración de IDs.
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        INTEGER     NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    service_id       INTEGER     NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    -- Snapshot de la duración al momento de reservar. Inmune a cambios futuros en el catálogo.
    duration_minutes INTEGER     NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Trazabilidad: distingue reservas auto-gestionadas de las manuales
    origin           VARCHAR(20) NOT NULL DEFAULT 'self_service',
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    CONSTRAINT chk_bookings_origin CHECK (origin IN ('self_service', 'manual_admin')),
    CONSTRAINT chk_bookings_duration CHECK (duration_minutes > 0)
);

COMMENT ON TABLE bookings IS 'Agenda de citas del salon. UUID como PK previene enumeracion de IDs en URLs publicas.';
COMMENT ON COLUMN bookings.duration_minutes IS 'Copia snapshot del servicio al reservar. Protege el historial si el catalogo cambia.';
COMMENT ON COLUMN bookings.origin IS 'self_service: reserva via PWA publica. manual_admin: creada por la estilista.';
COMMENT ON COLUMN bookings.status IS 'Flujo de estado: pending → confirmed → completed | cancelled.';

CREATE INDEX IF NOT EXISTS idx_bookings_client_id    ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id   ON bookings (service_id);
-- Índice crítico para consultas de disponibilidad de agenda
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
-- Índice compuesto para el cron de recordatorios (busca pending/confirmed en rango temporal)
CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled ON bookings (status, scheduled_at)
    WHERE status IN ('pending', 'confirmed');

-- ============================================================
-- TABLA 5: payments
-- Ingresos asociados 1:1 con citas completadas.
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id             SERIAL       PRIMARY KEY,
    -- UNIQUE garantiza relación estricta 1:1 con bookings
    booking_id     UUID         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    amount         DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20)  NOT NULL,
    processed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payments_amount         CHECK (amount >= 0),
    CONSTRAINT chk_payments_method         CHECK (payment_method IN ('cash', 'transfer', 'card'))
);

COMMENT ON TABLE payments IS 'Registro de ingresos del salon. Relacion 1:1 con bookings (UNIQUE en booking_id).';
COMMENT ON COLUMN payments.amount IS 'Monto real cobrado. Puede diferir del precio del servicio (descuentos, propinas).';

CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments (processed_at DESC);

-- ============================================================
-- TABLA 6: expenses
-- Egresos operativos para el balance financiero.
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id          SERIAL        PRIMARY KEY,
    description VARCHAR(255)  NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    -- Categoría define el origen del gasto para el dashboard financiero
    category    VARCHAR(50)   NOT NULL,
    date        DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_expenses_amount   CHECK (amount >= 0),
    CONSTRAINT chk_expenses_category CHECK (category IN ('supplies', 'rent', 'utilities', 'marketing', 'other'))
);

COMMENT ON TABLE expenses IS 'Registro de egresos operativos para el balance de caja.';
COMMENT ON COLUMN expenses.category IS 'supplies=insumos (generado auto al registrar compra), rent=alquiler, utilities=servicios, marketing, other.';

CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- ============================================================
-- TABLA 7: business_hours (schedule_config)
-- Define la jornada laboral base del salón por día de semana.
-- ============================================================
CREATE TABLE IF NOT EXISTS business_hours (
    id          SERIAL  PRIMARY KEY,
    -- 0=Domingo, 1=Lunes, ..., 6=Sábado (convención JavaScript Date.getDay)
    day_of_week INTEGER NOT NULL,
    start_time  TIME    NOT NULL,
    end_time    TIME    NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_business_hours_day UNIQUE (day_of_week),
    CONSTRAINT chk_business_hours_day       CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_business_hours_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE business_hours IS 'Jornada laboral base. Un registro por dia de semana. Modificar is_active=false para dias de descanso.';
COMMENT ON COLUMN business_hours.day_of_week IS '0=Domingo, 1=Lunes, ..., 6=Sabado. Convención ISO de JavaScript.';

-- Corrección del seed de business_hours
-- Sábado trabaja jornada completa igual que lunes a viernes

DELETE FROM business_hours;

INSERT INTO business_hours (day_of_week, start_time, end_time, is_active) VALUES
    (0, '09:00', '18:00', FALSE),  -- Domingo: cerrado
    (1, '09:00', '18:00', TRUE),   -- Lunes
    (2, '09:00', '18:00', TRUE),   -- Martes
    (3, '09:00', '18:00', TRUE),   -- Miércoles
    (4, '09:00', '18:00', TRUE),   -- Jueves
    (5, '09:00', '18:00', TRUE),   -- Viernes
    (6, '09:00', '18:00', TRUE)    -- Sábado
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================================
-- TABLA 8: time_blocks
-- Bloqueos excepcionales de agenda (vacaciones, trámites, etc.).
-- ============================================================
CREATE TABLE IF NOT EXISTS time_blocks (
    id          SERIAL      PRIMARY KEY,
    description VARCHAR(255),
    start_at    TIMESTAMPTZ NOT NULL,
    end_at      TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_blocks_range CHECK (end_at > start_at)
);

COMMENT ON TABLE time_blocks IS 'Bloqueos manuales de agenda. Impiden que las clientas reserven en esos rangos temporales.';

CREATE INDEX IF NOT EXISTS idx_time_blocks_range ON time_blocks (start_at, end_at);

-- ============================================================
-- TABLA 9: audit_logs
-- Trazabilidad de acciones administrativas. IPs anonimizadas.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              SERIAL      PRIMARY KEY,
    -- Nullable: registra fallos de login donde user_id aún no es conocido
    user_id         UUID        REFERENCES stylist_users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    -- SHA-256(ip_address || AUDIT_SALT). Nunca la IP real en texto plano.
    ip_address_hash VARCHAR(64) NOT NULL,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Log de auditoría de accesos y acciones administrativas.';
COMMENT ON COLUMN audit_logs.ip_address_hash IS 'SHA-256(ip || AUDIT_SALT). Anonimización para cumplir principio de minimización de datos.';
COMMENT ON COLUMN audit_logs.user_id IS 'NULL en fallos de autenticación donde el usuario no fue identificado aún.';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
-- Útil para detectar ataques de fuerza bruta por IP hasheada
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_action  ON audit_logs (ip_address_hash, action, created_at DESC);

-- ============================================================
-- TABLA 10: suppliers
-- Directorio de proveedores de insumos del salón.
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id            SERIAL       PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    contact_name  VARCHAR(150),
    phone         VARCHAR(50),
    email         VARCHAR(255),
    payment_terms TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_suppliers_email CHECK (email IS NULL OR email ~* '^[^@]+@[^@]+\.[^@]+$')
);

COMMENT ON TABLE suppliers IS 'Directorio de proveedores de insumos del salon.';
COMMENT ON COLUMN suppliers.payment_terms IS 'Condiciones de pago y entrega en texto libre. Ej: Contado, Credito 30 dias.';

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);

-- ============================================================
-- TABLA 11: products
-- Catálogo de insumos/productos con control de stock.
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id                   SERIAL        PRIMARY KEY,
    supplier_id          INTEGER       NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    name                 VARCHAR(150)  NOT NULL,
    brand                VARCHAR(100),
    cost_price           DECIMAL(10,2) NOT NULL,
    unit_of_measure      VARCHAR(20)   NOT NULL,
    -- Stock en punto flotante para manejar fracciones (ml, g)
    current_stock        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    minimum_stock_alert  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_products_cost_price   CHECK (cost_price >= 0),
    CONSTRAINT chk_products_stock        CHECK (current_stock >= 0),
    CONSTRAINT chk_products_min_stock    CHECK (minimum_stock_alert >= 0),
    CONSTRAINT chk_products_uom          CHECK (unit_of_measure IN ('ml', 'g', 'unidades', 'litros', 'kg'))
);

COMMENT ON TABLE products IS 'Catalogo de insumos del salon con control de stock.';
COMMENT ON COLUMN products.current_stock IS 'Stock actual. Se incrementa al registrar compras y puede decrementarse manualmente.';
COMMENT ON COLUMN products.minimum_stock_alert IS 'Cantidad umbral para activar alerta de stock bajo en el panel de inventario.';

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_name        ON products (name);
-- Índice parcial para query de alerta de stock mínimo
CREATE INDEX IF NOT EXISTS idx_products_low_stock   ON products (current_stock)
    WHERE current_stock <= minimum_stock_alert;

-- ============================================================
-- TABLA 12: purchases
-- Órdenes de compra. Cada una genera un gasto automáticamente.
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
    id            SERIAL        PRIMARY KEY,
    supplier_id   INTEGER       NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    -- Relación 1:1 con expenses. Se crea en la misma transacción al confirmar la compra.
    expense_id    INTEGER       UNIQUE REFERENCES expenses(id) ON DELETE SET NULL,
    total_amount  DECIMAL(10,2) NOT NULL,
    purchase_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_purchases_amount CHECK (total_amount >= 0)
);

COMMENT ON TABLE purchases IS 'Ordenes de compra a proveedores.';
COMMENT ON COLUMN purchases.expense_id IS 'FK 1:1 al gasto generado automaticamente en expenses al confirmar la compra. Permite trazabilidad financiera.';

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id   ON purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases (purchase_date DESC);

-- ============================================================
-- TABLA 13: purchase_items
-- Detalle de productos incluidos en cada compra.
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id          SERIAL        PRIMARY KEY,
    -- CASCADE: eliminar items si se elimina la compra madre
    purchase_id INTEGER       NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id  INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    DECIMAL(10,2) NOT NULL,
    -- Precio unitario facturado en el momento de la compra (puede diferir del cost_price actual)
    unit_cost   DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_purchase_items_quantity  CHECK (quantity > 0),
    CONSTRAINT chk_purchase_items_unit_cost CHECK (unit_cost >= 0)
);

COMMENT ON TABLE purchase_items IS 'Detalle de productos adquiridos en cada compra. ON DELETE CASCADE con purchases.';
COMMENT ON COLUMN purchase_items.unit_cost IS 'Precio unitario facturado en el momento de la compra. Snapshot independiente del cost_price actual.';

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id  ON purchase_items (product_id);

-- ============================================================
-- AJUSTES Y ALTERACIONES
-- ============================================================

-- Trazabilidad inversa de gastos a compras
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS purchase_id INTEGER REFERENCES purchases(id) ON DELETE SET NULL;

-- Fecha de actualización de notas de clientas
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice para el dashboard de métricas (Self-service Booking Rate)
CREATE INDEX IF NOT EXISTS idx_bookings_origin ON bookings (origin);
