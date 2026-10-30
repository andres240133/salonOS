import { decrypt } from './crypto.js';

/**
 * Descifra un campo PII almacenado en formato "encrypted:iv" (AES-256-GCM).
 * Si el formato es inválido o falla la verificación de integridad GCM,
 * registra únicamente el identificador de la entidad (nunca PII ni ciphertext)
 * y retorna "(dato ilegible)" para no interrumpir listados administrativos.
 */
export function safeDecryptField(stored: string, entityContext: string | number): string {
  try {
    const parts = stored.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Formato de payload cifrado inválido');
    }
    return decrypt(parts[0], parts[1]);
  } catch {
    console.error(`[pii] Fallo al descifrar PII en ${entityContext}`);
    return '(dato ilegible)';
  }
}
