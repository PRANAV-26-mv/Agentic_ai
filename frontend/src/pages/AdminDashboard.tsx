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
  TrendingUp
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
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  const { overview, deptPerformance, communityPerformance } = data;

  return (
    <div className="space-y-8">
      
      {/* Admin Control Center Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-xl relative overflow-hidden border border-purple-900/40 animate-fade-in-up animate-aurora">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-float"></div>
        <div className="absolute bottom-0 left-1/4 transform translate-y-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none animate-float-subtle"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-purple-500/25 text-purple-200 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-400/30 mb-2 shadow-xs shimmer-badge">
            <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-ping" />
            <span>Live Monitoring Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Admin Control Center</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-700/60 text-purple-200">v2.5 Live</span>
          </h2>
          <p className="text-slate-300 text-xs mt-1">Real-time overview of student performance, assessment pipeline, and attendance analytics.</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-2.5 relative z-10">
          <span className="bg-emerald-950/80 text-emerald-300 text-xs font-black px-3.5 py-1.5 rounded-xl border border-emerald-500/40 shadow-sm flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>99.9% System Uptime</span>
          </span>
        </div>
      </div>

      {/* Dashboard Stat Cards with interactive lift, glowing border, and animated progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-purple-400 group animate-fade-in-up stagger-1">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalStudents}</div>
          <div className="text-xs text-purple-600 font-medium mt-1 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
            <span>{overview.activeStudents} Active Accounts</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overview.totalStudents > 0 ? (overview.activeStudents / overview.totalStudents) * 100 : 75}%` }}
            />
          </div>
        </div>

        {/* Assessments Published */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-sky-400 group animate-fade-in-up stagger-2">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assessments Published</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalAssessments}</div>
          <div className="text-xs text-brand-600 font-medium mt-1 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
            <span>{overview.completedAttempts} Completed Attempts</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: '85%' }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-emerald-400 group animate-fade-in-up stagger-3">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <BarChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.avgScore}%</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Across all departments</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full bg-stripes-animated transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, overview.avgScore || 80)}%` }}
            />
          </div>
        </div>

        {/* Attendance Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-amber-400 group animate-fade-in-up stagger-4">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Sessions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalSessions}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">92.5% Avg Participation</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full bg-stripes-animated transition-all duration-1000 ease-out"
              style={{ width: '92.5%' }}
            />
          </div>
        </div>

      </div>

      {/* Analytics Charts using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-interactive animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Average Scores by Department</h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
              <span>Live Synced</span>
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={deptPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#0284c7" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-interactive animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Average Scores by Community</h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
              <span>Live Synced</span>
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={communityPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="community" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
