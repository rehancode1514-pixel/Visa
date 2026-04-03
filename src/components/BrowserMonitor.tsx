import React from 'react';
import { 
  Globe, 
  Shield, 
  Lock, 
  RefreshCw, 
  ExternalLink, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { motion } from 'motion/react';

interface BrowserMonitorProps {
  url: string;
  screenshot: string | null;
  state: 'idle' | 'logging_in' | 'logged_in' | 'applying' | 'error';
  isActive: boolean;
}

export default function BrowserMonitor({ url = 'about:blank', screenshot, state, isActive }: BrowserMonitorProps) {
  return (
    <div className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full group">
      {/* Browser Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-4">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        </div>
        
        <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <Lock className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-slate-400 font-mono truncate flex-1">{url}</span>
          <RefreshCw className={`w-3 h-3 text-slate-500 ${isActive ? 'animate-spin' : ''}`} />
        </div>

        <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-500 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {screenshot ? (
          <img 
            src={`data:image/jpeg;base64,${screenshot}`} 
            alt="Browser View" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 border border-slate-800">
              <Monitor className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-400">Browser Standby</h4>
              <p className="text-[10px] text-slate-600 max-w-45">Start an application to initialize the live automation view.</p>
            </div>
            {isActive && (
                 <div className="mt-4 flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Initializing...</span>
                 </div>
            )}
          </div>
        )}

        {/* Status Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Bot Engine</p>
                    <p className="text-xs font-bold text-white capitalize">{state.replace('_', ' ')}</p>
                </div>
            </div>
            
            {isActive && (
                <div className="bg-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                    Live View
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
