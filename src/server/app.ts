import express from 'express';
import cors from 'cors';
import fs from 'fs';
import _crypto from 'crypto';
import 'dotenv/config';

if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
  // @ts-ignore
  globalThis.crypto = _crypto.webcrypto;
}
if (!('getRandomValues' in _crypto)) {
  // @ts-ignore
  _crypto.getRandomValues = _crypto.webcrypto.getRandomValues.bind(_crypto.webcrypto);
}

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import visaRoutes from './routes/visa.routes';
import botRoutes from './routes/bot.routes';
import ocrRoutes from './routes/ocr.routes';
import { db } from './db';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    console.log('[HEALTH CHECK]: Checking database connectivity...');
    await db.$queryRaw`SELECT 1`;
    console.log('[HEALTH CHECK]: Database connected successfully');
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err: any) {
    console.error('[HEALTH CHECK ERROR]:', err.message);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// Make sure uploads directory exists (skip on serverless environments)
try {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
} catch (_) {
  // ignore on read-only filesystems (e.g. Vercel)
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', visaRoutes);
app.use('/api/bot', botRoutes);
app.use('/api', ocrRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'See server logs' : err.message 
  });
});

export default app;

