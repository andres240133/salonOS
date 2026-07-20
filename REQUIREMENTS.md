# SalonOS - Documento de Requerimientos de Producto (PRD)
**Versión:** 1.0.0  
**Fecha:** 2026-05-20  
**Estado:** Propuesto  
**Rol del Autor:** Senior Product Manager & Business Analyst  

---

## 1. Resumen Ejecutivo

### 1.1. Contexto del Negocio y Problema
El proyecto **SalonOS** nace para resolver la ineficiencia operativa de un salón de belleza unipersonal administrado por su propia dueña (estilista). Actualmente, la gestión de turnos se realiza de forma 100% manual a través de llamadas telefónicas y conversaciones no estructuradas en WhatsApp Business. Esto genera:
*   Pérdida de tiempo operativo durante la atención de clientes (la estilista debe interrumpir su trabajo para atender el teléfono).
*   Inasistencias (*no-shows*) no gestionadas debido a la falta de recordatorios automáticos.
*   Dificultad para trackear de forma fidedigna los ingresos, gastos y rentabilidad real del negocio.
*   Agenda suboptimizada con huecos de tiempo inutilizados.

### 1.2. Visión del Producto
SalonOS es una plataforma web ligera y optimizada para móviles que automatiza el proceso de reserva para las clientas y centraliza la administración operativa y financiera para la dueña. El sistema consta de dos superficies principales:
1.  **Web Pública:** Un sitio de marketing optimizado para SEO local que presenta el salón, sus servicios y redirige directamente a la reserva.
2.  **App Web PWA:** Una interfaz dual. Para la clienta, ofrece un flujo de reserva ultrarrápido sin registro en tres clics desde WhatsApp. Para la administradora, ofrece una consola privada de control de agenda, finanzas y base de clientes.

### 1.3. Objetivos Clave
*   Eliminar el 80% del tiempo dedicado a coordinar citas telefónicamente.
*   Reducir la tasa de inasistencia (*no-show*) por debajo del 5% mediante alertas automatizadas por WhatsApp.
*   Incrementar la facturación mensual mediante una mejor ocupación del calendario y visibilidad de precios.
*   Ofrecer visibilidad financiera total (ingresos netos vs. gastos categorizados).

---

## 2. Usuarios y Perfiles Detallados

### 2.1. Administradora (Dueña/Estilista)
*   **Nombre Representativo:** Estela (35 años)
*   **Contexto:** Trabaja sola en su salón. Su enfoque principal es la excelencia en el servicio (corte, color, peinado). No tiene tiempo para tareas administrativas complejas mientras atiende. Utiliza su celular constantemente para coordinar turnos.
*   **Necesidades Clave:**
    *   Ver rápidamente su agenda del día y de la semana de un vistazo en el celular.
    *   Bloquear horarios para imprevistos o descansos en dos clics.
    *   Registrar un cobro indicando el método de pago inmediatamente después de terminar un servicio.
    *   Ingresar gastos de insumos de manera sencilla para no perder el control de la caja.
*   **Nivel Tecnológico:** Medio. Acostumbrada a apps comerciales como Instagram, WhatsApp y aplicaciones bancarias básicas.

### 2.2. Clienta Final
*   **Nombre Representativo:** María (62 años) / Sofía (28 años)
*   **Contexto:** Clientes habituales u ocasionales del salón. Rango de edad de 25 a 70 años.
*   **Comportamiento:**
    *   **María (Mayor):** Baja alfabetización digital. Se siente frustrada si tiene que descargar una app de la App Store, recordar una contraseña o validar un correo electrónico. Si el proceso es complejo, prefiere llamar por teléfono o buscar otro salón.
    *   **Sofía (Joven):** Prefiere la inmediatez. Quiere reservar a las 11 PM desde su cama sin hablar con nadie, directamente abriendo un link desde el perfil de Instagram o WhatsApp del salón.
*   **Necesidades Clave:**
    *   Reservar un servicio en menos de 1 minuto sin crear una cuenta.
    *   Recibir confirmación instantánea y clara en su WhatsApp.
    *   Poder cancelar o reagendar fácilmente si surge un imprevisto sin fricción social.

---

## 3. Requerimientos Funcionales (RF)

### Módulo 1: Web Pública (Marketing & Landing Page)
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-001** | Presentación del Salón | La página de inicio debe mostrar el nombre del salón, una breve biografía/historia de la estilista y fotos de alta calidad. | Alta |
| **RF-002** | Catálogo de Servicios | Listado de servicios activos agrupados por categorías (ej. Corte, Color, Peinado, Tratamientos) con su duración estimada y precio visible. | Alta |
| **RF-003** | Galería de Trabajos | Galería de imágenes (portafolio de trabajos realizados) optimizada para carga rápida. | Media |
| **RF-004** | Call to Action (CTA) | Botón prominente "Reservar Turno" visible en el encabezado y al final de la navegación que redirige al flujo de reserva PWA. | Alta |
| **RF-005** | Datos de Contacto y SEO Local | Exposición clara de dirección física, mapa interactivo (Google Maps embed), enlaces a redes sociales y tags OpenGraph/Meta optimizados para SEO de Google Maps y búsquedas locales. | Alta |

