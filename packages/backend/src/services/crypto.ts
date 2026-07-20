import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const BCRYPT_COST = 12;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[crypto] Variable de entorno "${name}" no definida. ` +
      `El servidor no puede arrancar sin ella.`,
    );
  }
  return value;
}

const ENCRYPTION_KEY = Buffer.from(requireEnv('ENCRYPTION_KEY'), 'hex');
const SYSTEM_SALT = requireEnv('SYSTEM_SALT');
const AUDIT_SALT = requireEnv('AUDIT_SALT');

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    '[crypto] ENCRYPTION_KEY debe ser exactamente 32 bytes (64 caracteres hex). ' +
    `Recibidos: ${ENCRYPTION_KEY.length} bytes.`,
  );
}

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
}

/**
 * Cifra texto con AES-256-GCM. Cada invocación genera un IV aleatorio
 * y concatena el authTag al ciphertext para verificación de integridad.
 */
export function encrypt(text: string): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
  };
}

/**
 * Descifra un payload previamente cifrado con {@link encrypt}.
 * Lanza si el authTag no coincide (datos corruptos o manipulados).
 */
export function decrypt(encrypted: string, iv: string): string {
  const buf = Buffer.from(encrypted, 'hex');
  const ivBuf = Buffer.from(iv, 'hex');

  // Los últimos AUTH_TAG_LENGTH bytes son el authTag
  const authTag = buf.subarray(buf.length - AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(0, buf.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuf, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * Hash determinista para búsqueda de teléfonos sin descifrar.
 * Permite localizar un cliente por teléfono haciendo WHERE phone_hash = hashPhone(input).
 */
export function hashPhone(phone: string): string {
  return crypto
    .createHash('sha256')
    .update(phone + SYSTEM_SALT)
    .digest('hex');
}

/**
 * Hash de IP para audit_logs. Anonimiza la dirección real cumpliendo
 * el principio de minimización de datos.
 */
export function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + AUDIT_SALT)
    .digest('hex');
}

/**
 * SHA-256 sin salt para tokens de alta entropía (JWTs).
 * Permite almacenar una referencia verificable sin guardar el token en claro.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Genera un hash bcrypt con cost factor 12 (~250ms en hardware moderno).
 * Incrementar el cost para compensar avances en hardware.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Verifica una contraseña contra su hash bcrypt. */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
