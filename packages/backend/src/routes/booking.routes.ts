import { Router } from 'express';
import { bookingLimiter, createBookingLimiter } from '../middlewares/rateLimiter.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  create,
  getAvailability,
  list,
  updateStatus,
} from '../controllers/booking.controller.js';

const router = Router();

// Rutas públicas (con rate limiting)
router.post('/', createBookingLimiter, create);
router.get('/availability', bookingLimiter, getAvailability);

// Rutas privadas (requieren autenticación)
router.get('/', requireAuth, list);
router.patch('/:id/status', requireAuth, updateStatus);

export default router;