### Módulo 2: Portal de Reservas (Clienta PWA)
*Este módulo opera sin registro ni login para la clienta, asegurando la mínima fricción.*

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-006** | Selección de Servicio | Interfaz visual para elegir uno o más servicios del catálogo. Muestra duración total y precio acumulado. | Alta |
| **RF-007** | Calendario de Disponibilidad | Calendario interactivo que muestra únicamente los días y horas disponibles en base a la configuración de la estilista y turnos ya tomados. | Alta |
| **RF-008** | Captura de Datos Mínimos | Formulario simplificado al final de la reserva que solicita únicamente: **Nombre Completo** y **Número de Teléfono (WhatsApp)**. | Alta |
| **RF-009** | Prevención de Sobre-reserva (Race Conditions) | Al momento de enviar el formulario, el backend debe verificar que el slot de tiempo sigue libre mediante bloqueos de base de datos (`SELECT FOR UPDATE` o similar). Si ya no está libre, debe advertir al usuario y sugerir otros horarios. | Alta |
| **RF-010** | Confirmación en Pantalla | Pantalla final con el resumen de la cita (servicio, fecha, hora) y un botón de enlace directo para chatear por WhatsApp en caso de dudas. | Alta |

### Módulo 3: Consola de Administración (Admin PWA)
*Acceso restringido únicamente para la dueña mediante login seguro.*

#### 3.1. Gestión de Agenda
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-011** | Autenticación Segura | Login con correo y contraseña. Implementación de JWT con Access Tokens de corta duración y Refresh Tokens seguros almacenados en cookies HTTP-only. | Alta |
| **RF-012** | Vista de Agenda Semanal/Diaria | Calendario interactivo que muestra las citas reservadas. Permite cambiar entre vista diaria (para el trabajo en el salón) y semanal (para planeación). | Alta |
| **RF-013** | Crear Cita Manual | Permite a la estilista registrar una cita recibida por fuera del sistema (ej. llamada directa o calle), ingresando datos de la clienta y asignando el slot. | Alta |
| **RF-014** | Gestión de Estados de Cita | Flujo de estados para cada cita: `Pendiente`, `Confirmada`, `Cancelada` y `Completada`. | Alta |
| **RF-015** | Bloqueo Horario Manual | Opción de bloquear rangos horarios específicos (ej. "Trámite personal", "Almuerzo") impidiendo que las clientas reserven en esos lapsos. | Alta |

#### 3.2. Finanzas y Cobros
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-016** | Registro de Cobros | Al marcar una cita como `Completada`, el sistema debe desplegar un modal para registrar el ingreso: monto cobrado (por defecto el precio del servicio, editable) y método de pago (Efectivo, Transferencia, Tarjeta). | Alta |
| **RF-017** | Registro de Gastos | Formulario para registrar egresos del salón: monto, fecha, descripción y categoría (ej. Insumos, Servicios Públicos, Alquiler, Marketing, Otros). | Alta |
| **RF-018** | Dashboard Financiero | Gráficas e indicadores clave de rendimiento (KPIs) financieros: Ingresos Totales, Gastos Totales e Ingresos Netos. Filtros por Semana, Mes y Año actual. | Alta |

#### 3.3. Configuración y Clientes
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-019** | Directorio de Clientas | Listado de todas las clientas únicas con buscador por nombre o teléfono. Cada ficha debe mostrar el historial de citas asistidas, canceladas e inasistencias (*no-shows*), además de notas técnicas (ej. "Tono de tintura utilizado: 7.3"). | Alta |
| **RF-020** | Configuración de Servicios | Panel para crear, editar, pausar (desactivar temporalmente) y eliminar servicios, definiendo nombre, precio, duración y categoría. | Alta |
| **RF-021** | Configuración de Horarios | Definición de la jornada laboral: días de la semana activos, horas de inicio y fin, y días libres fijos o excepcionales (vacaciones). | Alta |

### Módulo 4: Gestión de Inventario e Insumos
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-025** | Gestión de Proveedores | CRUD completo de proveedores de insumos del salón, permitiendo registrar su nombre, persona de contacto principal, número de teléfono, correo electrónico y condiciones de pago/entrega. | Alta |
| **RF-026** | Catálogo de Insumos | CRUD de productos del inventario vinculados a proveedores, especificando nombre, marca, precio de costo base, unidad de medida (ml, g, unidades), stock actual y stock mínimo para alertas. | Alta |
| **RF-027** | Registro de Compras y Gasto Automático | Permite registrar compras a proveedores seleccionando los productos e indicando cantidades y costos unitarios. Al confirmar, el sistema incrementa el stock de los productos correspondientes y genera automáticamente un registro de gasto en el balance financiero (RF-017) categorizado como "Insumos" por el monto total de la compra. | Alta |
| **RF-028** | Alertas de Stock Mínimo | Monitoreo en tiempo real de los insumos. Si el stock de un producto baja de su stock mínimo de alerta, el sistema debe disparar una alerta visual en el panel y en la campana de notificaciones. | Alta |
| **RF-029** | Tablero de Inventario Semafórico | Vista unificada de inventario con clasificación visual: Verde (Stock OK, mayor al mínimo), Amarillo (Stock Bajo, menor o igual al mínimo) y Rojo (Sin Stock, igual a cero). Incluye buscador por nombre/marca y filtros por estado. | Alta |

