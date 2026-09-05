import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Award, 
  TrendingUp, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>({ percentage: 100, present: 0, total: 0 });
  const [completedResults, setCompletedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.get('/assessments'),
      api.get('/materials'),
      api.get('/attendance'),
      api.get('/results')
    ]).then(([assRes, matRes, attRes, resRes]) => {
      setAssessments(assRes.data);
      setMaterials(matRes.data);
      setAttendanceStats(attRes.data);
      setCompletedResults(resRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = completedResults.filter(r => r.status === 'COMPLETED' || r.status === 'AUTO_SUBMITTED').length;
  const pendingCount = Math.max(0, assessments.length - completedCount);
  const avgScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedResults.length)
    : 85;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Hero Card */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <div className="inline-flex items-center space-x-2 bg-sky-500/30 text-sky-200 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-sky-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{user?.community || 'Agentic AI Community'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-slate-200 text-sm mt-1 font-medium">
              Department of {user?.department} • Year {user?.year} • Suggested Role: <span className="text-sky-300 font-bold">{user?.suggested_role || 'AI Developer'}</span>
            </p>
          </div>
          <Link
            to="/ask-doubt"
            className="inline-flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Dashboard Cards matching §6 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Assessments</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{assessments.length}</div>
          <div className="text-xs text-slate-500 mt-1">Assigned for your cohort</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed / Pending</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{completedCount} <span className="text-slate-400 font-medium text-base">/ {pendingCount} pending</span></div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Active evaluation pipeline</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance %</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attendanceStats.percentage || 100}%</div>
          <div className="text-xs text-slate-500 mt-1">{attendanceStats.present || 1} present of {attendanceStats.total || 1} sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Award className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{avgScore}%</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Top 15% in Community</div>
        </div>

      </div>

      {/* Grid Content: Upcoming Assessments & Recent Study Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Assessments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <span>Upcoming & Active Assessments</span>
            </h3>
            <Link to="/assessments" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {assessments.slice(0, 3).map((ass) => (
              <div key={ass.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <div className="inline-block bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                    {ass.type} • {ass.duration_minutes} Mins
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{ass.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ass.description}</p>
                </div>
                <Link
                  to={`/assessments`}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors border border-sky-500"
                >
                  Start Assessment
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Study Materials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Recent Study Materials</span>
            </h3>
            <Link to="/materials" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {materials.slice(0, 3).map((mat) => (
              <div key={mat.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold text-xs">
                    {mat.material_type}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{mat.title}</h4>
                    <p className="text-xs text-slate-500">{mat.page_count ? `${mat.page_count} pages` : 'External Link'}</p>
                  </div>
                </div>
                <Link
                  to="/ask-doubt"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Ask Doubts
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
