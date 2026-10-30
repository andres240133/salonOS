import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getAvailabilityRange,
  saveWeekAvailability,
  getTemplates,
  updateTemplates,
} from '../controllers/availability.controller.js';
import {
  listDayBookings,
  completeAdminBooking,
  cancelAdminBooking,
  createAdminBooking,
} from '../controllers/adminBooking.controller.js';
import {
  listAdminClients,
  getClientHistory,
  saveClientFormula,
} from '../controllers/adminClient.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/availability', getAvailabilityRange);
router.post('/availability/week', saveWeekAvailability);
router.get('/availability/templates', getTemplates);
router.put('/availability/templates', updateTemplates);

router.get('/bookings/today', listDayBookings);
router.post('/bookings', createAdminBooking);
router.patch('/bookings/:id/complete', completeAdminBooking);
router.patch('/bookings/:id/cancel', cancelAdminBooking);

router.get('/clients', listAdminClients);
router.get('/clients/:id/history', getClientHistory);
router.post('/clients/:id/formulas', saveClientFormula);

export default router;