### Módulo 5: Motor de Notificaciones (WhatsApp Integration)
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **RF-022** | Alerta de Confirmación de Cita | Envío automático de un mensaje por WhatsApp a la clienta inmediatamente después de reservar con el detalle de la cita y políticas del salón. | Alta |
| **RF-023** | Recordatorio Automático (24 horas antes) | Proceso en segundo plano (cron job) que corre periódicamente y envía un WhatsApp a la clienta 24 horas antes de su cita, solicitando confirmación interactiva. | Alta |
| **RF-024** | Notificación de Cancelación | Envío de alerta si la administradora cancela la cita, o confirmación si la clienta la cancela. | Alta |

---

## 4. Requerimientos No Funcionales (RNF)

### 4.1. Usabilidad y Accesibilidad
*   **RNF-001 (Diseño Mobile-First):** El 90% de las visitas de las clientas y el 100% de la administración ocurrirá en dispositivos móviles. La interfaz debe ser completamente adaptativa y ergonómica para pulgares en pantallas táctiles de 360px a 430px de ancho.
*   **RNF-002 (Accesibilidad para Adultos Mayores):** Fuentes con tamaño mínimo de `16px` para textos de lectura y `18px` para inputs/botones. Contrastes de color que cumplan con la norma WCAG 2.1 AA. Botones con área táctil mínima de `48px x 48px`.
*   **RNF-003 (Soporte PWA):** La consola de administración y la web de reservas deben ser instalables como Progressive Web App (PWA) para acceso rápido desde la pantalla de inicio del celular.

### 4.2. Rendimiento
*   **RNF-004 (Velocidad de Carga):** Tiempo de carga inicial (First Contentful Paint) menor a 1.5 segundos en conexiones móviles 3G/4G normales.
*   **RNF-005 (Optimización de Imágenes):** Compresión automática de imágenes de la galería en formato WebP con lazy loading.

### 4.3. Seguridad y Privacidad
*   **RNF-006 (Seguridad en APIs):** Todas las solicitudes HTTP a los endpoints de administración deben requerir cabeceras `Authorization: Bearer <JWT>`. Los refresh tokens deben almacenarse en cookies seguras con flags `HttpOnly`, `Secure` y `SameSite=Strict`.
*   **RNF-007 (Privacidad de Clientas):** El número de teléfono y nombre de las clientas se considera información sensible (PII). No deben exponerse en endpoints públicos sin autenticación de administradora.
*   **RNF-008 (Cifrado de Datos):** Conexión HTTPS obligatoria para todo el tráfico de red (gestionado automáticamente mediante Railway SSL).

### 4.4. Concurrencia y Fiabilidad
*   **RNF-009 (Prevención de Doble Reserva):** El sistema debe garantizar consistencia transaccional estricta (Isolation Level `Read Committed` o `Serializable` según requiera la lógica del slot) para evitar que dos personas reserven el mismo horario en paralelo.

---

## 5. Modelo de Datos Conceptual

```
+------------------+          +-------------------+          +------------------+
|      Client      |          |      Booking      |          |     Service      |
+------------------+          +-------------------+          +------------------+
| id (PK)          |<--------1| client_id (FK)    |          | id (PK)          |
| name (encrypted) |          | service_id (FK)  1|--------->| name             |
| phone (encrypted)|          | scheduled_at      |          | price            |
| phone_hash (UQ)  |          | duration_minutes  |          | duration_minutes |
| notes            |          | status            |          | category         |
| created_at       |          | origin (ENUM)     |          | is_active        |
+------------------+          | notes             |          +------------------+
                              | created_at        |
                              +-------------------+
                                        | 1
                                        |
                                        v 0..1
+------------------+          +-------------------+          +------------------+
|     Supplier     |          |      Payment      |          |     Expense      |
+------------------+          +-------------------+          +------------------+
| id (PK)          |          | id (PK)           |          | id (PK)          |
| name             |          | booking_id (FK)   |          | description      |
| contact_name     |          | amount            |          | amount           |
| phone            |          | payment_method    |          | category         |
| email            |          | processed_at      |          | date             |
+------------------+          +-------------------+          +------------------+
   | 1        | 1                       ^                             ^
   |          |                         |                             | 1 (FK)
   |          +----------+              |                             |
   |                     |              +-----------------------------+
   v *                   v *
+------------------+  +-------------------+
|     Product      |  |     Purchase      |
+------------------+  +-------------------+
| id (PK)          |  | id (PK)           |
| supplier_id (FK) |  | supplier_id (FK)  |
| name             |  | expense_id (FK)   |
| cost_price       |  | total_amount      |
| current_stock    |  | purchase_date     |
| min_stock_alert  |  +-------------------+
+------------------+            | 1
   ^                            |
   | 1                          v *
   |                  +-------------------+
   |                  |   PurchaseItem    |
   |                  +-------------------+
   +------------------| purchase_id (FK)  |
                      | product_id (FK)   |
                      | quantity          |
                      | unit_cost         |
                      +-------------------+
```

