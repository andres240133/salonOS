import { Router } from 'express';
import { bookingLimiter, createBookingLimiter } from '../middlewares/rateLimiter.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  create,
  getAvailability,
  getAvailabilityRange,
  list,
  updateStatus,
} from '../controllers/booking.controller.js';

const router = Router();

// Rutas públicas (con rate limiting)
router.post('/', createBookingLimiter, create);
router.get('/availability/range', bookingLimiter, getAvailabilityRange);
router.get('/availability', bookingLimiter, getAvailability);

// Rutas privadas (requieren autenticación)
/** @deprecated Usar GET /api/admin/bookings/today */
router.get('/', requireAuth, list);
/** @deprecated Usar PATCH /api/admin/bookings/:id/complete o PATCH /api/admin/bookings/:id/cancel */
router.patch('/:id/status', requireAuth, updateStatus);

export default router;
