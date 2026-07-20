import jwt from 'jsonwebtoken';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[jwt] Variable de entorno "${name}" no definida. ` +
      `El servidor no puede arrancar sin ella.`,
    );
  }
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * Genera un access token de corta vida (15 min).
 * El claim `type` previene uso cruzado de tokens — un refresh token
 * no puede ser aceptado donde se espera un access token.
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );
}

/**
 * Genera un refresh token de larga vida (7 días).
 * Se almacena en una cookie HttpOnly — nunca expuesto a JavaScript del cliente.
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );
}

/**
 * Verifica y decodifica un access token.
 * Lanza `JsonWebTokenError` o `TokenExpiredError` si es inválido.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

  // Defensa contra uso cruzado: rechazar si el tipo no coincide
  if (payload.type !== 'access') {
    throw new jwt.JsonWebTokenError('Token type mismatch');
  }

  return payload;
}

/**
 * Verifica y decodifica un refresh token.
 * Lanza `JsonWebTokenError` o `TokenExpiredError` si es inválido.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;

  if (payload.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Token type mismatch');
  }

  return payload;
}
