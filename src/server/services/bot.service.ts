import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { db } from '../db.js';

export class BotService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  public lastScreenshot: string | null = null;
  public currentUrl: string = 'about:blank';

  async init() {
    this.browser = await chromium.launch({ 
        headless: true, // Run headless for better performance in dev
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    this.page = await this.context.newPage();
  }

  async captureScreenshot() {
    if (!this.page) return;
    try {
        const buffer = await this.page.screenshot({ type: 'jpeg', quality: 60 });
        this.lastScreenshot = buffer.toString('base64');
        this.currentUrl = this.page.url();
    } catch (e) {
        console.error('Screenshot failed:', e);
    }
  }

  async loginVFS(email: string, password: string, userId: string) {
    if (!this.page) throw new Error('Bot not initialized');
    
    try {
      await this.page.goto('https://welcome.vfsglobal.com/login', { waitUntil: 'networkidle' });
      await this.captureScreenshot();
      
      // We would enter details here
      // await this.page.fill('input[name="email"]', email);
      // await this.page.fill('input[name="password"]', password);
      // await this.page.click('button[type="submit"]');
      
      // Simulate checking for CAPTCHA/OTP
      const needsHuman = true; // In real-world, detect Cloudflare Turnstile or OTP input
      
      if (needsHuman) {
        await this.logAction(userId, 'VFS Login Interrupted', 'waiting_for_user', 'Human intervention required for OTP/CAPTCHA');
        return { status: 'waiting_for_user' };
      }
      
      return { status: 'logged_in' };
    } catch (e: any) {
      await this.logAction(userId, 'VFS Login Error', 'failed', e.message);
      throw e;
    }
  }

  async resumeAfterOTP(otp: string, userId: string) {
    if (!this.page) throw new Error('Bot not initialized');
    // await this.page.fill('input[name="otp"]', otp);
    // await this.page.click('button:has-text("Verify")');
    await this.logAction(userId, 'OTP Submission', 'success', 'User provided OTP');
    return { status: 'logged_in' };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async logAction(userId: string, action: string, status: string, message: string) {
    await db.botLog.create({
      data: {
        user_id: userId,
        action,
        status,
        metadata: JSON.stringify({ message })
      }
    });
  }
}
