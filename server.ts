import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mock storage for uploaded docs
  const upload = multer({ dest: 'uploads/' });

  // Bot Session Management
  let botSession = {
    isActive: false,
    state: 'idle' as 'idle' | 'logging_in' | 'otp_waiting' | 'logged_in' | 'monitoring' | 'error',
    currentUrl: 'about:blank',
    captchaSolved: false,
    attempts: 0,
    logs: [] as any[],
    applications: [
      {
        country: "Poland",
        visa_type: "Schengen",
        platform: "VFS Global",
        status: "pending",
        date_applied: new Date().toISOString().split('T')[0],
        next_step: "Login & Sync",
        notes: "Awaiting session synchronization"
      }
    ] as any[],
    automationInstructions: null as any
  };

  // API Routes
  app.get('/api/status', (req, res) => {
    res.json({
      status: botSession.state,
      isActive: botSession.isActive,
      lastUpdate: new Date().toISOString(),
      currentUrl: botSession.currentUrl,
      captchaSolved: botSession.captchaSolved,
      attempts: botSession.attempts,
      logs: botSession.logs,
      applications: botSession.applications,
      automationInstructions: botSession.automationInstructions
    });
  });

  app.post('/api/bot/set-instructions', (req, res) => {
    botSession.automationInstructions = req.body;
    res.json({ success: true });
  });

  app.post('/api/bot/update-application', (req, res) => {
    const { country, status, next_step, notes } = req.body;
    const appIndex = botSession.applications.findIndex(a => a.country === country);
    if (appIndex > -1) {
      botSession.applications[appIndex] = {
        ...botSession.applications[appIndex],
        status,
        next_step,
        notes,
        date_applied: new Date().toISOString().split('T')[0]
      };
    } else {
      botSession.applications.push({
        country,
        status,
        next_step,
        notes,
        date_applied: new Date().toISOString().split('T')[0],
        visa_type: "Schengen",
        platform: "VFS Global"
      });
    }
    res.json({ success: true });
  });

  app.post('/api/bot/start', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Credentials required' });
    }
    
    botSession.isActive = true;
    botSession.state = 'logging_in';
    botSession.currentUrl = 'https://welcome.vfsglobal.com/login';
    botSession.logs.push({ time: new Date().toISOString(), message: `Bot session initialized for ${email}` });
    
    res.json({ message: 'Bot session initialized' });
  });

  app.post('/api/bot/solve-captcha', (req, res) => {
    botSession.captchaSolved = true;
    botSession.logs.push({ time: new Date().toISOString(), message: 'AI Module: Cloudflare Turnstile solved' });
    res.json({ success: true });
  });

  app.post('/api/bot/verify-otp', (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP required' });
    
    botSession.state = 'logged_in';
    botSession.currentUrl = 'https://welcome.vfsglobal.com/dashboard';
    botSession.logs.push({ time: new Date().toISOString(), message: 'OTP verified. Session synchronized with VFS.' });
    res.json({ success: true });
  });

  app.post('/api/bot/reset', (req, res) => {
    botSession = {
      isActive: false,
      state: 'idle',
      currentUrl: 'about:blank',
      captchaSolved: false,
      attempts: 0,
      logs: [] as any[],
      applications: [
        {
          country: "Poland",
          visa_type: "Schengen",
          platform: "VFS Global",
          status: "pending",
          date_applied: new Date().toISOString().split('T')[0],
          next_step: "Login & Sync",
          notes: "Awaiting session synchronization"
        }
      ] as any[],
      automationInstructions: null as any
    };
    res.json({ success: true });
  });

  app.post('/api/upload-passport', upload.single('passport'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // In a real app, we'd trigger the OCR/MRZ validation here
    res.json({
      message: 'Passport uploaded successfully',
      filename: req.file.filename,
      path: req.file.path
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VFS Automator Pro running at http://localhost:${PORT}`);
  });
}

startServer();
