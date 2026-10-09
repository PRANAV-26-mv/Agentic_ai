import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  FileCheck, 
  BarChart, 
  Calendar, 
  HelpCircle, 
  Activity, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/analytics')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-200/70 rounded-3xl"></div>
          <div className="h-32 bg-slate-200/70 rounded-3xl"></div>
          <div className="h-32 bg-slate-200/70 rounded-3xl"></div>
          <div className="h-32 bg-slate-200/70 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { overview, deptPerformance, communityPerformance } = data;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Liquid Glass Command Center Hero Banner */}
      <div className="liquid-glass-dark rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.18)] relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-white/90 text-xs font-semibold px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Campus Analytics & Control Center</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Command Overview
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
              Real-time telemetry across student cohorts, evaluation pipelines, group discussion sessions, and automated grading metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white/10 text-emerald-300 text-xs font-semibold rounded-full border border-white/20 backdrop-blur-md shadow-xs">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>99.9% Telemetry Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Layered Floating Liquid Glass Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Students */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Students</span>
            <div className="p-2 liquid-glass-pill text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{overview.totalStudents}</div>
          <div className="text-[11px] text-slate-500 mt-1">{overview.activeStudents} Active Accounts</div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80">
            <div 
              className="bg-slate-900 h-full rounded-full transition-all duration-1000"
              style={{ width: `${overview.totalStudents > 0 ? (overview.activeStudents / overview.totalStudents) * 100 : 75}%` }}
            />
          </div>
        </div>

        {/* Assessments Published */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assessments</span>
            <div className="p-2 liquid-glass-pill text-sky-600 bg-sky-50/60 border-sky-200/60">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{overview.totalAssessments}</div>
          <div className="text-[11px] text-sky-600 font-semibold mt-1">{overview.completedAttempts} Completed Attempts</div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-1000 shadow-xs"
              style={{ width: '85%' }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Score</span>
            <div className="p-2 liquid-glass-pill text-emerald-600 bg-emerald-50/60 border-emerald-200/60">
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{overview.avgScore}%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Institutional Average</div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-xs"
              style={{ width: `${Math.min(100, overview.avgScore || 80)}%` }}
            />
          </div>
        </div>

        {/* Attendance Sessions */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sessions Held</span>
            <div className="p-2 liquid-glass-pill text-amber-600 bg-amber-50/60 border-amber-200/60">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{overview.totalSessions}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">92.5% Participation Rate</div>
          <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-1000 shadow-xs"
              style={{ width: '92.5%' }}
            />
          </div>
        </div>

      </div>

      {/* Layered Floating Liquid Glass Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Performance */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/80 pb-3">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Average Scores by Department</h3>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-slate-700">
              Real-time
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={deptPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.90)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 12px 32px rgba(31, 38, 135, 0.12)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgScore" fill="#0284c7" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Community Performance */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/80 pb-3">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Average Scores by Community</h3>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-slate-700">
              Real-time
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={communityPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="community" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.90)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 12px 32px rgba(31, 38, 135, 0.12)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgScore" fill="#1e293b" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
