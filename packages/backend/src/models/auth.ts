import { pool } from '../config/database.js';

export interface StylistUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface AuditLogData {
  userId: string | null;
  action: string;
  ipAddressHash: string;
  userAgent: string | null;
}

/**
 * Busca un usuario administrador por email.
 * Retorna null si no existe — el llamador nunca debe revelar
 * si el email está registrado o no.
 */
export async function findByEmail(email: string): Promise<StylistUser | null> {
  const { rows } = await pool.query<StylistUser>(
    'SELECT id, email, password_hash, created_at FROM stylist_users WHERE email = $1 LIMIT 1',
    [email],
  );

  return rows[0] ?? null;
}

/**
 * Registra una entrada en el log de auditoría.
 * Las IPs deben estar hasheadas ANTES de llegar aquí — este módulo
 * no realiza hashing, esa responsabilidad es del controller.
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, ip_address_hash, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [data.userId, data.action, data.ipAddressHash, data.userAgent],
  );
}

// ── Refresh Tokens ──────────────────────────────────────────

/** Persiste el hash SHA-256 de un refresh token recién emitido. */
export async function saveRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

/** Revoca un refresh token específico por su hash. */
export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
    [tokenHash],
  );
}

/**
 * Verifica que un refresh token exista, no esté revocado y no haya expirado.
 * Una sola query con las tres condiciones para minimizar round-trips.
 */
export async function isRefreshTokenValid(tokenHash: string): Promise<boolean> {
  const { rows } = await pool.query<{ valid: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
     ) AS valid`,
    [tokenHash],
  );

  return rows[0].valid;
}

/**
 * Revoca todos los refresh tokens de un usuario.
 * Útil para "cerrar sesión en todos los dispositivos".
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
