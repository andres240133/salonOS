import type { Request, Response } from 'express';
import { z } from 'zod';
import { verifyPassword, hashIP, hashToken } from '../services/crypto.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/jwt.js';
import {
  findByEmail,
  createAuditLog,
  saveRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
} from '../models/auth.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const REFRESH_COOKIE = 'refresh_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Extrae la IP del cliente respetando X-Forwarded-For cuando hay proxy.
 * Devuelve un string determinista apto para hashear.
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function getUserAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null;
}

/**
 * Configura la cookie del refresh token con las protecciones
 * HttpOnly + Secure + SameSite=Strict + path restringido.
 */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  });
}

/**
 * POST /api/auth/login
 *
 * Respuestas deliberadamente vagas ante credenciales inválidas
 * para no confirmar existencia de cuentas.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos de login inválidos' });
    return;
  }

  const { email, password } = parsed.data;
  const ipHash = hashIP(getClientIP(req));
  const userAgent = getUserAgent(req);

  const user = await findByEmail(email);

  if (!user) {
    await createAuditLog({
      userId: null,
      action: 'login_failed',
      ipAddressHash: ipHash,
      userAgent,
    });
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    await createAuditLog({
      userId: user.id,
      action: 'login_failed',
      ipAddressHash: ipHash,
      userAgent,
    });
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
  await saveRefreshToken(user.id, tokenHash, expiresAt);

  await createAuditLog({
    userId: user.id,
    action: 'login_success',
    ipAddressHash: ipHash,
    userAgent,
  });

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user: { id: user.id, email: user.email } });
}

/**
 * POST /api/auth/refresh
 *
 * Refresh token rotation con persistencia en DB:
 * 1. Verificar firma JWT del token entrante
 * 2. Verificar que el hash del token exista en DB y no esté revocado
 * 3. Revocar el token anterior
 * 4. Emitir y persistir el nuevo par de tokens
 *
 * Si un token ya revocado se presenta, se rechaza — esto detecta
 * reuso de tokens robados.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const oldTokenHash = hashToken(token);
    const valid = await isRefreshTokenValid(oldTokenHash);

    if (!valid) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Autenticación requerida' });
      return;
    }

    await revokeRefreshToken(oldTokenHash);

    const newAccessToken = generateAccessToken(payload.sub);
    const newRefreshToken = generateRefreshToken(payload.sub);

    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
    await saveRefreshToken(payload.sub, newTokenHash, expiresAt);

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
  } catch {
    clearRefreshCookie(res);
    res.status(401).json({ error: 'Autenticación requerida' });
  }
}

/**
 * POST /api/auth/logout
 *
 * Revoca el refresh token en DB y limpia la cookie.
 * El access token activo seguirá siendo válido hasta su expiración
 * natural (15min máx), lo cual es aceptable dado su corta vida.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const ipHash = hashIP(getClientIP(req));
  const userAgent = getUserAgent(req);

  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (token) {
    await revokeRefreshToken(hashToken(token));
  }

  await createAuditLog({
    userId: req.userId ?? null,
    action: 'logout',
    ipAddressHash: ipHash,
    userAgent,
  });

  clearRefreshCookie(res);
  res.json({ message: 'Sesión cerrada' });
}
