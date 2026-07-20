# SalonOS

Plataforma web completa para la gestión operativa de un salón de belleza unipersonal.
Monorepo con npm workspaces: backend API + web pública de marketing + PWA dual (reservas / administración).

## Arquitectura del Monorepo

```
salonos/
├── packages/
│   ├── backend/          # Node.js + Express + PostgreSQL API
│   ├── frontend-public/  # Web pública de marketing (Vite + React)
│   └── frontend-pwa/     # PWA dual clientas/admin (Vite + React + Zustand)
├── .env.example          # Plantilla de variables de entorno
└── package.json          # Workspaces root
```

## Requisitos

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 15 (o instancia Railway)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd salonos

# 2. Instalar todas las dependencias del monorepo
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de Entorno)

# 4. Ejecutar la migración inicial de la base de datos
# Ejecutar todas las migraciones en orden
cd packages/backend/src/database/migrations

# IMPORTANTE: usar docker cp en vez de pipe de PowerShell para preservar UTF-8
docker cp 001_initial_schema.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/001_initial_schema.sql
docker cp 002_availability_model.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/002_availability_model.sql
docker cp 003_refresh_tokens.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/003_refresh_tokens.sql
docker cp 004_recordatorio_log.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/004_recordatorio_log.sql
docker cp 005_services_seed.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/005_services_seed.sql
docker cp 006_manual_income.sql salonos-postgres:/tmp/ && docker exec -i salonos-postgres psql -U postgres -d salonos_db -f /tmp/006_manual_income.sql

# 5. Levantar todos los servicios en modo desarrollo
npm run dev
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Levanta backend + ambos frontends en paralelo |
| `npm run dev:backend` | Solo el servidor Express (puerto 3000) |
| `npm run dev:public` | Solo la web pública (puerto 5173) |
| `npm run dev:pwa` | Solo la PWA (puerto 5174) |
| `npm run build` | Build de producción de todos los paquetes |
| `npm run test` | Ejecuta tests en todos los paquetes |
| `npm run audit:ci` | Auditoría de seguridad de dependencias |

## Variables de Entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión PostgreSQL | ✅ |
| `JWT_SECRET` | Secret para firmar access tokens (64 bytes hex) | ✅ |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (64 bytes hex) | ✅ |
| `ENCRYPTION_KEY` | Clave AES-256-GCM para PII (32 bytes hex) | ✅ |
| `SYSTEM_SALT` | Salt para `phone_hash` (32 bytes hex) | ✅ |
| `AUDIT_SALT` | Salt para hashing de IPs en audit_logs | ✅ |
| `WHATSAPP_TOKEN` | Token de acceso permanente de WhatsApp Cloud API | ✅ |
| `WHATSAPP_PHONE_ID` | ID del número de teléfono de WhatsApp Business | ✅ |
| `WHATSAPP_WEBHOOK_SECRET` | Token de verificación para webhooks de Meta | ✅ |

> ⚠️ **Seguridad:** El archivo `.env` está en `.gitignore`. No se commitea. En Railway, configurar estas variables directamente en el panel de Variables de Entorno del servicio.

## Base de Datos

Ejecutar la migración inicial para crear todas las tablas:

```bash
psql $DATABASE_URL -f packages/backend/src/database/migrations/001_initial_schema.sql
```

Esto crea el esquema completo con todas las tablas, índices, constraints y comentarios SQL.

## Despliegue en Railway

Cada paquete tiene su propio `Dockerfile` para despliegue independiente:
- `packages/backend/Dockerfile` → Servicio API
- `packages/frontend-public/` → Servicio estático (Vite build)
- `packages/frontend-pwa/` → Servicio estático (Vite build)

## Seguridad

- PII (nombre y teléfono de clientas) cifrado en reposo con AES-256-GCM
- Tokens JWT de corta duración (15min) + Refresh Tokens en cookies HttpOnly
- Rate limiting en endpoints públicos y de autenticación
- Hashing SHA-256 de IPs en audit_logs (anonimización)
- Headers de seguridad con Helmet (CSP, HSTS, etc.)
- Consultas SQL parametrizadas (zero SQL injection)
