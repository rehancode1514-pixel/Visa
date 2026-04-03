import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import _crypto from 'crypto';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Make sure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // API Routes mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/applications', visaRoutes);
  app.use('/api/bot', botRoutes);
  app.use('/api', ocrRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Visa Application Assistant running at http://localhost:${PORT}`);
  });
}

startServer();
