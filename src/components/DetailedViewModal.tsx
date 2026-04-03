import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileText, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Zap, 
  Bot, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Copy,
  Brain
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { Application, UserProfile } from '../types';
import { generateSOP } from '../lib/gemini';

interface DetailedViewModalProps {
  application: Application;
  profile: UserProfile | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Application['status']) => void;
}

export default function DetailedViewModal({ application, profile, onClose, onUpdateStatus }: DetailedViewModalProps) {
  const [sop, setSop] = useState<string>('');
  const [isGeneratingSop, setIsGeneratingSop] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'ai-insights'>('details');

  const handleGenerateSop = async () => {
    if (!profile) return;
    setIsGeneratingSop(true);
    try {
      const generatedSop = await generateSOP(profile, application.country);
      setSop(generatedSop);
    } catch (error) {
      console.error("Failed to generate SOP", error);
    } finally {
      setIsGeneratingSop(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-10 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-5xl max-h-full rounded-[48px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-white"
      >
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-display font-bold shadow-2xl shadow-blue-900/20">
              {application.country.charAt(0)}
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-bold text-slate-900 uppercase tracking-tight">{application.country}</h2>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{application.visaType} Application</span>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors px-2 py-0.5 rounded-full bg-blue-50">
                   ID: {application.id}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-2xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-8 flex flex-col gap-2">
                {[
                    { id: 'details', label: 'Application Data', icon: Zap },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'ai-insights', label: 'AI Intelligence', icon: Brain },
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl shadow-slate-200/50 border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-300'}`} />
                        {tab.label}
                    </button>
                ))}

                <div className="mt-12 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quick Actions</p>
                    <button className="w-full text-left p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
                        <span className="text-xs font-bold text-slate-700">Download Draft</span>
                        <Download className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                    <button className="w-full text-left p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
                        <span className="text-xs font-bold text-slate-700">VFS Portal</span>
                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'details' && (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> VFS Submission Center
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{application.vfsCenterLocation || 'Not selected yet'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Appointment Date
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{application.appointmentDate ? new Date(application.appointmentDate).toDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="w-3 h-3" /> Fees Paid
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{application.feesPaid ? `$${application.feesPaid.toFixed(2)}` : '$0.00'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Status Timeline
                                    </p>
                                    <p className="text-sm font-bold text-slate-800 capitalize">{application.status.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4 shadow-inner">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-blue-600" /> AI Internal Comments
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed italic">{application.notes || 'No notes available yet. Start the synchronization to receive AI updates.'}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Manual Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {['in_progress', 'submitted', 'appointment_booked', 'approved', 'rejected'].map((s) => (
                                        <button 
                                            key={s}
                                            onClick={() => onUpdateStatus(application.id, s as any)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${application.status === s ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/10' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                                        >
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'documents' && (
                        <motion.div 
                            key="documents"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-display font-bold text-slate-900">Document Checklist</h3>
                                <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                    <Download className="w-3 h-3" /> Download Full Set
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'Passport Copy (Bio Page)', status: profile?.documents.passportCopy ? 'verified' : 'missing' },
                                    { name: 'Financial Statements (6 months)', status: profile?.documents.bankStatement ? 'verified' : 'missing' },
                                    { name: 'Employment Letter / NOC', status: 'missing' },
                                    { name: 'Flight Reservation', status: 'missing' },
                                    { name: 'VFS Appointment Confirmation', status: application.status === 'appointment_booked' ? 'verified' : 'missing' },
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${doc.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-300'}`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                                        </div>
                                        {doc.status === 'verified' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-amber-300" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ai-insights' && (
                        <motion.div 
                            key="ai-insights"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-10"
                        >
                            <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 relative overflow-hidden group/sop shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-30 pointer-events-none group-hover/sop:rotate-12 transition-transform duration-1000">
                                    <Sparkles className="w-32 h-32 text-blue-500" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-center">
                                       <div className="space-y-1">
                                            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                                                <Bot className="w-8 h-8 text-blue-400" />
                                                AI-Generated SOP
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Statement of Purpose Generator</p>
                                       </div>
                                       {!sop && (
                                            <button 
                                                onClick={handleGenerateSop}
                                                disabled={isGeneratingSop}
                                                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/40 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isGeneratingSop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {isGeneratingSop ? 'Writing...' : 'Generate with Gemini'}
                                            </button>
                                       )}
                                    </div>

                                    {sop ? (
                                        <div className="space-y-6">
                                            <div className="bg-slate-800/50 text-slate-300 text-xs font-medium leading-relaxed p-8 rounded-3xl border border-slate-700/50 max-h-75 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                                                {sop}
                                            </div>
                                            <div className="flex gap-3">
                                                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2">
                                                    <Copy className="w-4 h-4" /> Copy Content
                                                </button>
                                                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2" onClick={() => setSop('')}>
                                                    <RefreshCw className="w-4 h-4" /> Rewrite
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-12 border-2 border-dashed border-slate-800 rounded-4xl text-center text-slate-500">
                                            <span className="text-sm font-medium">Initialize Gemini to write a high-converting Statement of Purpose.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Footer info/status */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">End-to-End Encryption Enabled</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last system sync: {new Date(application.lastUpdate).toLocaleTimeString()}</p>
        </div>
      </motion.div>
    </div>
  );
}
