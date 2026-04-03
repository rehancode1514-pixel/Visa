import { Request, Response } from 'express';
import { db } from '../db.js';

// Currently holds state in memory for simplicity until BullMQ handles distributed state
let botSessions: Record<string, any> = {};

export const getStatus = async (req: any, res: Response) => {
  try {
    const session = botSessions[req.userId] || {
      state: 'idle', isActive: false, currentUrl: 'about:blank',
      captchaSolved: false, attempts: 0, screenshot: null
    };

    // If bot has a service, we can get the real-time URL and screenshot
    // (Note: In a full implementation, the service would be shared/accessible here)
    
    const logs = await db.botLog.findMany({
      where: { user_id: req.userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json({ ...session, logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const startBot = async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;
    
    botSessions[req.userId] = {
      isActive: true,
      state: 'logging_in',
      currentUrl: 'https://welcome.vfsglobal.com/login',
      captchaSolved: false,
      attempts: 0
    };

    await db.botLog.create({
      data: {
        user_id: req.userId,
        action: 'Start Bot',
        status: 'success',
        metadata: JSON.stringify({ message: `Initialized for ${email}` })
      }
    });

    res.json({ message: 'Bot session initialized' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const solveCaptcha = async (req: any, res: Response) => {
  try {
    if (botSessions[req.userId]) {
      botSessions[req.userId].captchaSolved = true;
      await db.botLog.create({
        data: {
          user_id: req.userId, action: 'Solve CAPTCHA', status: 'success', metadata: '{}'
        }
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req: any, res: Response) => {
  try {
    const { otp } = req.body;
    if (botSessions[req.userId]) {
      botSessions[req.userId].state = 'logged_in';
      botSessions[req.userId].currentUrl = 'https://welcome.vfsglobal.com/dashboard';
      
      await db.botLog.create({
        data: {
          user_id: req.userId, action: 'Verify OTP', status: 'success', metadata: JSON.stringify({ message: 'OTP verified' })
        }
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetBot = async (req: any, res: Response) => {
  try {
    botSessions[req.userId] = null;
    await db.botLog.deleteMany({ where: { user_id: req.userId } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
