import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getAvailabilityRange,
  saveWeekAvailability,
  getTemplates,
  updateTemplates,
} from '../controllers/availability.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/availability', getAvailabilityRange);
router.post('/availability/week', saveWeekAvailability);
router.get('/availability/templates', getTemplates);
router.put('/availability/templates', updateTemplates);

export default router;
