import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.js';

/**
 * NOTA ARQUITECTÓNICA — Resolución de módulos ambientales en NodeNext ESM:
 *
 * NO se debe importar `../types/express.js` aquí. Ese archivo (`src/types/express.d.ts`)
 * es una declaración ambiental pura (module augmentation de Express) que extiende la
 * interfaz `Request` con la propiedad `userId`. Al ser un fichero `.d.ts`, el compilador
 * de TypeScript NO emite ningún artefacto JavaScript para él. Bajo la resolución estricta
 * de `moduleResolution: "NodeNext"`, un `import` con extensión `.js` obliga al runtime
 * (Node.js / tsx) a buscar un archivo físico `.js` que jamás existirá, provocando un
 * colapso inmediato con `ERR_MODULE_NOT_FOUND`.
 *
 * La extensión de tipos se resuelve automáticamente a través del glob
 * La extensión de tipos se resuelve automáticamente a través del glob de
 * inclusión definido en el `tsconfig.json` del paquete, que abarca la carpeta
 * `src/types/`. TypeScript inyecta la augmentación globalmente en el contexto de
 * compilación sin necesidad de importaciones explícitas en tiempo de ejecución.

/**
 * Middleware que exige un Bearer token válido en el header Authorization.
 *
 * Responde 401 con un mensaje genérico en TODOS los casos de fallo
 * (token ausente, expirado, malformado) para no revelar el motivo
 * exacto al atacante.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    // Mismo mensaje para token expirado, inválido o manipulado
    res.status(401).json({ error: 'Autenticación requerida' });
  }
}
