import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../services/api';
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
  MessageSquare, 
  Trophy, 
  Crown, 
  Zap, 
  Medal,
  Download,
  Loader2,
  Users,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GiftBurstModal } from '../components/GiftBurstModal';
import { CertificateModal } from '../components/CertificateModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>({ percentage: 100, present: 0, total: 0 });
  const [completedResults, setCompletedResults] = useState<any[]>([]);
  const [quizSessions, setQuizSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showGiftBurst, setShowGiftBurst] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  const handleDownloadReportCard = async () => {
    if (!user) return;
    setDownloadingReport(true);
    try {
      const res = await api.get(`/students/${user.id}/report-card`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (user.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Official_Report_Card_${cleanName}_${user.student_id || ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Axios blob download failed, falling back to direct URL navigation:', err);
      const token = localStorage.getItem('portal_auth_token') || '';
      window.open(`${API_BASE_URL}/students/${user.id}/report-card?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingReport(false);
    }
  };

  useEffect(() => {
    // 1. Fetch assessments
    api.get('/assessments')
      .then(res => setAssessments(res.data))
      .catch(err => console.error(err));

    // 2. Fetch learning materials
    api.get('/materials')
      .then(res => setMaterials(res.data.slice(0, 3)))
      .catch(err => console.error(err));

    // 3. Fetch attendance stats
    api.get('/attendance/my-stats')
      .then(res => setAttendanceStats(res.data))
      .catch(err => console.error(err));

    // 4. Fetch student results
    api.get('/results')
      .then(res => setCompletedResults(res.data))
      .catch(err => console.error(err));

    // 5. Fetch live quiz sessions
    api.get('/quiz-sessions')
      .then(res => setQuizSessions(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = completedResults.length;
  const pendingCount = Math.max(0, assessments.length - completedCount);
  const avgScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedResults.length)
    : 0;

  // Check if student attended and secured a podium spot (1st, 2nd, or 3rd) in any published live quiz
  const podiumQuiz = quizSessions.find(q => q.is_results_published && (q.my_rank === 1 || q.my_rank === 2 || q.my_rank === 3));

  if (loading) {
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Apple Product Storytelling Hero Card */}
      {/* Liquid Glass Hero Banner */}
      <div className="liquid-glass-dark rounded-[28px] p-7 sm:p-9 shadow-[0_24px_60px_rgba(15,23,42,0.35)] relative overflow-hidden border border-white/20">
        {/* Soft blue and violet ambient lighting sheen */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-white/95 text-xs font-semibold px-3.5 py-1 rounded-full border border-white/25 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>{user?.community || 'Agentic AI Community'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name}.
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
              Department of {user?.department} • Year {user?.year} • Role Focus: <span className="text-white font-semibold bg-white/10 px-2 py-0.5 rounded-md border border-white/20">{user?.suggested_role || 'AI Developer'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadReportCard}
              disabled={downloadingReport}
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-full border border-white/25 shadow-xs backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
              title="Download official report card PDF"
            >
              {downloadingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Report Card PDF</span>
                </>
              )}
            </button>

            <Link
              to="/ask-doubt"
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-100 text-[#1d1d1f] font-bold text-xs px-5 py-2.5 rounded-full shadow-lg transition-all cursor-pointer transform hover:scale-102 active:scale-98 border border-white"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Podium Victory Banner (If student achieved top 3 in any live quiz) */}
      {podiumQuiz && (
        <div className={`rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border backdrop-blur-2xl ${
          podiumQuiz.my_rank === 1
            ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-400/60 text-white'
            : podiumQuiz.my_rank === 2
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-300/60 text-white'
            : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-500/60 text-white'
        }`}>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center shrink-0 shadow-md">
                {podiumQuiz.my_rank === 1 ? (
                  <Trophy className="w-6 h-6 text-amber-300 fill-amber-300" />
                ) : podiumQuiz.my_rank === 2 ? (
                  <Medal className="w-6 h-6 text-slate-200 fill-slate-200" />
                ) : (
                  <Award className="w-6 h-6 text-amber-400 fill-amber-400" />
                )}
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/90 border border-white/20 mb-1">
                  {podiumQuiz.my_rank === 1 ? '1st Place Champion Record 🥇' : podiumQuiz.my_rank === 2 ? '2nd Place Silver Record 🥈' : '3rd Place Bronze Record 🥉'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Cohort Podium Finish: {podiumQuiz.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Score: <strong className="text-white">{podiumQuiz.my_score} / {podiumQuiz.my_max_score} pts</strong> ({podiumQuiz.my_percentage}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setCertificateData({
                    studentName: user?.name || 'Candidate Student',
                    studentReg: user?.student_id,
                    studentDepartment: user?.department,
                    quizTitle: podiumQuiz.title,
                    rank: podiumQuiz.my_rank,
                    totalParticipants: podiumQuiz.participant_count || 1,
                    score: podiumQuiz.my_score,
                    maxScore: podiumQuiz.my_max_score,
                    percentage: podiumQuiz.my_percentage,
                    completionDate: podiumQuiz.my_submitted_at || new Date().toISOString(),
                    timeTaken: podiumQuiz.my_time_taken_seconds ? `${Math.floor(podiumQuiz.my_time_taken_seconds / 60)}m ${podiumQuiz.my_time_taken_seconds % 60}s` : undefined
                  });
                  setShowCertificate(true);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-full border border-white/25 transition-all cursor-pointer backdrop-blur-md"
              >
                Certificate
              </button>

              <button
                onClick={() => setShowGiftBurst(true)}
                className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold text-xs rounded-full shadow-lg transition-all cursor-pointer hover:scale-102"
              >
                Open Reward Burst 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Layered Floating Liquid Glass Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Assessments */}
        <div className="liquid-glass-card liquid-glass-card-hover p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assessments</span>
            <div className="p-2 liquid-glass-pill text-indigo-600 bg-indigo-50/70 border-indigo-200/60">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{assessments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned for cohort</div>
          <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.35)]"
              style={{ width: `${assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Completed / Pending */}
        <div className="liquid-glass-card liquid-glass-card-hover p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <div className="p-2 liquid-glass-pill text-emerald-600 bg-emerald-50/70 border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {completedCount} <span className="text-slate-400 text-sm font-medium">/ {pendingCount} left</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Active pipeline</div>
          <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80 p-0.5">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
              style={{ width: `${assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Attendance % */}
        <div className="liquid-glass-card liquid-glass-card-hover p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Attendance</span>
            <div className="p-2 liquid-glass-pill text-indigo-600 bg-indigo-50/70 border-indigo-200/60">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{attendanceStats.percentage || 100}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{attendanceStats.present || 1} of {attendanceStats.total || 1} present</div>
          <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80 p-0.5">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.35)]"
              style={{ width: `${Math.min(100, attendanceStats.percentage || 100)}%` }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="liquid-glass-card liquid-glass-card-hover p-5 sm:p-6 rounded-3xl group">
          <div className="flex justify-between items-center text-slate-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Mastery</span>
            <div className="p-2 liquid-glass-pill text-amber-600 bg-amber-50/70 border-amber-200/60">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{avgScore}%</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Community percentile</div>
          <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-3 overflow-hidden border border-white/80 p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.35)]"
              style={{ width: `${Math.min(100, avgScore)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Grid: Upcoming Assessments & Learning Materials with Layered Floating Glass Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Assessments */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex justify-between items-center border-b border-white/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-xl liquid-glass-pill text-slate-800">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Active Assessments</h3>
            </div>
            <Link to="/assessments" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {assessments.slice(0, 3).map((ass) => (
              <div 
                key={ass.id} 
                className="p-4 liquid-glass-card hover:bg-white/95 rounded-2xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <div className="inline-block liquid-glass-pill text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 mb-1.5">
                    {ass.type} • {ass.duration_minutes} Mins
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">{ass.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ass.description}</p>
                </div>
                <Link
                  to={`/assessments`}
                  className="px-4 py-2 liquid-btn-primary text-xs font-semibold rounded-full shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  Start Assessment
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Study Materials */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex justify-between items-center border-b border-white/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-xl liquid-glass-pill text-slate-800">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Curated Study Materials</h3>
            </div>
            <Link to="/materials" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {materials.slice(0, 3).map((mat) => (
              <div 
                key={mat.id} 
                className="p-4 liquid-glass-card hover:bg-white/95 rounded-2xl transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl liquid-glass-pill text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {mat.material_type === 'URL' ? <Globe className="w-5 h-5 text-indigo-600" /> : mat.material_type}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 tracking-tight">{mat.title}</h4>
                    <p className="text-xs text-slate-500">{mat.material_type === 'URL' ? 'Official Web Resource' : mat.page_count ? `${mat.page_count} pages` : 'Digital Resource'}</p>
                  </div>
                </div>
                <Link
                  to="/materials"
                  className="px-4 py-1.5 liquid-btn-glass font-semibold text-xs rounded-full transition-all shrink-0 cursor-pointer"
                >
                  Access
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Podium Gift Burst Modal */}
      {showGiftBurst && podiumQuiz && (
        <GiftBurstModal
          isOpen={showGiftBurst}
          onClose={() => setShowGiftBurst(false)}
          quizTitle={podiumQuiz.title}
          rank={podiumQuiz.my_rank}
          score={podiumQuiz.my_score}
          maxScore={podiumQuiz.my_max_score}
          accuracy={`${podiumQuiz.my_percentage}%`}
          totalParticipants={podiumQuiz.participant_count || 1}
        />
      )}

      {/* Official Certificate Modal */}
      {showCertificate && certificateData && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          {...certificateData}
        />
      )}

    </div>
  );
};