### 5.1. Entidades y Atributos Detallados

#### 1. Administradoras (`stylist_users`)
Representa a la dueña del salón con acceso exclusivo a la administración.
*   `id` (UUID, Primary Key, Default `gen_random_uuid()`, Not Null)
*   `email` (VARCHAR(255), Unique, Not Null)
*   `password_hash` (VARCHAR(255), Not Null) - *Hash criptográfico seguro (Argon2id o bcrypt).*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 2. Servicios (`services`)
Catálogo de servicios ofrecidos por el salón.
*   `id` (SERIAL, Primary Key)
*   `name` (VARCHAR(100), Not Null)
*   `description` (TEXT, Nullable)
*   `price` (DECIMAL(10,2), Not Null) - *Costo base del servicio.*
*   `duration_minutes` (INTEGER, Not Null) - *Duración en bloques para control de agenda (ej. 30, 45, 60, 90).*
*   `category` (VARCHAR(50), Not Null) - *Agrupación (ej. 'Corte', 'Color', 'Tratamientos').*
*   `is_active` (BOOLEAN, Default `TRUE`, Not Null) - *Permite desactivar servicios sin romper registros históricos.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 3. Clientes (`clients`)
Directorio de clientas. Los datos de contacto personales están encriptados por privacidad.
*   `id` (SERIAL, Primary Key)
*   `name` (TEXT, Not Null) - *Nombre y apellido cifrado en reposo (AES-256-GCM).*
*   `phone` (TEXT, Not Null) - *Número telefónico cifrado en reposo (AES-256-GCM).*
*   `phone_hash` (VARCHAR(64), Unique, Not Null) - *Hash SHA-256 (con salt del sistema) del teléfono para búsquedas exactas sin desencriptación.*
*   `notes` (TEXT, Nullable) - *Historial técnico o comentarios generales visibles solo por la administradora.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 4. Citas/Reservas (`bookings`)
Registro y control de la agenda de turnos del salón.
*   `id` (UUID, Primary Key, Default `gen_random_uuid()`, Not Null)
*   `client_id` (INTEGER, Foreign Key -> `clients.id`, Not Null)
*   `service_id` (INTEGER, Foreign Key -> `services.id`, Not Null)
*   `scheduled_at` (TIMESTAMP WITH TIME ZONE, Not Null) - *Fecha y hora de inicio.*
*   `duration_minutes` (INTEGER, Not Null) - *Copia de la duración del servicio al momento de la reserva para blindar el registro histórico ante cambios en el catálogo.*
*   `status` (VARCHAR(20), Default 'pending', Not Null) - *Valores: `pending`, `confirmed`, `cancelled`, `completed`.*
*   `origin` (VARCHAR(20), Default 'self_service', Not Null) - *Valores: `self_service` (agendado por la clienta vía PWA pública) o `manual_admin` (creado manualmente por la estilista).*
*   `notes` (TEXT, Nullable) - *Notas de comentarios ingresadas por la clienta.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 5. Pagos (`payments`)
Flujo de caja de ingresos asociados a las citas completadas.
*   `id` (SERIAL, Primary Key)
*   `booking_id` (UUID, Foreign Key -> `bookings.id`, Unique, Not Null) - *Relación estricta 1:1.*
*   `amount` (DECIMAL(10,2), Not Null) - *Monto cobrado final (por defecto hereda precio de servicio pero es editable).*
*   `payment_method` (VARCHAR(20), Not Null) - *Valores: `cash`, `transfer`, `card`.*
*   `processed_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 6. Gastos (`expenses`)
Registro de egresos operativos para el balance de caja mensual.
*   `id` (SERIAL, Primary Key)
*   `description` (VARCHAR(255), Not Null)
*   `amount` (DECIMAL(10,2), Not Null)
*   `category` (VARCHAR(50), Not Null) - *Valores: `supplies` (insumos), `rent` (alquiler), `utilities` (servicios), `marketing`, `other`.*
*   `date` (DATE, Not Null) - *Fecha en la que se incurrió o pagó el gasto.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 7. Horarios de Trabajo (`business_hours`)
Definición de disponibilidad general del salón.
*   `id` (SERIAL, Primary Key)
*   `day_of_week` (INTEGER, Not Null) - *De 0 (Domingo) a 6 (Sábado).*
*   `start_time` (TIME, Not Null) - *Hora de inicio laboral (ej. 09:00:00).*
*   `end_time` (TIME, Not Null) - *Hora de finalización laboral (ej. 18:00:00).*
*   `is_active` (BOOLEAN, Default `TRUE`, Not Null) - *Define si el día está laborable en la agenda.*

#### 8. Bloqueos Horarios Excepcionales (`time_blocks`)
Periodos sin atención programable (ej. feriados, vacaciones o citas personales).
*   `id` (SERIAL, Primary Key)
*   `description` (VARCHAR(255), Nullable)
*   `start_at` (TIMESTAMP WITH TIME ZONE, Not Null)
*   `end_at` (TIMESTAMP WITH TIME ZONE, Not Null)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 9. Logs de Auditoría (`audit_logs`)
Control y seguimiento de acciones en la consola administrativa.
*   `id` (SERIAL, Primary Key)
*   `user_id` (UUID, Foreign Key -> `stylist_users.id`, Nullable) - *Null en fallos de autenticación.*
*   `action` (VARCHAR(100), Not Null) - *Acción ejecutada (ej. `login_success`, `login_failed`, `change_prices`).*
*   `ip_address_hash` (VARCHAR(64), Not Null) - *Dirección IP del cliente anonimizada mediante hash SHA-256.*
*   `user_agent` (TEXT, Nullable) - *Identificador del navegador/dispositivo.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 10. Proveedores (`suppliers`)
Directorio de proveedores del salón para compra de insumos.
*   `id` (SERIAL, Primary Key)
*   `name` (VARCHAR(150), Not Null) - *Nombre comercial del proveedor (ej. 'SuperSalón', 'Salerm').*
*   `contact_name` (VARCHAR(150), Nullable) - *Persona de contacto principal.*
*   `phone` (VARCHAR(50), Nullable) - *Número de teléfono.*
*   `email` (VARCHAR(255), Nullable) - *Correo electrónico.*
*   `payment_terms` (TEXT, Nullable) - *Condiciones de pago y entrega (ej. 'Contado', 'Crédito 30 días').*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 11. Productos e Insumos (`products`)
Catálogo de productos de belleza y consumibles en el salón.
*   `id` (SERIAL, Primary Key)
*   `supplier_id` (INTEGER, Foreign Key -> `suppliers.id`, Not Null) - *Proveedor que lo suministra.*
*   `name` (VARCHAR(150), Not Null) - *Nombre comercial del producto.*
*   `brand` (VARCHAR(100), Nullable) - *Marca del producto.*
*   `cost_price` (DECIMAL(10,2), Not Null) - *Precio unitario de costo de adquisición.*
*   `unit_of_measure` (VARCHAR(20), Not Null) - *Unidad de medida (ej. 'ml', 'g', 'unidades').*
*   `current_stock` (DECIMAL(10,2), Default `0.00`, Not Null) - *Inventario actual.*
*   `minimum_stock_alert` (DECIMAL(10,2), Default `0.00`, Not Null) - *Cantidad mínima antes de activar alertas.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 12. Compras (`purchases`)
Órdenes de compra registradas. Cada orden genera automáticamente un registro de gasto.
*   `id` (SERIAL, Primary Key)
*   `supplier_id` (INTEGER, Foreign Key -> `suppliers.id`, Not Null) - *Proveedor de la compra.*
*   `expense_id` (INTEGER, Foreign Key -> `expenses.id`, Unique, Nullable) - *Relación 1:1 con el gasto financiero generado automáticamente.*
*   `total_amount` (DECIMAL(10,2), Not Null) - *Costo total acumulado.*
*   `purchase_date` (DATE, Default `CURRENT_DATE`, Not Null) - *Fecha de la compra.*
*   `created_at` (TIMESTAMP WITH TIME ZONE, Default `CURRENT_TIMESTAMP`, Not Null)

#### 13. Detalle de Compra (`purchase_items`)
Desglose de productos adquiridos dentro de una compra.
*   `id` (SERIAL, Primary Key)
*   `purchase_id` (INTEGER, Foreign Key -> `purchases.id`, On Delete Cascade, Not Null) - *Vínculo a la compra.*
*   `product_id` (INTEGER, Foreign Key -> `products.id`, Not Null) - *Vínculo al catálogo.*
*   `quantity` (DECIMAL(10,2), Not Null) - *Cantidad comprada.*
*   `unit_cost` (DECIMAL(10,2), Not Null) - *Costo unitario facturado.*

---

## 6. Flujos de Usuario Críticos

### Flujo 1: Clienta Reserva desde WhatsApp Link
1.  **Origen:** La clienta hace clic en el link `salonos.app/reservar` presente en el perfil de WhatsApp Business del salón.
2.  **Paso 1 (Servicio):** Abre la PWA móvil en la pantalla de selección de servicios. La clienta selecciona "Corte + Balayage" y ve el precio y duración total. Presiona "Siguiente".
3.  **Paso 2 (Fecha y Hora):** Se muestra un calendario del mes corriente. Los días sin disponibilidad se ven deshabilitados. Selecciona el jueves 22 de mayo. Se despliegan los slots horarios de 40 minutos disponibles (ej. 10:00, 11:30, 15:00). Selecciona "10:00". Presiona "Siguiente".
4.  **Paso 3 (Datos de Contacto):** La interfaz le pide solo dos campos: Nombre (ej. "María Gómez") y WhatsApp (ej. "1122334455"). Opcionalmente un campo de comentarios. Presiona "Confirmar Cita".
5.  **Paso 4 (Procesamiento y Race Condition):**
    *   El backend abre una transacción de base de datos.
    *   Comprueba si a las 10:00 del jueves 22 de mayo la estilista está disponible para un servicio de 90 minutos (duración estimada).
    *   Si está disponible, registra el cliente (o busca si el teléfono ya existe), inserta la fila en `bookings` con estado `pending` y confirma la transacción.
6.  **Paso 5 (Confirmación):** La pantalla muestra: *"¡Turno reservado con éxito, María! Te enviamos los detalles a tu WhatsApp"*.
7.  **Paso 6 (Mensajería):** El motor de notificaciones despacha un mensaje por la API de WhatsApp Cloud: *"Hola María, tu cita para Corte + Balayage el día Jueves 22/05 a las 10:00 hs ha sido registrada. ¡Te esperamos!"*

### Flujo 2: Administradora Completa Cita y Registra Pago
1.  **Inicio de Jornada:** Estela abre la PWA de SalonOS en su celular. Entra con sus credenciales y ve la agenda del día. Ve la cita de María Gómez a las 10:00 en color amarillo (`pending` o `confirmed`).
2.  **Atención:** María llega y se realiza el servicio.
3.  **Cierre de Cita:** Al terminar, Estela abre el detalle de la cita de María en su celular y presiona el botón "Completar Cita".
4.  **Registro Financiero:** Se abre un modal simplificado preguntando: *"¿Cuánto cobraste?"* pre-cargado con el valor del servicio (ej. `$50.00`). Estela selecciona el método de pago *"Transferencia"* y presiona "Guardar".
5.  **Actualización:**
    *   La cita cambia de estado a `completed`.
    *   Se crea un registro asociado en la tabla `payments`.
    *   El Dashboard Financiero actualiza instantáneamente el indicador de "Ingresos del Día".

### Flujo 3: Recordatorio y Confirmación Automática
1.  **Cron Job:** Cada hora, un servicio automático en Railway busca citas en estado `pending` o `confirmed` que estén programadas para iniciar exactamente dentro de 24 horas.
2.  **Disparo:** Encuentra la cita de Sofía programada para el día siguiente a las 16:00 hs.
3.  **Envío de Mensaje:** Envía un mensaje interactivo mediante WhatsApp Cloud API con dos botones:
    *   `[Confirmar Cita]`
    *   `[Cancelar Cita]`
4.  **Respuesta del Cliente:**
    *   Si Sofía presiona `[Confirmar Cita]`, la WhatsApp API envía un webhook al backend de SalonOS, el cual cambia el estado del booking a `confirmed`. Estela ve la cita en verde en su agenda.
    *   Si presiona `[Cancelar Cita]`, el webhook cambia el estado a `cancelled`. El horario se libera inmediatamente en el calendario público, y Estela recibe una alerta silenciosa en su consola.

---

## 7. Criterios de Aceptación por Módulo

### Web Pública
*   Debe cargarse correctamente en Chrome, Safari y Edge en menos de 2 segundos.
*   Debe puntuar >90 en accesibilidad y rendimiento en Google Lighthouse.
*   El botón de reserva debe abrir directamente la vista de selección de servicio sin redirecciones extrañas.

### Portal de Reservas
*   No debe existir ningún botón de "Registrarse" o "Iniciar Sesión" para las clientas.
*   Si dos clientas intentan reservar la misma hora al mismo tiempo, el sistema debe retornar un código de error de concurrencia al segundo intento en milisegundos y forzar la selección de otro slot sin duplicar registros.
*   El campo de número de teléfono debe validar códigos de área internacionales utilizando una librería de parseo telefónico (ej. `libphonenumber-js`).

### Consola de Administración
*   El token JWT debe expirar en 15 minutos, y el refresh token en 7 días. Si el token expira en medio del uso, el frontend debe renovarlo en segundo plano de manera transparente usando el refresh token.
*   La agenda semanal debe tener drag-and-drop o controles simples táctiles para mover una cita de horario de manera rápida.
*   El Dashboard Financiero debe permitir exportar los datos de ingresos y gastos a formato CSV para uso contable externo.

### Notificaciones de WhatsApp
*   Todos los números telefónicos enviados deben estar normalizados a formato E.164.
*   Si la API de WhatsApp Cloud retorna un error 400 (número inválido), el sistema debe registrar una alerta en la ficha de la clienta dentro de SalonOS para que la administradora lo corrija manualmente.

---

## 8. Restricciones y Suposiciones

### Restricciones Técnicas
1.  **Canal Único de Mensajería:** Dependencia exclusiva de la API oficial de WhatsApp Cloud de Meta. Se requiere una cuenta comercial configurada (Meta Business Suite).
2.  **Base de Datos Relacional:** Se usará PostgreSQL de forma mandatoria para asegurar transacciones ACID y evitar duplicidades de reservas mediante bloqueos de fila (`SELECT ... FOR UPDATE`).
3.  **Autonomía de Hosting:** Railway es la única plataforma de hosting requerida para backend, frontend y base de datos, garantizando simplicidad operativa.

### Suposiciones de Negocio
1.  La estilista trabajará sola (unipersonal), por lo que no es necesario diseñar soporte multi-calendario o asignación de empleados en la Fase 1.
2.  Las clientas no pagan online en esta fase; el pago se realiza físicamente en el local (efectivo, transferencia o tarjeta por terminal posnet física), y se registra manualmente en el sistema al finalizar la cita.

---

## 9. Métricas de Éxito del Producto

Para medir la efectividad de SalonOS una vez desplegado en producción, se evaluarán las siguientes métricas bimestrales:

1.  **Tasa de Auto-reserva (Self-service Booking Rate):** 
    $$\text{Tasa} = \frac{\text{Citas reservadas vía Web PWA}}{\text{Total de citas registradas}} \times 100$$
    *Meta:* $> 70\%$ de citas auto-gestionadas en los primeros 3 meses.
2.  **Tasa de Inasistencias (No-Show Rate):**
    $$\text{No-Show Rate} = \frac{\text{Citas categorizadas como inasistencias}}{\text{Total de citas agendadas}} \times 100$$
    *Meta:* $< 4\%$ (línea de base previa estimada en 15%).
3.  **Tiempo de Coordinación Ahorrado:**
    Minutos estimados que la estilista solía pasar al teléfono vs. tiempo actual interactuando con la agenda.
    *Meta:* Reducción de 2 horas semanales a menos de 10 minutos.
4.  **Tasa de Adopción Digital de la Clientela Mayor:**
    Porcentaje de clientas mayores de 55 años que completan su reserva online de forma exitosa en su primer intento.
    *Meta:* $> 60\%$ de éxito sin recurrir a llamada telefónica asistida.

---

## 10. Requerimientos de Seguridad

Para proteger la integridad de los datos financieros del salón y la privacidad de las clientas, se implementarán las siguientes medidas de seguridad obligatorias:

### 10.1. Encriptación de Datos de Clientas en Reposo (PII)
*   **Mecanismo:** Las columnas `name` y `phone` en la tabla `clients` se encriptarán usando el algoritmo de cifrado simétrico **AES-256-GCM** antes de insertarse en la base de datos.
*   **Gestión de Claves:** La clave de encriptación (`ENCRYPTION_KEY`) se inyectará como variable de entorno segura en Railway y nunca debe guardarse en el código fuente.
*   **Indexación y Búsqueda:** Para permitir búsquedas rápidas (por número de teléfono) y garantizar la unicidad de las clientas sin desencriptar toda la tabla secuencialmente, se utilizará una columna ciega indexada llamada `phone_hash`. Esta columna contendrá el hash **SHA-256** del teléfono concatenado con un salt fijo del sistema (`phone + SYSTEM_SALT`).

### 10.2. Hashing en Logs de Auditoría
*   **Anonimización:** La tabla `audit_logs` debe registrar información de accesos y fallos de login. Para cumplir con el principio de minimización de datos y regulaciones de privacidad, la dirección IP pública del cliente no debe almacenarse en texto plano.
*   **Política de Hashing:** Se guardará un hash SHA-256 de la dirección IP (`SHA-256(ip + AUDIT_SALT)`). Esto permite a la administradora identificar correlaciones de ataques de fuerza bruta de un mismo host sin comprometer la dirección IP real de las usuarias en la base de datos.

### 10.3. Rate Limiting en Endpoints Públicos
*   **API Pública de Reservas:** Se aplicará un límite de tráfico en los endpoints de consulta de disponibilidad y creación de reservas:
    *   Máximo 30 solicitudes de consulta por IP cada 15 minutos.
    *   Máximo 5 intentos de reserva exitosos o fallidos por IP cada hora.
*   **API de Autenticación de Administradora:** Para el login de la estilista:
    *   Máximo 5 intentos de login fallidos en 15 minutos por email e IP.
    *   Si se supera el límite, la cuenta del email afectado se bloqueará temporalmente durante 15 minutos y se registrará un evento `login_failed_lockout` en `audit_logs`.

### 10.4. Protecciones OWASP Obligatorias
*   **SQL Injection (SQLi):** Queda prohibida la concatenación directa de cadenas en consultas SQL. Todo acceso a la base de datos debe realizarse mediante un Query Builder o un ORM con consultas completamente parametrizadas.
*   **Cross-Site Scripting (XSS):**
    *   React escapa automáticamente las variables renderizadas en el DOM. En caso de usar propiedades especiales como `dangerouslySetInnerHTML`, la entrada debe sanitizarse con la librería `dompurify` en el frontend y backend.
    *   Implementación de cabeceras HTTP de seguridad robustas usando `Helmet` en el backend Express (incluyendo una política `Content-Security-Policy` estricta).
*   **Cross-Site Request Forgery (CSRF):**
    *   Dado que el backend se comunica vía API REST usando cabeceras `Authorization: Bearer <JWT>` enviadas por código, los métodos de mutación (POST, PUT, DELETE) están naturalmente protegidos de ataques CSRF clásicos basados en navegador.
    *   Para la cookie del `Refresh Token`, se aplicarán las flags de seguridad detalladas en la sección 10.5.

### 10.5. Política de Cookies Seguras para Refresh Tokens
El backend emitirá dos tokens al autenticarse exitosamente:
1.  **Access Token (JWT):** Validez corta (15 minutos). Almacenado exclusivamente en la memoria local del frontend (estado de React), previniendo que sea accesible en caso de vulnerabilidades XSS persistentes.
2.  **Refresh Token:** Validez larga (7 días). Almacenado en una cookie de respuesta HTTP emitida por el backend bajo las siguientes directivas obligatorias:
    *   `HttpOnly`: Previene que cualquier script JavaScript (incluyendo scripts maliciosos XSS) pueda leer la cookie.
    *   `Secure`: La cookie solo se transmite mediante conexiones encriptadas HTTPS.
    *   `SameSite=Strict`: Evita que el navegador envíe la cookie en solicitudes iniciadas desde otros sitios web, mitigando ataques CSRF.
    *   `Path=/api/auth/refresh`: Limita el alcance de envío de la cookie únicamente al endpoint responsable de la renovación de tokens.

### 10.6. Análisis Estático de Vulnerabilidades (SAST)
*   **Auditoría de Dependencias:** Integrar `npm audit` o `audit-ci` en los flujos de CI/CD para que cualquier dependencia de Node.js con vulnerabilidades de nivel alto o crítico bloquee automáticamente el pipeline de compilación.
*   **Escaneo de Código:** Configuración de herramientas de análisis estático SAST automatizadas en el repositorio (ej. SonarQube o GitHub CodeQL) para escanear el código en búsqueda de patrones de programación inseguros en cada Pull Request a la rama principal (`main`).

---

## 11. Arquitectura de Carpetas del Monorepo

El desarrollo de SalonOS se estructurará bajo un esquema de monorepo gestionado con workspaces de `npm`. Esto permite compartir esquemas, variables y utilidades manteniendo una clara separación lógica y facilidad de despliegue en Railway.

```
salonos/
├── .github/                       # Configuración de GitHub Actions
│   └── workflows/
│       └── ci-cd.yml              # Pipeline de integración y despliegue continuo (SAST + Test)
├── docs/                          # Documentación del proyecto (Fuentes de verdad)
│   ├── api/                       # Colecciones e instrumentos de API (OpenAPI 3.0 / Swagger)
│   ├── database/                  # Diseños de diagramas de BD y scripts de migración
│   └── REQUIREMENTS.md            # Este documento de requerimientos
├── packages/
│   ├── backend/                   # Servidor de API (Node.js + Express + PostgreSQL)
│   │   ├── src/
│   │   │   ├── config/            # Configuración de BD, variables de entorno y WhatsApp API
│   │   │   ├── controllers/       # Controladores de solicitudes HTTP (lógica de endpoints)
│   │   │   ├── middlewares/       # Auth (JWT), Rate Limiting, Seguridad (Helmet) y Errores
│   │   │   ├── models/            # Definición lógica de tablas y queries SQL parametrizadas
│   │   │   ├── routes/            # Definición y mapeo de endpoints
│   │   │   ├── services/          # Lógica de negocio pesada (Notificaciones WA, Cifrado, Cron)
│   │   │   └── app.ts             # Inicialización de la aplicación Express
│   │   ├── tests/                 # Pruebas automatizadas del Backend (Jest + Supertest)
│   │   ├── Dockerfile             # Configuración de compilación para Railway Backend
│   │   └── package.json
│   │
│   ├── frontend-public/           # Web Pública de Marketing (Vite + React + CSS/Tailwind)
│   │   ├── public/                # Recursos públicos estáticos e imágenes optimizadas
│   │   ├── src/
│   │   │   ├── components/        # Componentes UI (Menú, Galería de trabajos, Contacto)
│   │   │   ├── pages/             # Landing page y vistas informativas de servicios
│   │   │   ├── styles/            # Hojas de estilo globales (index.css con Tailwind)
│   │   │   └── main.tsx           # Punto de entrada de React
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── frontend-pwa/              # App Web PWA Dual (Reservas Clientas / Consola Administradora)
│       ├── public/                # Manifest de PWA, Service Worker, iconos responsivos
│       ├── src/
│       │   ├── components/        # Componentes reusables (Botones accesibles, modales, alertas)
│       │   ├── hooks/             # Custom React Hooks (useAuth, useBookings, etc.)
│       │   ├── layouts/           # Marcos visuales diferenciados (Clienta vs. Panel Administrador)
│       │   ├── pages/             # Vistas de reserva, Login, Dashboard financiero, Agenda, Clientes
│       │   ├── services/          # Clientes HTTP y llamadas al backend (axios o fetch)
│       │   ├── store/             # Manejo de estado global en el cliente (Zustand)
│       │   ├── styles/            # Estilos de la PWA (index.css con Tailwind y variables HSL)
│       │   └── main.tsx           # Punto de entrada y registro de Service Worker
│       ├── package.json
│       └── vite.config.ts
│
├── package.json                   # Definición de workspaces y scripts globales del monorepo
└── README.md                      # Instrucciones de instalación y desarrollo local
```
