import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { testDatabaseConnection } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import servicesRoutes from './routes/services.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import { initCronJobs } from './services/cron.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Helmet aplica ~14 headers de seguridad HTTP de una vez.
// La CSP se configurará con mayor granularidad cuando se integren los frontends.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS: permite peticiones de los frontends (PWA admin y página pública).
// credentials: true es obligatorio porque el refresh token viaja en una
// cookie HttpOnly; sin esta flag el navegador no envía la cookie, incluso en local.
app.use(cors({
  origin: [process.env.FRONTEND_PWA_URL!, process.env.FRONTEND_PUBLIC_URL!],
  credentials: true,
}));

app.use(express.json({
  limit: '10kb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/whatsapp', whatsappRoutes);

async function bootstrap(): Promise<void> {
  await testDatabaseConnection();
  initCronJobs();

  app.listen(PORT, () => {
    console.log(`[server] SalonOS API corriendo en puerto ${PORT} (${process.env.NODE_ENV})`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] Error crítico al iniciar:', err);
  process.exit(1);
});

export default app;
