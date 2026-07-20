import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getFinanceMetrics, createExpense, createManualIncome } from '../controllers/dashboard.controller.js';

const router = Router();

// Endpoint del panel administrativo para consultar KPIs financieros y operativos.
// Esta ruta requiere obligatoriamente autenticación de administrador (dueña de la estética).
router.get('/finance', requireAuth, getFinanceMetrics);

// Endpoint del panel administrativo para registrar un nuevo gasto operativo.
// Requiere autenticación de administrador.
router.post('/expenses', requireAuth, createExpense);

// Endpoint del panel administrativo para registrar un ingreso manual (ventas, servicios sin reserva, etc.).
// Requiere autenticación de administrador.
router.post('/income', requireAuth, createManualIncome);

export default router;
