import rateLimit from 'express-rate-limit';

/**
 * Limita consultas de disponibilidad.
 * 30 req/15min es generoso para uso legítimo pero frena scraping automatizado.
 */
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
});

/**
 * Limita creación de reservas.
 * 5 por hora previene abuso de creación masiva de citas.
 */
export const createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Límite de reservas alcanzado. Intente de nuevo más tarde.' },
});

/**
 * Limita intentos de login.
 * 5 intentos/15min mitiga fuerza bruta sin afectar al usuario legítimo
 * que simplemente olvidó su contraseña.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intente de nuevo más tarde.' },
});
