import 'express';

declare module 'express' {
  interface Request {
    /** ID del usuario autenticado, inyectado por el middleware requireAuth */
    userId?: string;
  }
}
