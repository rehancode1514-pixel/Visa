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

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import visaRoutes from './routes/visa.routes.js';
import botRoutes from './routes/bot.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import { db } from './db.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
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

