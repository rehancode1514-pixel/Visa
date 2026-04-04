import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  Github, 
  Chrome,
  AlertCircle,
  Eye,
  EyeOff,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your credentials');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        onLogin({ email: data.email, token: data.token, id: data.id });
      } else if (res.status === 401) {
        // Automatically try to register to make it easy to use
        const regRes = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        if (regRes.ok) {
          const data = await regRes.json();
          onLogin({ email: data.email, token: data.token, id: data.id });
        } else {
          setError('Failed to authenticate or register');
        }
      } else {
        const err = await res.json();
        setError(err.message || 'Authentication failed');
      }
    } catch (e: any) {
      setError('System error connecting to Auth node');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg p-8 mx-4"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[48px] p-10 shadow-2xl shadow-black/50 overflow-hidden relative">
          
          {/* Internal Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <div className="text-center space-y-4 mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-900/40 rotate-3 transform hover:rotate-0 transition-transform duration-500">
                <Bot className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase italic flex items-center justify-center gap-2">
              VISA<span className="text-blue-500"> AI</span>
            </h1>
            <p className="text-slate-400 font-medium">Your global immigration journey starts here.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95 transition-all group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-6">
            <button className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
              <Github className="w-4 h-4" /> Github
            </button>
            <button className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
              <Chrome className="w-4 h-4" /> Google
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
               <Shield className="w-3 h-3" /> GDPR Compliant Encryption
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
