import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { requireAuth } from '../middlewares/auth.js';
import { login, refresh, logout } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

export default router;
