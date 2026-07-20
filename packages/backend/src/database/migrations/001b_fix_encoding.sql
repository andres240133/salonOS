-- ============================================================
-- SalonOS — Migración 001b: Corrección de Encoding en Comentarios
--
-- Contexto: la migración 001 original se aplicó vía
-- `Get-Content | docker exec` desde PowerShell, lo cual corrompió
-- los caracteres acentuados (á, é, í, ó, ú, ñ) en todos los
-- COMMENT ON TABLE/COLUMN. Este script no toca ninguna tabla,
-- columna, constraint ni dato — únicamente reemplaza los
-- comentarios de documentación con la ortografía correcta.
--
-- Ejecutar con docker cp + docker exec -f (NUNCA con Get-Content | pipe),
-- para no repetir el mismo problema de encoding.
-- ============================================================

-- stylist_users -------------------------------------------------

COMMENT ON TABLE stylist_users IS 'Usuarios administradores del salón. Fase 1: solo un registro (la dueña).';
COMMENT ON COLUMN stylist_users.password_hash IS 'Hash bcrypt (cost 12). Nunca almacenar contraseña en texto plano.';

-- services --------------------------------------------------------

COMMENT ON TABLE services IS 'Catálogo de servicios del salón. Soft-delete con is_active=false.';
COMMENT ON COLUMN services.duration_minutes IS 'Duración en minutos usada para calcular slots de disponibilidad en la agenda.';
COMMENT ON COLUMN services.is_active IS 'false permite desactivar el servicio sin romper registros históricos de bookings.';

-- clients -----------------------------------------------------------

COMMENT ON TABLE clients IS 'Directorio de clientas. name y phone cifrados en reposo (AES-256-GCM).';
COMMENT ON COLUMN clients.name IS 'Nombre completo cifrado con AES-256-GCM. Descifrar en capa de aplicación.';
COMMENT ON COLUMN clients.phone IS 'Teléfono en formato E.164 cifrado con AES-256-GCM. Descifrar en capa de aplicación.';
COMMENT ON COLUMN clients.phone_hash IS 'SHA-256(phone_e164 || SYSTEM_SALT). Para búsqueda exacta e identificación única sin descifrar toda la tabla.';

-- bookings ------------------------------------------------------------

COMMENT ON TABLE bookings IS 'Agenda de citas del salón. UUID como PK previene enumeración de IDs en URLs públicas.';
COMMENT ON COLUMN bookings.duration_minutes IS 'Copia snapshot del servicio al reservar. Protege el historial si el catálogo cambia.';
COMMENT ON COLUMN bookings.origin IS 'self_service: reserva vía PWA pública. manual_admin: creada por la estilista.';
COMMENT ON COLUMN bookings.status IS 'Flujo de estado: pending → confirmed → completed | cancelled.';

-- payments --------------------------------------------------------------

COMMENT ON TABLE payments IS 'Registro de ingresos del salón. Relación 1:1 con bookings (UNIQUE en booking_id).';
COMMENT ON COLUMN payments.amount IS 'Monto real cobrado. Puede diferir del precio del servicio (descuentos, propinas).';

-- expenses ----------------------------------------------------------------

COMMENT ON TABLE expenses IS 'Registro de egresos operativos para el balance de caja.';
COMMENT ON COLUMN expenses.category IS 'supplies=insumos (generado auto al registrar compra), rent=alquiler, utilities=servicios, marketing, other.';

-- business_hours -------------------------------------------------------------

COMMENT ON TABLE business_hours IS 'Jornada laboral base. Un registro por día de semana. Modificar is_active=false para días de descanso.';
COMMENT ON COLUMN business_hours.day_of_week IS '0=Domingo, 1=Lunes, ..., 6=Sábado. Convención ISO de JavaScript.';

-- time_blocks -----------------------------------------------------------------

COMMENT ON TABLE time_blocks IS 'Bloqueos manuales de agenda. Impiden que las clientas reserven en esos rangos temporales.';

-- audit_logs --------------------------------------------------------------------

COMMENT ON TABLE audit_logs IS 'Log de auditoría de accesos y acciones administrativas.';
COMMENT ON COLUMN audit_logs.ip_address_hash IS 'SHA-256(ip || AUDIT_SALT). Anonimización para cumplir principio de minimización de datos.';
COMMENT ON COLUMN audit_logs.user_id IS 'NULL en fallos de autenticación donde el usuario no fue identificado aún.';

-- suppliers -----------------------------------------------------------------------

COMMENT ON TABLE suppliers IS 'Directorio de proveedores de insumos del salón.';
COMMENT ON COLUMN suppliers.payment_terms IS 'Condiciones de pago y entrega en texto libre. Ej: Contado, Crédito 30 días.';

-- products --------------------------------------------------------------------------

COMMENT ON TABLE products IS 'Catálogo de insumos del salón con control de stock.';
COMMENT ON COLUMN products.current_stock IS 'Stock actual. Se incrementa al registrar compras y puede decrementarse manualmente.';
COMMENT ON COLUMN products.minimum_stock_alert IS 'Cantidad umbral para activar alerta de stock bajo en el panel de inventario.';

-- purchases -----------------------------------------------------------------------------

COMMENT ON TABLE purchases IS 'Órdenes de compra a proveedores.';
COMMENT ON COLUMN purchases.expense_id IS 'FK 1:1 al gasto generado automáticamente en expenses al confirmar la compra. Permite trazabilidad financiera.';

-- purchase_items ------------------------------------------------------------------------------

COMMENT ON TABLE purchase_items IS 'Detalle de productos adquiridos en cada compra. ON DELETE CASCADE con purchases.';
COMMENT ON COLUMN purchase_items.unit_cost IS 'Precio unitario facturado en el momento de la compra. Snapshot independiente del cost_price actual.';
