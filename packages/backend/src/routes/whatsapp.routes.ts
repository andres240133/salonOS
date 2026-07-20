import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';

const router = Router();

/**
 * GET /api/whatsapp/webhook
 * Handshake inicial de verificación solicitado por los servidores de Meta.
 */
router.get('/webhook', WhatsAppController.verifyWebhook);

/**
 * POST /api/whatsapp/webhook
 * Recepción y procesamiento idempotente de eventos de interacción de botones de WhatsApp.
 */
router.post('/webhook', WhatsAppController.handleWebhook);

export default router;
