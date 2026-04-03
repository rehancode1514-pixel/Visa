import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Globe, 
  Clock, 
  Activity, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Application } from '../types';

interface DashboardViewProps {
  applications: Application[];
  onViewDetails: (app: Application) => void;
  onRefresh: () => void;
}

export default function DashboardView({ applications, onViewDetails, onRefresh }: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    total: applications.length,
    approved: applications.filter(a => a.status === 'approved').length,
    pending: applications.filter(a => ['in_progress', 'submitted', 'appointment_booked', 'processing'].includes(a.status)).length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    successRate: applications.length > 0 ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100) : 0
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'not_started': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'appointment_booked': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const filteredApps = applications.filter(app => 
    app.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-full mb-2">
          <h2 className="text-3xl font-display font-bold text-slate-900 leading-tight">Your Visa Applications</h2>
          <p className="text-slate-500 font-medium">Track your global immigration journey in real-time.</p>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">Total</span>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-display font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Applications</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">Approved</span>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-display font-bold text-slate-900">{stats.approved}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Successful</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">Pending</span>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-display font-bold text-slate-900">{stats.pending}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-widest">Rate</span>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-display font-bold text-slate-900">{stats.successRate}%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approval Rate</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by country or applicant..."
              className="w-full bg-slate-50 border border-slate-200 px-10 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all">
              <Filter className="w-4 h-4" />
            </button>
            <button 
              onClick={onRefresh}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              Sync Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Applicant / ID</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Destination</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Visa Type</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Current Status</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Last Update</th>
                <th className="p-6 border-b border-slate-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <FileText className="w-16 h-16 opacity-30" />
                      <p className="text-sm font-medium italic">No applications found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{app.applicantName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {app.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{app.country}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{app.visaType}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest w-fit ${getStatusStyle(app.status)}`}>
                          {app.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {['submitted', 'processing', 'appointment_booked'].includes(app.status) && <Clock className="w-3 h-3 animate-pulse" />}
                          {app.status.replace('_', ' ')}
                        </span>
                        {app.appointmentDate && (
                           <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(app.appointmentDate).toLocaleDateString()}
                           </p>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-slate-400">{new Date(app.lastUpdate).toLocaleDateString()}</p>
                      <p className="text-[10px] font-medium text-slate-400">At {new Date(app.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => onViewDetails(app)}
                        className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group/btn ml-auto border border-slate-200 hover:border-blue-600"
                      >
                        Details
                        <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
