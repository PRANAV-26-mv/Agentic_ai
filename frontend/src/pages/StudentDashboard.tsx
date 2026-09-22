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
  MessageSquare,
  Trophy,
  Crown,
  Zap,
  Medal
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
    : 85;

  // Check if student attended and secured a podium spot (1st, 2nd, or 3rd) in any live quiz
  const podiumQuiz = quizSessions.find(q => q.my_rank === 1) ||
                     quizSessions.find(q => q.my_rank === 2) ||
                     quizSessions.find(q => q.my_rank === 3);

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
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 animate-aurora rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-sky-900/40 animate-fade-in-up">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-sky-500/25 rounded-full blur-3xl pointer-events-none animate-float"></div>
        <div className="absolute bottom-0 left-1/3 transform translate-y-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none animate-float-subtle"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <div className="inline-flex items-center space-x-2 bg-sky-500/30 text-sky-200 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-sky-400/40 shadow-xs shimmer-badge">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-sparkle-spin" />
              <span>{user?.community || 'Agentic AI Community'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Welcome back, {user?.name}!</span>
              <span className="inline-block animate-bounce text-2xl">👋</span>
            </h2>
            <p className="text-slate-200 text-sm mt-1 font-medium">
              Department of {user?.department} • Year {user?.year} • Suggested Role: <span className="text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/60">{user?.suggested_role || 'AI Developer'}</span>
            </p>
          </div>
          <Link
            to="/ask-doubt"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-sky-500/30 btn-shimmer transform hover:scale-105 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4 animate-pulse" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Podium Victory Banner (When student won 1st, 2nd, or 3rd place in a live quiz) */}
      {podiumQuiz && (
        <div className={`border-2 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-fade-in-up stagger-1 ${
          podiumQuiz.my_rank === 1
            ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-400/80 animate-champion-glow'
            : podiumQuiz.my_rank === 2
            ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-slate-300/80 animate-silver-glow'
            : 'bg-gradient-to-r from-amber-950 via-orange-950 to-amber-950 border-amber-500/80 animate-bronze-glow'
        }`}>
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none animate-float" />
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start sm:items-center space-x-4">
              <div className={`w-14 h-14 rounded-2xl p-0.5 shadow-lg shrink-0 ${
                podiumQuiz.my_rank === 1
                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-amber-500/40'
                  : podiumQuiz.my_rank === 2
                  ? 'bg-gradient-to-tr from-slate-300 to-sky-200 shadow-slate-400/40'
                  : 'bg-gradient-to-tr from-amber-600 to-orange-400 shadow-orange-500/40'
              }`}>
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  {podiumQuiz.my_rank === 1 ? (
                    <Trophy className="w-7 h-7 text-amber-300 fill-amber-300 filter drop-shadow animate-float" />
                  ) : podiumQuiz.my_rank === 2 ? (
                    <Medal className="w-7 h-7 text-slate-200 fill-slate-300 filter drop-shadow animate-silver-float" />
                  ) : (
                    <Award className="w-7 h-7 text-amber-400 fill-amber-500 filter drop-shadow animate-bronze-float" />
                  )}
                </div>
              </div>

              <div>
                <div className={`inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 ${
                  podiumQuiz.my_rank === 1
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                    : podiumQuiz.my_rank === 2
                    ? 'bg-sky-400/20 text-sky-200 border-sky-400/30 shimmer-silver-badge'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30 shimmer-bronze-badge'
                }`}>
                  {podiumQuiz.my_rank === 1 ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300 animate-bounce" />
                      <span>1st Place Champion Record 🥇</span>
                    </>
                  ) : podiumQuiz.my_rank === 2 ? (
                    <>
                      <Medal className="w-3 h-3 text-sky-300 animate-silver-float" />
                      <span>2nd Place Silver Podium Record 🥈</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3 h-3 text-amber-400 animate-bronze-float" />
                      <span>3rd Place Bronze Podium Record 🥉</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-black text-white">
                  {podiumQuiz.my_rank === 1 && `You Won 1st Place in ${podiumQuiz.title}! 🥇`}
                  {podiumQuiz.my_rank === 2 && `You Won 2nd Place in ${podiumQuiz.title}! 🥈`}
                  {podiumQuiz.my_rank === 3 && `You Won 3rd Place in ${podiumQuiz.title}! 🥉`}
                </h3>
                <p className="text-xs text-slate-200/90 mt-0.5">
                  Score: <strong className="text-white">{podiumQuiz.my_score} / {podiumQuiz.my_max_score} pts</strong> ({podiumQuiz.my_percentage}%) • Ranked #{podiumQuiz.my_rank} on the cohort winners podium
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-white/30 shadow-md cursor-pointer transition-all transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2 shrink-0"
                title="Generate Official AGENTIC_AI_A7 Certificate"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Certificate 📜</span>
              </button>

              <button
                onClick={() => setShowGiftBurst(true)}
                className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all inline-flex items-center space-x-2 shrink-0 btn-shimmer ${
                  podiumQuiz.my_rank === 1
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-500 hover:to-yellow-400 text-slate-950 shadow-amber-500/40 shimmer-badge'
                    : podiumQuiz.my_rank === 2
                    ? 'bg-gradient-to-r from-slate-200 via-sky-100 to-slate-200 hover:from-slate-300 hover:to-sky-200 text-slate-950 shadow-sky-400/40 shimmer-silver-badge'
                    : 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-700 hover:to-orange-600 text-white shadow-orange-500/40 shimmer-bronze-badge'
                }`}
              >
                <span className="text-base animate-gift-wobble">🎁</span>
                <span>
                  {podiumQuiz.my_rank === 1 ? 'Open Champion Gift Burst' : podiumQuiz.my_rank === 2 ? 'Open Silver Reward Burst' : 'Open Bronze Reward Burst'}
                </span>
                <Sparkles className={`w-3.5 h-3.5 animate-sparkle-spin ${podiumQuiz.my_rank === 3 ? 'text-white' : 'text-slate-950'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Quiz Callout Banner if an active session exists and student isn't on podium yet */}
      {!podiumQuiz && quizSessions.some(q => q.status === 'ACTIVE') && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-purple-500/15 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse-glow animate-fade-in-up stagger-1 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md animate-bounce">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 beacon-ping" />
                <span>Live Quiz Session Active Now</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Join the live quiz room, answer fast, and conquer 1st Place to unlock your Champion Gift Burst!
              </p>
            </div>
          </div>
          <Link
            to="/quiz-sessions"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md btn-shimmer transition-all shrink-0 inline-flex items-center space-x-1.5 transform hover:scale-105"
          >
            <span>Enter Quiz Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Dashboard Cards with interactive lift, glowing border, and animated progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Assessments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-sky-400 group animate-fade-in-up stagger-1">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Assessments</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{assessments.length}</div>
          <div className="text-xs text-slate-500 mt-1">Assigned for your cohort</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Completed / Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-emerald-400 group animate-fade-in-up stagger-2">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed / Pending</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {completedCount} <span className="text-slate-400 font-medium text-base">/ {pendingCount} pending</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Active evaluation pipeline</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Attendance % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-purple-400 group animate-fade-in-up stagger-3">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance %</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{attendanceStats.percentage || 100}%</div>
          <div className="text-xs text-slate-500 mt-1">{attendanceStats.present || 1} present of {attendanceStats.total || 1} sessions</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full bg-stripes-animated transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, attendanceStats.percentage || 100)}%` }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive hover:border-amber-400 group animate-fade-in-up stagger-4">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{avgScore}%</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Top 15% in Community</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full bg-stripes-animated transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, avgScore)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Grid Content: Upcoming Assessments & Recent Study Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Assessments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-interactive animate-fade-in-up stagger-2">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <span>Upcoming & Active Assessments</span>
            </h3>
            <Link to="/assessments" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 group">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {assessments.slice(0, 3).map((ass) => (
              <div key={ass.id} className="p-4 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 group hover:border-sky-300 hover:shadow-xs">
                <div>
                  <div className="inline-block bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                    {ass.type} • {ass.duration_minutes} Mins
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">{ass.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ass.description}</p>
                </div>
                <Link
                  to={`/assessments`}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all border border-sky-500 btn-shimmer transform hover:scale-105 active:scale-95"
                >
                  Start Assessment
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Study Materials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-interactive animate-fade-in-up stagger-3">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Recent Study Materials</span>
            </h3>
            <Link to="/materials" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1 group">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {materials.slice(0, 3).map((mat) => (
              <div key={mat.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group hover:border-purple-300 hover:shadow-xs transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 shadow-2xs">
                    {mat.material_type}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-purple-700 transition-colors">{mat.title}</h4>
                    <p className="text-xs text-slate-500">{mat.page_count ? `${mat.page_count} pages` : 'External Link'}</p>
                  </div>
                </div>
                <Link
                  to="/ask-doubt"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Ask Doubts
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Podium Celebration Gift Burst Modal */}
      {podiumQuiz && (
        <GiftBurstModal
          isOpen={showGiftBurst}
          onClose={() => setShowGiftBurst(false)}
          quizTitle={podiumQuiz.title}
          rank={podiumQuiz.my_rank}
          score={podiumQuiz.my_score}
          maxScore={podiumQuiz.my_max_score}
          accuracy={podiumQuiz.my_percentage}
          timeTaken={podiumQuiz.my_time_taken_seconds ? `${Math.floor(podiumQuiz.my_time_taken_seconds / 60)}m ${podiumQuiz.my_time_taken_seconds % 60}s` : undefined}
          totalParticipants={podiumQuiz.participant_count || 1}
          onViewCertificate={() => {
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
        />
      )}

      {/* Official AGENTIC_AI_A7 Certificate Modal */}
      {showCertificate && certificateData && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          studentName={certificateData.studentName}
          studentReg={certificateData.studentReg}
          studentDepartment={certificateData.studentDepartment}
          quizTitle={certificateData.quizTitle}
          rank={certificateData.rank}
          totalParticipants={certificateData.totalParticipants}
          score={certificateData.score}
          maxScore={certificateData.maxScore}
          percentage={certificateData.percentage}
          completionDate={certificateData.completionDate}
          timeTaken={certificateData.timeTaken}
        />
      )}

    </div>
  );
};
