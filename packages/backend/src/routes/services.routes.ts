import { Router } from 'express';
import { bookingLimiter } from '../middlewares/rateLimiter.js';
import { list } from '../controllers/services.controller.js';

const router = Router();

// Ruta pública — el catálogo de servicios es visible sin autenticación,
// necesario para que el flujo de reserva (cliente final) pueda mostrarlo.
router.get('/', bookingLimiter, list);

export default router;
