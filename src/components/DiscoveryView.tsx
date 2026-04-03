import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  ExternalLink, 
  Zap, 
  MoreVertical,
  ChevronRight,
  Sparkles,
  Info,
  RefreshCw,
  Bot
} from 'lucide-react';

import { motion } from 'motion/react';
import { VisaOpportunity, UserProfile } from '../types';
import { generateVisaRecommendations } from '../lib/gemini';

interface DiscoveryViewProps {
  profile: UserProfile;
  onApply: (opportunity: VisaOpportunity) => void;
  addLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function DiscoveryView({ profile, onApply, addLog }: DiscoveryViewProps) {
  const [opportunities, setOpportunities] = useState<VisaOpportunity[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      addLog('AI Engine: Analyzing global visa eligibility...', 'info');
      const recs = await generateVisaRecommendations(profile);
      setOpportunities(recs);
      setIsGenerating(false);
      addLog(`AI Engine: Found ${recs.length} relevant visa opportunities.`, 'success');
    };
    loadRecommendations();
  }, [profile]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Moderate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hard': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-6">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-blue-600"
          />
          <Sparkles className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-display font-bold text-slate-900">AI Recommendation Engine</h3>
          <p className="text-sm text-slate-500">Cross-referencing {profile.nationality} eligibility with {profile.purpose} regulations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            Visa Discovery
          </h2>
          <p className="text-slate-500 mt-1">Smart recommendations based on your {profile.nationality} profile.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              AI Match: {opportunities.length > 0 ? Math.max(...opportunities.map(o => o.eligibilityScore)) : 0}%
           </div>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[40px] p-20 text-center space-y-6 shadow-sm">
           <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
              <AlertTriangle className="w-10 h-10" />
           </div>
           <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-display font-bold text-slate-900">No Direct Matches Found</h3>
              <p className="text-sm text-slate-500">The AI Discovery Engine couldn't find immediate matches for your profile. This usually happens for specific nationality combinations or strict travel purposes.</p>
           </div>
           <div className="flex justify-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opt, idx) => (
            <motion.div 
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-lg font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{opt.country}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{opt.visaType}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getCategoryColor(opt.category)}`}>
                    {opt.category.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{opt.description}</p>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" /> Success Rate
                    </p>
                    <p className="text-xl font-display font-bold text-slate-900">{opt.successProbability}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-500" /> Eligibility
                    </p>
                    <p className="text-xl font-display font-bold text-slate-900">{opt.eligibilityScore}%</p>
                  </div>
                </div>

                {opt.vfsProcessed && (
                  <div className="bg-blue-50 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-[10px] font-bold text-blue-600 uppercase">VFS Global Verified</span>
                    </div>
                    <span title="Processed via VFS Global Partner" className="flex items-center">
                      <Info className="w-3 h-3 text-blue-400 cursor-help" />
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => onApply(opt)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Start Application
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                {opt.vfsPortalLink && (
                  <a 
                    href={opt.vfsPortalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}


      {opportunities.some(o => o.vfsProcessed) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-900/30 overflow-hidden relative"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Shield className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2 bg-blue-500/30 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/30">
                <Bot className="w-3 h-3" /> System Integration Active
              </div>
              <h3 className="text-2xl font-display font-bold leading-tight">VFS Global Auto-Sync Enabled</h3>
              <p className="text-blue-100 text-sm leading-relaxed">Our AI agent is ready to synchronize your profile with VFS Global portals. This will auto-fill forms and monitor appointment slots 24/7.</p>
              
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                      {i === 1 ? 'EU' : i === 2 ? 'UK' : 'US'}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-bold text-blue-200">
                  <span className="text-white">Active Nodes:</span> London, Paris, Mumbai
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full md:w-80 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-200">
                <span>Bot Status</span>
                <span className="text-white flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                </span>
              </div>
              <div className="space-y-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-blue-100 italic">"Checking slot availability for Poland D-Type..."</p>
                  <p className="text-[9px] text-blue-300">Last Ping: 0.2s ago</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-slate-900 rounded-[40px] p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="w-24 h-24 text-blue-400" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="text-2xl font-display font-bold text-white leading-tight">Need a customized path?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Our AI can generate a tailored Statement of Purpose (SOP) and document checklist for any country in the world, even those not listed above.</p>
          <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-2 mt-4">
            Request Custom AI Analysis <Sparkles className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
