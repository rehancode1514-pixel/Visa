import 'dotenv/config';
import app from './app.js';

// In local dev, mount Vite HMR middleware
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
  // In production (Railway): only API routes are served.
  // The React frontend is served by Vercel — no static files needed here.

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Visa AI backend running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
  });
}

startServer();
