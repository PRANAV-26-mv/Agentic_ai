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
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-purple-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Monitoring Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Admin Control Center</h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time overview of student performance, assessment pipeline, and attendance.</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>99.9% Uptime</span>
          </span>
        </div>
      </div>

      {/* Dashboard Cards matching §9 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-hover-lift hover:border-purple-300">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl transition-transform hover:scale-110"><Users className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalStudents}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">{overview.activeStudents} Active Accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-hover-lift hover:border-sky-300">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assessments Published</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl transition-transform hover:scale-110"><FileCheck className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalAssessments}</div>
          <div className="text-xs text-brand-600 font-medium mt-1">{overview.completedAttempts} Completed Attempts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-hover-lift hover:border-emerald-300">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl transition-transform hover:scale-110"><BarChart className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.avgScore}%</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Across all departments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-hover-lift hover:border-amber-300">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Sessions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl transition-transform hover:scale-110"><Calendar className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalSessions}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">92.5% Avg Participation</div>
        </div>

      </div>

      {/* Analytics Charts using Recharts matching §9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Average Scores by Department</h3>
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

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Average Scores by Community</h3>
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
