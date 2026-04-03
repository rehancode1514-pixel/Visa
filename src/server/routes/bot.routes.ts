import express from 'express';
import { getStatus, startBot, solveCaptcha, verifyOtp, resetBot } from '../controllers/bot.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect as any);
router.get('/status', getStatus);
router.post('/start', startBot);
router.post('/solve-captcha', solveCaptcha);
router.post('/verify-otp', verifyOtp);
router.post('/reset', resetBot);

export default router;
