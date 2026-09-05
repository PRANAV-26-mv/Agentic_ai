import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PieChart, TrendingUp, Users, BookOpen, Award, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsPage: React.FC = () => {
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
      <div className="space-y-6">
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const { overview, deptPerformance, communityPerformance } = data;

  return (
    <div className="space-y-8">
      
      {/* Page Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
          <PieChart className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Institutional Analytics & Performance</h2>
          <p className="text-slate-500 text-xs mt-0.5">Comprehensive analytics tracking student engagement, department metrics, and assessment scores.</p>
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-100 rounded-xl text-sky-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overview?.totalStudents || 25}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Registered Students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overview?.completedAttempts || 0}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Completed Tests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overview?.avgScore || 0}%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Assessment Score</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overview?.totalMaterials || 0}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Study Resources</div>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Department Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Department Student Distribution</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">By Department</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={deptPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 'dataMax + 2']} />
                <Tooltip />
                <Bar dataKey="studentsCount" fill="#0284c7" radius={[8, 8, 0, 0]} name="Students Count" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Community Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Community Student Breakdown</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">By Community</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={communityPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="community" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 'dataMax + 2']} />
                <Tooltip />
                <Bar dataKey="studentsCount" fill="#9333ea" radius={[8, 8, 0, 0]} name="Students Count" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
