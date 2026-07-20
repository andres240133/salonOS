-- ============================================================
-- SalonOS — Migración 003: Refresh Tokens
-- Persistencia de refresh tokens para rotation real y
-- revocación efectiva en logout.
-- Ejecutar con: psql $DATABASE_URL -f 003_refresh_tokens.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL      PRIMARY KEY,
    -- UUID porque stylist_users.id es UUID
    user_id     UUID        NOT NULL REFERENCES stylist_users(id)
                            ON DELETE CASCADE,
    -- SHA-256 del token JWT. Nunca almacenar el token en claro.
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
    ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash
    ON refresh_tokens (token_hash);

-- Facilita el job de limpieza de tokens expirados hace >30 días
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_cleanup
    ON refresh_tokens (expires_at)
    WHERE revoked_at IS NULL;
