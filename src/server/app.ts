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

app.use(cors({
  origin: [
    'https://visa-flame.vercel.app',
    'https://visa-wine-gamma.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: "OK" });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (skip on serverless environments)
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

// Static Assets (Vite build output)
const distPath = path.join(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  console.log(`[SERVER]: Serving static files from ${distPath}`);
  app.use(express.static(distPath));
  
  // SPA Fallback for React routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  
  console.error(`[SERVER_ERROR] [${status}]:`, {
    message: err.message,
    stack: isProd ? 'HIDDEN' : err.stack,
    code: err.code
  });

  res.status(status).json({ 
    message: err.message || 'Internal Server Error',
    error: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'API_ERROR'),
    details: isProd ? undefined : err.stack 
  });
});

export default app;

