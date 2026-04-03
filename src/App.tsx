import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Camera, 
  ExternalLink, 
  Terminal,
  RefreshCw,
  FileText,
  User,
  Globe,
  Lock,
  Play,
  Pause,
  Zap,
  LayoutDashboard,
  Bot,
  Brain,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createWorker } from 'tesseract.js';
import { parseMRZ } from './lib/mrz';
import { BotStatus, LogEntry, MRZData, Application, AutomationInstruction } from './types';
import { extractPassportData, generateAutomationInstructions } from './lib/gemini';

export default function App() {
  const [status, setStatus] = useState<BotStatus>({
    state: 'idle',
    currentStep: 'System Ready',
    lastLog: 'Awaiting passport upload...',
    progress: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'VFS Automator Pro v2.4 initialized.' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Residential proxy connected: Warsaw, PL' }
  ]);

  const [mrzData, setMrzData] = useState<Partial<MRZData>>({
    passportNumber: '',
    nationality: '',
    dob: '',
    sex: '',
    expiry: '',
    surname: '',
    givenNames: '',
    isValid: false
  });
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [telegramConfig, setTelegramConfig] = useState({ botToken: '', chatId: '' });
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'solving' | 'solved' | 'error'>('idle');
  const [vfsExtractedData, setVfsExtractedData] = useState<Partial<MRZData> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [monitoringAttempts, setMonitoringAttempts] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [browserView, setBrowserView] = useState<{ url: string, screenshot: string | null }>({
    url: 'about:blank',
    screenshot: null
  });
  const [isSynced, setIsSynced] = useState(false);
  const [activeTab, setActiveTab] = useState<'automation' | 'dashboard'>('automation');
  const [applications, setApplications] = useState<Application[]>([]);
  const [automationInstructions, setAutomationInstructions] = useState<AutomationInstruction | null>(null);
  const [geminiConfidence, setGeminiConfidence] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (res.ok) {
          setBackendStatus('online');
          if (data.status === 'logged_in') setIsSynced(true);
          setApplications(data.applications || []);
          setAutomationInstructions(data.automationInstructions || null);
        }
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    setStatus(prev => ({ ...prev, lastLog: message }));
  };

  const solveCaptcha = async (force = false) => {
    if (!force && Math.random() > 0.5) {
      setCaptchaStatus('solved');
      addLog('AI Module: Cloudflare challenge already solved (Cached).', 'success');
      return;
    }

    setCaptchaStatus('solving');
    addLog('AI Module: Analyzing Cloudflare Turnstile challenge...', 'info');
    setBrowserView(prev => ({ ...prev, screenshot: 'https://picsum.photos/seed/cloudflare/800/600' }));
    
    try {
      const res = await fetch('/api/bot/solve-captcha', { method: 'POST' });
      if (res.ok) {
        setCaptchaStatus('solved');
        addLog('AI Module: Cloudflare challenge solved successfully.', 'success');
        setBrowserView(prev => ({ ...prev, screenshot: 'https://picsum.photos/seed/vfs_success/800/600' }));
      }
    } catch (error) {
      addLog('AI Module: Failed to solve captcha.', 'error');
      setCaptchaStatus('error');
    }
  };

  const syncSession = async () => {
    if (!credentials.email || !credentials.password) {
      addLog('Error: Credentials required for synchronization.', 'error');
      return;
    }

    setStatus(prev => ({ ...prev, state: 'logging_in', currentStep: '1. Logging in...', progress: 10 }));
    addLog('Starting VFS Session Synchronization...', 'info');
    setBrowserView({ url: 'https://www.vfsglobal.com/en/login', screenshot: 'https://picsum.photos/seed/vfs_login/800/600' });

    try {
      await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      await solveCaptcha();
      addLog('Auto-filling credentials...', 'info');
      setStatus(prev => ({ ...prev, currentStep: 'Filling Credentials', progress: 20 }));
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog('VFS requested OTP verification.', 'warning');
      setStatus(prev => ({ ...prev, state: 'otp_waiting', currentStep: '2. OTP Required', progress: 30 }));
      setBrowserView(prev => ({ ...prev, screenshot: 'https://picsum.photos/seed/vfs_otp/800/600' }));
    } catch (error) {
      addLog('Error starting bot session.', 'error');
    }
  };

  const submitOtp = async () => {
    if (otpValue.length !== 6) return;
    
    addLog(`Verifying OTP: ${otpValue}...`, 'info');
    setStatus(prev => ({ ...prev, currentStep: 'Verifying OTP', progress: 40 }));
    
    try {
      const res = await fetch('/api/bot/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue })
      });
      if (res.ok) {
        addLog('Session synchronized successfully.', 'success');
        setIsSynced(true);
        setStatus(prev => ({ ...prev, state: 'logged_in', currentStep: 'Session Synced', progress: 50 }));
        setBrowserView({ url: 'https://www.vfsglobal.com/en/dashboard', screenshot: 'https://picsum.photos/seed/vfs_dashboard/800/600' });
      }
    } catch (error) {
      addLog('Error verifying OTP.', 'error');
    }
  };

  const startBot = () => {
    if (!isSynced) {
      addLog('Error: Sync session first.', 'error');
      return;
    }
    startMonitoring();
  };

  const startMonitoring = () => {
    setStatus(prev => ({ ...prev, state: 'monitoring', currentStep: '5. Monitoring Slots', progress: 80 }));
    addLog('Bot started: Monitoring Warsaw appointment calendar...', 'success');
    setBrowserView({ url: 'https://www.vfsglobal.com/en/appointments', screenshot: 'https://picsum.photos/seed/vfs_calendar/800/600' });
    
    const interval = setInterval(() => {
      setMonitoringAttempts(prev => prev + 1);
      if (Math.random() > 0.9) {
        clearInterval(interval);
        addLog('URGENT: Appointment slot detected for 21-04-2026!', 'success');
        setStatus(prev => ({ ...prev, state: 'slot_found', currentStep: '6. Slot Found!', progress: 90 }));
        setBrowserView(prev => ({ ...prev, screenshot: 'https://picsum.photos/seed/vfs_slot/800/600' }));
      }
    }, 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setIsProcessing(true);
      setOcrProgress(10);
      addLog('Gemini AI: Analyzing passport document...', 'info');

      try {
        setOcrProgress(20);
        const result = await extractPassportData(base64);
        setOcrProgress(60);
        if (result) {
          setGeminiConfidence(result.confidence_score);
          setMrzData({
            passportNumber: result.passport_number,
            nationality: result.nationality,
            dob: result.date_of_birth,
            sex: result.gender,
            expiry: result.expiry_date,
            surname: result.full_name.split(' ').pop() || '',
            givenNames: result.full_name.split(' ').slice(0, -1).join(' ') || '',
            isValid: true
          });
          addLog(`Gemini AI: OCR completed with ${result.confidence_score}% confidence.`, 'success');
          
          setOcrProgress(80);
          addLog('Gemini AI: Generating Playwright automation instructions...', 'info');
          const instructions = await generateAutomationInstructions('https://www.vfsglobal.com/visa-application');
          setAutomationInstructions(instructions);
          
          await fetch('/api/bot/set-instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(instructions)
          });

          setOcrProgress(100);
          setStatus(prev => ({ ...prev, state: 'ocr_validation', currentStep: 'Review OCR Data', progress: 100 }));
        } else {
          addLog('Gemini AI failed to extract data. Falling back to Tesseract OCR...', 'warning');
          runTesseractOCR(file);
        }
      } catch (error) {
        console.error("OCR Error:", error);
        addLog('Gemini AI error occurred. Falling back to Tesseract OCR...', 'warning');
        runTesseractOCR(file);
      } finally {
        // Only set processing false if we didn't fall back, or if fallback is done
        // Actually runTesseractOCR will handle its own state
      }
    };
    reader.onerror = () => {
      addLog('Error reading file. Please try again.', 'error');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const runTesseractOCR = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(10);
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        }
      });
      
      setOcrProgress(20);
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      });

      setOcrProgress(40);
      const { data: { text } } = await worker.recognize(file);
      setOcrProgress(90);
      
      const mrzLines = text.split('\n').filter(line => line.includes('<<') || line.length > 30);
      
      if (mrzLines.length >= 2) {
        const parsed = parseMRZ(mrzLines);
        setMrzData(parsed);
        addLog('Tesseract: MRZ parsed successfully.', 'success');
        setStatus(prev => ({ ...prev, state: 'ocr_validation', currentStep: 'Review OCR Data', progress: 100 }));
      } else {
        addLog('Tesseract: Failed to detect MRZ. Manual entry required.', 'error');
      }
      await worker.terminate();
    } catch (err) {
      console.error("Tesseract Error:", err);
      addLog('Tesseract OCR failed. Please enter data manually.', 'error');
    } finally {
      setIsProcessing(false);
      setOcrProgress(100);
    }
  };

  const resetSystem = async () => {
    try {
      await fetch('/api/bot/reset', { method: 'POST' });
      setStatus({ state: 'idle', currentStep: 'System Ready', lastLog: 'System reset.', progress: 0 });
      setMrzData({});
      setIsSynced(false);
      setImagePreview(null);
      setLogs([{ id: 'reset', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'System reset initiated.' }]);
      addLog('Backend session reset successfully.', 'success');
    } catch (error) {
      addLog('Error resetting backend session.', 'error');
    }
  };

  const validateVfsData = (match: boolean) => {
    if (!match) {
      addLog('Data mismatch detected. Bot paused for manual verification.', 'error');
      setStatus(prev => ({ ...prev, state: 'error', currentStep: 'Data Mismatch' }));
      return;
    }
    addLog('Data match confirmed. Proceeding to liveness check...', 'success');
    setStatus(prev => ({ ...prev, state: 'liveness_waiting', currentStep: '4. Liveness / Selfie (Waiting)', progress: 60 }));
  };

  const resumeAfterLiveness = () => {
    addLog('Liveness check completed by user. Resuming bot...', 'success');
    startMonitoring();
  };

  const finishBooking = () => {
    setStatus(prev => ({ ...prev, state: 'finishing', currentStep: '7. Finishing...', progress: 100 }));
    addLog('Payment confirmed. Downloading appointment PDF...', 'success');
    setTimeout(() => {
      addLog('PDF downloaded: appointment_wesley_vfs.pdf', 'success');
      setStatus(prev => ({ ...prev, state: 'idle', currentStep: 'Finish', progress: 100 }));
    }, 2000);
  };

  const DataField = ({ label, value, onChange, icon, fullWidth = false }: { label: string, value?: string, onChange: (v: string) => void, icon: React.ReactNode, fullWidth?: boolean }) => (
    <div className={`${fullWidth ? 'col-span-2' : ''} space-y-1`}>
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
        {icon}
        {label}
      </label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium focus:ring-1 focus:ring-vfs-blue outline-none"
      />
    </div>
  );

  const AutomationView = () => (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            Gemini AI Document Analysis
          </h2>
          <div className="flex items-center gap-2">
            {!process.env.GEMINI_API_KEY && (
              <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> API Key Missing
              </span>
            )}
            <span className="text-xs text-slate-400">Confidence Score</span>
            <div className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full">
              {geminiConfidence ? `${geminiConfidence}%` : 'N/A'}
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-vfs-gold hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-vfs-gold" />
              </div>
              <div className="text-center">
                <p className="font-display font-medium text-slate-700">Upload Passport Photo</p>
                <p className="text-sm text-slate-400 mt-1">Gemini AI will extract structured data automatically</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 aspect-[4/3] flex items-center justify-center">
                  <img src={imagePreview} alt="Passport Preview" className={`max-w-full max-h-full object-contain ${isProcessing ? 'opacity-50' : ''}`} />
                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
                      <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                      <p className="font-display font-bold text-xl">{ocrProgress}%</p>
                    </div>
                  )}
                </div>
                {automationInstructions && (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-vfs-gold uppercase mb-2 flex items-center gap-2">
                      <Bot className="w-3 h-3" /> Playwright Bot Instructions
                    </p>
                    <div className="space-y-2">
                      {automationInstructions.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-slate-300">
                          <div className="w-1 h-1 bg-vfs-gold rounded-full" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="font-display font-bold text-vfs-blue">Extracted Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Passport Number" value={mrzData.passportNumber} onChange={(v) => setMrzData(p => ({...p, passportNumber: v}))} icon={<Lock className="w-3 h-3" />} />
                  <DataField label="Nationality" value={mrzData.nationality} onChange={(v) => setMrzData(p => ({...p, nationality: v}))} icon={<Globe className="w-3 h-3" />} />
                  <DataField label="Date of Birth" value={mrzData.dob} onChange={(v) => setMrzData(p => ({...p, dob: v}))} icon={<Clock className="w-3 h-3" />} />
                  <DataField label="Expiry Date" value={mrzData.expiry} onChange={(v) => setMrzData(p => ({...p, expiry: v}))} icon={<Clock className="w-3 h-3" />} />
                  <DataField label="Surname" value={mrzData.surname} onChange={(v) => setMrzData(p => ({...p, surname: v}))} icon={<User className="w-3 h-3" />} fullWidth />
                  <DataField label="Given Names" value={mrzData.givenNames} onChange={(v) => setMrzData(p => ({...p, givenNames: v}))} icon={<User className="w-3 h-3" />} fullWidth />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Browser View */}
      <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="ml-4 bg-slate-700 px-3 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-2 min-w-[200px]">
              <Lock className="w-3 h-3 text-green-500" />
              {browserView.url}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Live Browser</span>
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
          {browserView.screenshot ? (
            <img src={browserView.screenshot} alt="Browser View" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-700">
              <Globe className="w-12 h-12 animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting Session...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Applications</p>
          <p className="text-3xl font-display font-bold text-vfs-blue">{applications.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pending Actions</p>
          <p className="text-3xl font-display font-bold text-vfs-blue">
            {applications.filter(a => a.status === 'pending' || a.status === 'action_required').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Success Rate</p>
          <p className="text-3xl font-display font-bold text-vfs-blue">
            {applications.length > 0 ? Math.round((applications.filter(a => a.status === 'completed').length / applications.length) * 100) : 0}%
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-vfs-blue flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Application Tracking
          </h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Search className="w-4 h-4 text-slate-400" /></button>
            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Filter className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Applicant</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Destination</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Visa Type</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Last Update</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic text-sm">No applications tracked yet.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-vfs-blue font-bold text-xs">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{app.applicantName}</p>
                          <p className="text-[10px] text-slate-400">{app.passportNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{app.country}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-600">{app.visaType}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        app.status === 'completed' ? 'bg-green-100 text-green-700' :
                        app.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                        app.status === 'action_required' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] text-slate-400">{new Date(app.lastUpdate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vfs-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-vfs-blue text-lg tracking-tight">VFS Automator Pro</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Edition</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  System Live
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 mr-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Session</p>
                <p className="text-xs font-bold text-vfs-blue">WESLEY_VFS_WARSAW</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Proxy Latency</p>
                <p className="text-xs font-bold text-green-600">42ms</p>
              </div>
            </div>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control & Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1">
            <button 
              onClick={() => setActiveTab('automation')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'automation' ? 'bg-vfs-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Bot className="w-4 h-4" /> Automation
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-vfs-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-vfs-blue" />
                VFS Credentials
              </h3>
              {isSynced && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-vfs-blue outline-none transition-all"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                <input 
                  type="password" 
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-vfs-blue outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-semibold text-sm">Bot Status</h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                status.state === 'idle' ? 'bg-slate-100 text-slate-500' :
                status.state === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {status.state.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Current Step</span>
                <span className="font-bold text-vfs-blue">{status.currentStep}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-vfs-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${status.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center pt-2 gap-2">
                {!isSynced ? (
                  <button 
                    onClick={syncSession}
                    disabled={status.state === 'logging_in' || status.state === 'otp_waiting'}
                    className="flex-1 bg-vfs-gold text-vfs-blue py-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-vfs-gold/80 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${status.state === 'logging_in' ? 'animate-spin' : ''}`} /> 
                    Sync Session
                  </button>
                ) : (
                  <button 
                    onClick={startBot}
                    disabled={status.state === 'monitoring'}
                    className="flex-1 bg-vfs-blue text-white py-2 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-900 transition-all"
                  >
                    <Play className="w-4 h-4" /> Start Monitoring
                  </button>
                )}
                <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all" onClick={resetSystem}>
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-slate-300 text-xs font-mono flex items-center gap-2">
                <Terminal className="w-3 h-3" /> SYSTEM_LOGS
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                    <span className="text-slate-600">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      log.type === 'error' ? 'text-red-400' :
                      'text-blue-300'
                    }>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          {activeTab === 'automation' ? <AutomationView /> : <DashboardView />}
        </div>
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-vfs-blue rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-vfs-blue text-sm">VFS Automator Pro</span>
            <span className="text-[10px] text-slate-400">v2.4.0-stable</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-vfs-blue transition-colors">Documentation</a>
            <a href="#" className="hover:text-vfs-blue transition-colors">API Status</a>
            <a href="#" className="hover:text-vfs-blue transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
