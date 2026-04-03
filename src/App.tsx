import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal,
  Activity,
  Bot,
  Globe,
  LayoutDashboard,
  Brain,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Zap,
  MoreVertical,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OnboardingView from './components/OnboardingView';
import DiscoveryView from './components/DiscoveryView';
import DashboardView from './components/DashboardView';
import DetailedViewModal from './components/DetailedViewModal';
import LoginView from './components/LoginView';
import BrowserMonitor from './components/BrowserMonitor';
import { BotStatus, LogEntry, UserProfile, Application, VisaOpportunity, User, BrowserState } from './types';

export default function App() {
  const [view, setView] = useState<'onboarding' | 'discovery' | 'dashboard'>('onboarding');
  const [status, setStatus] = useState<BotStatus>({
    state: 'idle',
    currentStep: 'System Ready',
    lastLog: 'Initializing AI Visa Assistant...',
    progress: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'AI Visa Application Agent v3.0.0-PRO' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Ready for user onboarding.' }
  ]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>({
    url: 'about:blank',
    screenshot: null,
    isActive: false,
    state: 'idle'
  });
  
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  // Auth Initialization
  useEffect(() => {
    const savedSession = localStorage.getItem('visa_bot_session');
    if (savedSession) {
      try {
        const decoded = JSON.parse(savedSession);
        setUser(decoded);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('visa_bot_session');
      }
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('visa_bot_session', JSON.stringify(newUser));
    addLog(`Welcome back, ${newUser.email}`, 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('visa_bot_session');
    addLog('Logged out successfully.', 'info');
  };

  // Sync with backend on mount
  useEffect(() => {
    const checkBackend = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch('/api/bot/status', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
           // We might need a separate /api/profile call
           const profileRes = await fetch('/api/profile', {
             headers: { 'Authorization': `Bearer ${user.token}` }
           });
           
           if (profileRes.status === 401) {
             handleLogout();
             return;
           }

           if (profileRes.ok) {
             const profileData = await profileRes.json();
             if (profileData && Object.keys(profileData).length > 0) {
                setProfile(profileData);
                if (view === 'onboarding') setView('dashboard');
             }
           }
           
           const appsRes = await fetch('/api/applications', {
             headers: { 'Authorization': `Bearer ${user.token}` }
           });
           if (appsRes.ok) {
             const appsData = await appsRes.json();
             setApplications(appsData || []);
           }

           // Sync logs from backend
           if (data.logs?.length > 0) {
              setLogs(prev => {
                const existingIds = new Set(prev.map(l => l.id));
                const newLogs = data.logs.filter((l: any) => !existingIds.has(l.id));
                return [...newLogs, ...prev].slice(0, 50);
              });
           }

           // Sync Browser State
           setBrowserState({
               url: data.currentUrl || 'about:blank',
               screenshot: data.screenshot,
               isActive: data.isActive,
               state: data.state
           });
        } else if (res.status === 401) {
            handleLogout();
        }
      } catch (e) {
        console.error("Backend offline");
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, [user]);

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

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    addLog('Saving user profile and initializing discovery...', 'info');
    setStatus(prev => ({ ...prev, state: 'discovery', currentStep: 'Discovery Engine', progress: 50 }));
    
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        setProfile(newProfile);
        setView('discovery');
        addLog('Profile synchronized. Activating AI Discovery Engine.', 'success');
      }
    } catch (e) {
      addLog('Failed to sync profile with server. Continuing locally...', 'warning');
      setProfile(newProfile);
      setView('discovery');
    }
  };

  const handleStartApplication = async (opp: VisaOpportunity) => {
    if (!profile) return;
    
    addLog(`Creating application for ${opp.country}...`, 'info');
    const newApp: Partial<Application> = {
        country: opp.country,
        visaType: opp.visaType
    };

    try {
        const res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newApp)
        });
        if (res.ok) {
            const data = await res.json();
            setApplications(prev => [data.application, ...prev]);
            addLog(`Application for ${opp.country} initialized successfully.`, 'success');
            setView('dashboard');
        }
    } catch (e) {
        addLog('Error creating application.', 'error');
    }
  };

  const handleUpdateAppStatus = async (id: string, status: Application['status']) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    const updatedApp = { ...app, status, lastUpdate: new Date().toISOString() };
    try {
        const res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`
            },
            body: JSON.stringify(updatedApp)
        });
        if (res.ok) {
            setApplications(prev => prev.map(a => a.id === id ? updatedApp : a));
            if (selectedApplication?.id === id) setSelectedApplication(updatedApp);
            addLog(`Application status updated to ${status.replace('_', ' ')}.`, 'success');
        }
    } catch (e) {
        addLog('Failed to update application status.', 'error');
    }
  };

  const resetAll = async () => {
    if (confirm('Are you sure? This will clear all local and remote data.')) {
        await fetch('/api/bot/reset', { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        handleLogout();
        window.location.reload();
    }
  };

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const updatedProfile = { ...profile, profilePhoto: base64 };
        
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(updatedProfile)
            });
            if (res.ok) {
                setProfile(updatedProfile);
                addLog('Profile picture updated successfully.', 'success');
            }
        } catch (e) {
            addLog('Failed to update profile picture.', 'error');
        }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
                onClick={() => profile && photoInputRef.current?.click()}
                className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-xl shadow-blue-900/20 overflow-hidden cursor-pointer group relative"
            >
              {profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="User" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                  <Bot className="w-7 h-7 text-white" />
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input type="file" ref={photoInputRef} onChange={handleUpdatePhoto} className="hidden" accept="image/*" />
            <div className="space-y-0.5">
              <h1 className="font-display font-black text-slate-900 text-xl tracking-tight uppercase italic">VisaAgent<span className="text-blue-600">.AI</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">v3.0 PRO</span>
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-green-600 uppercase">System Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
                <div className="hidden md:flex items-center gap-6 mr-6 border-r border-slate-100 pr-6">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Profile</p>
                        <p className="text-sm font-bold text-slate-900">{profile.fullName}</p>
                    </div>
                </div>
            )}
            <nav className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[20px]">
                <button 
                  onClick={() => setView('dashboard')}
                  disabled={!profile}
                  className={`p-2.5 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setView('discovery')}
                  disabled={!profile}
                  className={`p-2.5 rounded-2xl transition-all ${view === 'discovery' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Globe className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button 
                  onClick={handleLogout}
                  className="p-2.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dynamic Content Area */}
        <div className="lg:col-span-12">
            <AnimatePresence mode="wait">
                {view === 'onboarding' && (
                    <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <OnboardingView 
                            onComplete={handleOnboardingComplete}
                            addLog={addLog}
                        />
                    </motion.div>
                )}
                
                {view === 'discovery' && profile && (
                    <motion.div key="discovery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <DiscoveryView 
                            profile={profile}
                            onApply={handleStartApplication}
                            addLog={addLog}
                        />
                    </motion.div>
                )}

                {view === 'dashboard' && (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <DashboardView 
                            applications={applications}
                            onViewDetails={setSelectedApplication}
                            onRefresh={() => addLog('System: Triggering manual status sync...', 'info')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Global Sidebar (Optional: Log console) */}
        {view !== 'onboarding' && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 flex flex-col h-75 overflow-hidden lg:col-span-1">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                    <h3 className="text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-blue-500" /> AI System Logs
                    </h3>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                    </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-[10px] leading-relaxed custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                            <span className="text-slate-600 font-bold">[{log.timestamp}]</span>
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

                <section className="lg:col-span-2 h-75">
                    <BrowserMonitor 
                        url={browserState.url}
                        screenshot={browserState.screenshot}
                        state={browserState.state}
                        isActive={browserState.isActive}
                    />
                </section>
            </div>
        )}
      </main>

      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/10">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-slate-900 text-xs uppercase tracking-tight italic">VisaAgent<span className="text-blue-600">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Global Connectivity</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Security Audit</a>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1 text-green-500">
               <div className="w-2 h-2 bg-green-500 rounded-full" />
               Global Nodes: 12 Active
            </span>
          </div>
        </div>
      </footer>

      {/* Full Screen Modals */}
      <AnimatePresence>
        {selectedApplication && (
            <DetailedViewModal 
                application={selectedApplication}
                profile={profile}
                onClose={() => setSelectedApplication(null)}
                onUpdateStatus={handleUpdateAppStatus}
            />
        )}
      </AnimatePresence>
    </div>
  );
}
