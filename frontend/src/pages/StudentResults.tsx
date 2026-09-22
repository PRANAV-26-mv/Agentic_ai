import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Zap, 
  Trophy, 
  Award, 
  BookOpen, 
  ChevronRight, 
  Calendar,
  Sparkles,
  Medal,
  Crown
} from 'lucide-react';

interface QuizResultItem {
  id: string;
  session_id: string;
  session_title: string;
  pin: string;
  target_type: string;
  duration_minutes: number;
  total_questions: number;
  score: number;
  max_score: number;
  percentage: number;
  rank: number;
  total_participants: number;
  time_taken_seconds: number;
  submitted_at: string;
  status: string;
}

export const StudentResults: React.FC = () => {
  const [assessmentResults, setAssessmentResults] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'QUIZZES' | 'ASSESSMENTS'>('QUIZZES');

  const navigate = useNavigate();

  const fetchAllResults = async () => {
    setLoading(true);
    try {
      // 1. Fetch formal assessment results
      const resAssessments = await api.get('/results');
      const serverResults: any[] = resAssessments.data;

      // Auto-heal logic from local storage if any
      try {
        const localSubmitted = JSON.parse(localStorage.getItem('portal_submitted_attempts') || '[]');
        const missing = localSubmitted.filter((sub: any) => 
          !serverResults.some((sr: any) => sr.attempt_id === sub.attempt_id || sr.id === sub.attempt_id)
        );

        if (missing.length > 0) {
          for (const item of missing) {
            try {
              if (item.answers) {
                for (const [qid, ans] of Object.entries(item.answers as Record<string, any>)) {
                  await api.post(`/assessments/${item.assessment_id}/answer`, {
                    attempt_id: item.attempt_id,
                    question_id: qid,
                    ...ans
                  });
                }
              }
              await api.post(`/assessments/${item.assessment_id}/submit`, { attempt_id: item.attempt_id });
            } catch (e) {
              console.error('Failed to auto-heal student submission:', item.attempt_id, e);
            }
          }
          const refreshed = await api.get('/results');
          setAssessmentResults(refreshed.data);
        } else {
          setAssessmentResults(serverResults);
        }
      } catch (e) {
        setAssessmentResults(serverResults);
      }

      // 2. Fetch live quiz session results
      try {
        const resQuizzes = await api.get('/results/quiz-sessions');
        setQuizResults(resQuizzes.data || []);
      } catch (e) {
        console.error('Failed to load quiz session results:', e);
      }
    } catch (err) {
      console.error('Error fetching student results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllResults();
  }, []);

  // Compute performance metrics
  const totalCompleted = assessmentResults.length + quizResults.length;
  const allPercentages = [
    ...assessmentResults.map(r => r.percentage || 0),
    ...quizResults.map(q => q.percentage || 0)
  ];
  const averagePercentage = allPercentages.length > 0 
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length) 
    : 0;

  const bestQuizRank = quizResults.reduce<number | null>((min, q) => {
    return min === null ? q.rank : Math.min(min, q.rank);
  }, null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Performance Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <BarChart2 className="w-7 h-7 text-purple-600" />
            <span>My Results & Performance</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review your live quiz session rankings, question breakdowns, and formal assessment evaluation feedback.
          </p>
        </div>

        <button
          onClick={() => navigate('/quiz-sessions')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Go to Live Quizzes</span>
        </button>
      </div>

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Completed</p>
            <p className="text-lg font-black text-slate-900">{totalCompleted} Tests</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Avg Accuracy</p>
            <p className="text-lg font-black text-emerald-600">{averagePercentage}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Best Quiz Rank</p>
            <p className="text-lg font-black text-amber-700">{bestQuizRank ? `#${bestQuizRank}` : '—'}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Live Quizzes</p>
            <p className="text-lg font-black text-sky-700">{quizResults.length} Submissions</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Responsive Grid on Mobile */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('QUIZZES')}
          className={`w-full sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-center ${
            activeTab === 'QUIZZES'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <span className="truncate">Live Quizzes ({quizResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ASSESSMENTS')}
          className={`w-full sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-center ${
            activeTab === 'ASSESSMENTS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="truncate">Assessments ({assessmentResults.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      ) : activeTab === 'QUIZZES' ? (
        /* ---------------------------------------------------- */
        /* TAB 1: LIVE QUIZ SESSION RESULTS                     */
        /* ---------------------------------------------------- */
        quizResults.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
            <Zap className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-sm">No Live Quiz Results Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have not participated in any live quiz sessions yet. Join an active room using a 6-digit PIN!
            </p>
            <button
              onClick={() => navigate('/quiz-sessions')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Browse Quiz Rooms
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizResults.map((q) => {
              const isChampion = q.rank === 1;
              const isSilver = q.rank === 2;
              const isBronze = q.rank === 3;
              const isPodium = q.rank <= 3;
              return (
                <div 
                  key={q.id}
                  className={`rounded-2xl p-4 sm:p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-interactive animate-fade-in-up ${
                    isChampion
                      ? 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/50 border-2 border-amber-400/90 shadow-md animate-champion-glow'
                      : isSilver
                      ? 'bg-gradient-to-r from-slate-100/80 via-white to-sky-50/40 border-2 border-slate-300 shadow-sm animate-silver-glow'
                      : isBronze
                      ? 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/40 border-2 border-amber-400/70 shadow-sm animate-bronze-glow'
                      : isPodium
                      ? 'bg-white border border-amber-200/80 shadow-xs hover:border-amber-300'
                      : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {isChampion ? (
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs shimmer-badge">
                          <Crown className="w-3 h-3 text-slate-950 fill-slate-950 animate-bounce" />
                          <span>CHAMPION #1 🥇</span>
                        </span>
                      ) : isSilver ? (
                        <span className="bg-gradient-to-r from-slate-200 to-sky-200 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs shimmer-silver-badge">
                          <Medal className="w-3 h-3 text-slate-800 fill-slate-300 animate-silver-float" />
                          <span>SILVER RUNNER-UP #2 🥈</span>
                        </span>
                      ) : isBronze ? (
                        <span className="bg-gradient-to-r from-amber-600/20 to-orange-500/20 text-amber-950 border border-amber-400/60 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs shimmer-bronze-badge">
                          <Award className="w-3 h-3 text-amber-700 fill-amber-500 animate-bronze-float" />
                          <span>BRONZE PODIUM #3 🥉</span>
                        </span>
                      ) : (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>COMPLETED</span>
                        </span>
                      )}
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                        PIN: {q.pin}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(q.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words">
                      {q.session_title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                      <span>
                        Duration: <strong>{q.duration_minutes} mins</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Completed in: <strong>{q.time_taken_seconds}s</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Questions: <strong>{q.total_questions}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Score & Rank Badges - Full Width & Aligned on Mobile */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-l sm:border-slate-100 sm:pl-6 w-full sm:w-auto">
                    <div className="text-left sm:text-right space-y-0.5">
                      <p className="font-black text-slate-900 text-base">
                        {q.score} / {q.max_score} <span className="text-xs text-slate-400 font-normal">pts</span>
                      </p>
                      <p className="text-xs font-bold text-emerald-600">{q.percentage}% Accuracy</p>
                      <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                        isChampion
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : isSilver
                          ? 'bg-gradient-to-r from-slate-200 to-sky-100 text-slate-900 border border-slate-300 shadow-xs'
                          : isBronze
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 border border-amber-300 shadow-xs'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {isChampion ? (
                          <Crown className="w-3 h-3 text-slate-950 fill-slate-950 animate-bounce" />
                        ) : isSilver ? (
                          <Medal className="w-3 h-3 text-slate-700 fill-slate-300 shrink-0" />
                        ) : isBronze ? (
                          <Award className="w-3 h-3 text-amber-700 fill-amber-500 shrink-0" />
                        ) : (
                          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                        <span>Rank #{q.rank} of {q.total_participants}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/quiz-sessions/${q.session_id}`)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs btn-shimmer transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ---------------------------------------------------- */
        /* TAB 2: FORMAL ASSESSMENT RESULTS                     */
        /* ---------------------------------------------------- */
        assessmentResults.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-sm">No Formal Assessment Results</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't completed any formal exams or assessments yet.
            </p>
            <button
              onClick={() => navigate('/assessments')}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Browse Assessments
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* MOBILE VIEW (Card Layout - Visible on Mobile Only) */}
            <div className="block sm:hidden space-y-3.5">
              {assessmentResults.map((r) => (
                <div 
                  key={r.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        {r.status}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1.5 leading-snug break-words">
                        {r.assessment_title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Submitted on {new Date(r.submitted_at || r.started_at).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-emerald-600">{r.percentage}%</p>
                      <p className="text-[10px] text-slate-400 font-semibold">score rate</p>
                    </div>
                  </div>

                  {/* 2x2 Score Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">MCQ</p>
                      <p className="text-xs font-black text-brand-600 mt-0.5">{r.mcq_score} pts</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Writing</p>
                      <p className="text-xs font-black text-purple-600 mt-0.5">{r.writing_score} pts</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Total</p>
                      <p className="text-xs font-black text-slate-900 mt-0.5">{r.total_score} pts</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${r.percentage >= (r.passing_percentage || 60) ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, r.percentage || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW (Table Layout with horizontal overflow protection) */}
            <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">Assessment</th>
                      <th className="p-4">MCQ Score</th>
                      <th className="p-4">Writing Score</th>
                      <th className="p-4">Total Score</th>
                      <th className="p-4">Percentage</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {assessmentResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{r.assessment_title}</td>
                        <td className="p-4 font-semibold text-brand-600">{r.mcq_score} pts</td>
                        <td className="p-4 font-semibold text-purple-600">{r.writing_score} pts</td>
                        <td className="p-4 font-extrabold text-slate-900">{r.total_score} pts</td>
                        <td className="p-4 font-bold text-emerald-600">{r.percentage}%</td>
                        <td className="p-4">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(r.submitted_at || r.started_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
};
