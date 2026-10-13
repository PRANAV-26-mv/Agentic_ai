import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Copy, 
  Check, 
  Award, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Layers, 
  Cpu, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Lock,
  ArrowLeft,
  Edit3,
  Trophy,
  Crown,
  Medal,
  Users,
  TrendingUp,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import { api, API_BASE_URL } from '../services/api';
import confetti from 'canvas-confetti';

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  score: number;
  grade: string;
  mistakes_count: number;
  submitted_at: string;
}

export interface LeaderboardData {
  isPublished: boolean;
  totalParticipants: number;
  firstPlace: LeaderboardEntry | null;
  podium: LeaderboardEntry[];
  remaining: LeaderboardEntry[];
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  myScore: number | null;
  myGrade: string | null;
  message?: string;
}

interface PromptMistake {
  id: string;
  category: 'CLARITY' | 'CONSTRAINTS' | 'PERSONA' | 'FORMAT' | 'SECURITY';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  penaltyMarks: number;
  howToFix: string;
}

interface EvaluationResult {
  score: number | null;
  grade: 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'PENDING';
  metrics?: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  } | null;
  mistakes: PromptMistake[];
  strengths: string[];
  suggestions: string[];
  improvedPrompt: string | null;
  summaryFeedback: string;
  engineUsed: 'GEMINI_AI' | 'HEURISTIC_RULE_ENGINE';
  isResultsPublished?: boolean;
  statusMessage?: string;
}

interface PromptSession {
  id: string;
  title: string;
  description: string;
  task_objective?: string;
  target_community?: string;
  target_department?: string;
  target_year?: number;
  status: string;
  results_published: boolean;
  created_at: string;
}

interface PastSubmission {
  id: string;
  session_id: string;
  session_title?: string;
  session_published?: boolean;
  score: number | null;
  grade: string;
  submitted_prompt: string;
  metrics?: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  } | null;
  mistakes: PromptMistake[];
  strengths?: string[];
  suggestions?: string[];
  improved_prompt?: string | null;
  summary_feedback?: string;
  created_at: string;
}

export const StudentPromptEvaluator: React.FC = () => {
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'CHALLENGES' | 'HISTORY'>('CHALLENGES');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [resultsJustReleased, setResultsJustReleased] = useState<boolean>(false);
  const wasReleasedRef = useRef<boolean>(false);
  const selectedSessionIdRef = useRef<string | null>(selectedSessionId);

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId;
  }, [selectedSessionId]);

  useEffect(() => {
    fetchSessions();
    fetchPastSubmissions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchLeaderboard(selectedSessionId, true);
    } else {
      setLeaderboardData(null);
    }
  }, [selectedSessionId]);

  const fetchSessions = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingSessions(true);
      const res = await api.get('/prompt-evaluator/sessions', {
        params: { _t: Date.now() }
      });
      setSessions(res.data);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
    } finally {
      if (showLoading) setLoadingSessions(false);
    }
  };

  const fetchPastSubmissions = async (activeSessionId?: string) => {
    try {
      const res = await api.get('/prompt-evaluator/my-submissions', {
        params: { _t: Date.now() }
      });
      setPastSubmissions(res.data);

      // Automatically sync unlocked evaluation details if student is viewing current session
      const targetId = activeSessionId ?? selectedSessionIdRef.current;
      if (targetId) {
        const sub = res.data.find((s: PastSubmission) => s.session_id === targetId);
        if (sub && (sub.session_published || sub.score !== null)) {
          setEvaluation({
            score: sub.score,
            grade: sub.grade as any,
            metrics: sub.metrics,
            mistakes: sub.mistakes || [],
            strengths: sub.strengths || [],
            suggestions: sub.suggestions || [],
            improvedPrompt: sub.improved_prompt || null,
            summaryFeedback: sub.summary_feedback || '',
            engineUsed: 'GEMINI_AI',
            isResultsPublished: Boolean(sub.session_published)
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load past submissions:', err);
    }
  };

  const fetchLeaderboard = async (sessionId: string, showLoading = false) => {
    try {
      if (showLoading) setLoadingLeaderboard(true);
      const res = await api.get(`/prompt-evaluator/sessions/${sessionId}/leaderboard`, {
        params: { _t: Date.now() }
      });
      setLeaderboardData(res.data);
    } catch (err: any) {
      console.error('Failed to load session leaderboard:', err);
    } finally {
      if (showLoading) setLoadingLeaderboard(false);
    }
  };

  // 1. Instant Socket.IO listener: catches release the exact millisecond admin clicks release
  useEffect(() => {
    const socketUrl = API_BASE_URL.startsWith('http')
      ? API_BASE_URL.replace(/\/api\/?$/, '')
      : window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[StudentPromptEvaluator] Connected to real-time socket:', socket.id);
      try {
        const storedUser = localStorage.getItem('portal_auth_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          socket.emit('register-user', {
            id: u.student?.id || u.id,
            name: u.student?.name || u.name,
            email: u.email,
            role: u.role || 'STUDENT',
            department: u.student?.department || u.department
          });
        }
      } catch (_) {}
    });

    const handleRealtimeRelease = (payload: any) => {
      console.log('[StudentPromptEvaluator] Real-time results release detected via socket:', payload);
      const currentSid = selectedSessionIdRef.current;
      // Immediately refresh all data without student having to manually refresh page!
      fetchSessions(false);
      fetchPastSubmissions(currentSid || undefined);
      if (currentSid) {
        fetchLeaderboard(currentSid, false);
      }
    };

    socket.on('prompt-results-released', handleRealtimeRelease);
    socket.on('notification-received', (notif: any) => {
      if (notif.title?.includes('Prompt') || notif.action_url?.includes('prompt-evaluator')) {
        handleRealtimeRelease(notif);
      }
    });

    return () => {
      socket.off('prompt-results-released', handleRealtimeRelease);
      socket.disconnect();
    };
  }, []);

  // 2. Continuous 3-second auto-poll fallback so results arrive automatically even if socket is disconnected
  useEffect(() => {
    const pollTimer = setInterval(() => {
      const currentSid = selectedSessionIdRef.current;
      fetchSessions(false);
      fetchPastSubmissions(currentSid || undefined);
      if (currentSid) {
        fetchLeaderboard(currentSid, false);
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, []);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setErrorMsg('');
    setIsResubmitting(false);
    setResultsJustReleased(false);

    const s = sessions.find(sess => sess.id === sessionId);
    const existing = pastSubmissions.find(subm => subm.session_id === sessionId);
    wasReleasedRef.current = Boolean(s?.results_published || existing?.session_published);

    // If student already has a submission for this session, load its prompt and unlocked evaluation
    if (existing) {
      setPromptText(existing.submitted_prompt);
      if (existing.session_published || existing.score !== null) {
        setEvaluation({
          score: existing.score,
          grade: existing.grade as any,
          metrics: existing.metrics,
          mistakes: existing.mistakes || [],
          strengths: existing.strengths || [],
          suggestions: existing.suggestions || [],
          improvedPrompt: existing.improved_prompt || null,
          summaryFeedback: existing.summary_feedback || '',
          engineUsed: 'GEMINI_AI',
          isResultsPublished: Boolean(existing.session_published)
        });
      }
    } else {
      setPromptText('');
      setEvaluation(null);
    }
  };

  const handleEvaluate = async () => {
    if (!promptText.trim()) {
      setErrorMsg('Please enter or paste your engineered prompt before submitting.');
      return;
    }
    if (!selectedSessionId) {
      setErrorMsg('Please select a session to evaluate.');
      return;
    }
    setErrorMsg('');
    setEvaluating(true);

    try {
      const res = await api.post('/prompt-evaluator/evaluate', {
        sessionId: selectedSessionId,
        prompt: promptText
      });

      setEvaluation(res.data.evaluation);
      setIsResubmitting(false);

      // Trigger celebratory confetti if results are published and score is 80+
      if (res.data.isResultsPublished && res.data.evaluation?.score && res.data.evaluation.score >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Refresh submissions list and leaderboard
      await fetchPastSubmissions();
      if (selectedSessionId) {
        await fetchLeaderboard(selectedSessionId);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Prompt evaluation failed. Please check your connection.');
    } finally {
      setEvaluating(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);
  const currentSubmission = pastSubmissions.find(s => s.session_id === selectedSessionId);

  // Determine if results are released for current session
  const isReleased = Boolean(currentSession?.results_published || currentSubmission?.session_published || evaluation?.isResultsPublished);

  // Trigger celebration banner & confetti the instant admin releases results live
  useEffect(() => {
    if (isReleased && !wasReleasedRef.current && currentSubmission) {
      setResultsJustReleased(true);
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
    wasReleasedRef.current = isReleased;
  }, [isReleased, currentSubmission]);

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-yellow-500/30';
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  const getMetricColor = (val: number) => {
    if (val >= 16) return 'bg-emerald-500';
    if (val >= 12) return 'bg-blue-500';
    if (val >= 8) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const renderLeaderboard = () => {
    if (!leaderboardData || !leaderboardData.isPublished) return null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Official Challenge Leaderboard & Hall of Fame
            </h3>
            <p className="text-xs text-slate-400">
              Performance rankings released by the Super Administrator ({leaderboardData.totalParticipants} participants ranked)
            </p>
          </div>

          {leaderboardData.myRank && (
            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Your Rank: #{leaderboardData.myRank} of {leaderboardData.totalParticipants}</span>
            </div>
          )}
        </div>

        {/* 1ST PLACE CHAMPION STANDOUT CARD */}
        {leaderboardData.firstPlace ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border-2 border-amber-400/80 dark:border-amber-400/50 p-6 shadow-lg">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
              <Crown className="w-44 h-44 text-amber-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                  <Crown className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-sm">
                    🥇 1st Place Champion
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {leaderboardData.firstPlace.student_name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{leaderboardData.firstPlace.student_reg}</span>
                    <span>•</span>
                    <span>{leaderboardData.firstPlace.student_department}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-amber-300/40 dark:border-amber-700/40 pt-4 sm:pt-0 sm:pl-6">
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Top Score</span>
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {leaderboardData.firstPlace.score}
                  </span>
                  <span className="text-xs text-slate-400 font-bold block">/ 100</span>
                </div>

                <div className="space-y-1">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase tracking-wider block text-center ${getGradeBadge(leaderboardData.firstPlace.grade)}`}>
                    Grade {leaderboardData.firstPlace.grade}
                  </span>
                  <span className="text-[10px] text-slate-500 block text-center">
                    {leaderboardData.firstPlace.mistakes_count === 0 ? '0 flaws - Flawless' : `${leaderboardData.firstPlace.mistakes_count} issues`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* PODIUM RUNNER-UPS (2ND AND 3RD PLACE) */}
        {leaderboardData.podium.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leaderboardData.podium.slice(1).map((runnerUp, idx) => {
              const isSecond = idx === 0;
              return (
                <div
                  key={runnerUp.student_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSecond
                      ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                      : 'bg-amber-900/5 dark:bg-amber-950/20 border-amber-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                      isSecond
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        : 'bg-amber-700/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      <Medal className="w-3 h-3" />
                      {isSecond ? '🥈 2nd Place' : '🥉 3rd Place'}
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                      {runnerUp.score}/100
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {runnerUp.student_name}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {runnerUp.student_reg} • {runnerUp.student_department}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      Grade {runnerUp.grade}
                    </span>
                    <span className="text-slate-400">
                      {runnerUp.mistakes_count === 0 ? 'Flawless' : `${runnerUp.mistakes_count} issues`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REMAINING PLACES TABLE (RANK #4 ONWARDS) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Remaining Places ({leaderboardData.remaining.length > 0 ? `#4 to #${leaderboardData.totalParticipants}` : 'Full Standing'})</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {leaderboardData.remaining.length} students
            </span>
          </h4>

          {leaderboardData.remaining.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              All participating students are featured on the podium above!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Reg No & Department</th>
                    <th className="py-2.5 px-3">Score & Grade</th>
                    <th className="py-2.5 px-3">Mistakes</th>
                    <th className="py-2.5 px-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboardData.remaining.map((entry) => {
                    const isCurrentUser = entry.rank === leaderboardData.myRank && entry.score === leaderboardData.myScore;
                    return (
                      <tr 
                        key={entry.student_id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                            isCurrentUser
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.student_name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500 text-white">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                          {entry.student_reg} • {entry.student_department}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {entry.score}/100
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {entry.grade}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                          {entry.mistakes_count === 0 ? 'Flawless' : `${entry.mistakes_count} flaws`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(entry.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white border border-indigo-800/50 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Automated Prompt Engineering Evaluator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Prompt Challenges & Evaluator
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select an official session created by the administrator to open your workspace, craft your prompt, and submit for automated evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 backdrop-blur-sm self-start md:self-auto">
            <button
              onClick={() => {
                setActiveTab('CHALLENGES');
                setSelectedSessionId(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'CHALLENGES'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              My Submissions ({pastSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'CHALLENGES' ? (
        <>
          {/* STEP 1: SESSIONS LIST (Shown when no session is clicked) */}
          {!selectedSessionId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Available Challenge Sessions Created by Admin
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click on a session below to open the prompt submission area.
                  </p>
                </div>
                <button
                  onClick={() => fetchSessions()}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* LIVE RELEASE ALERT BANNER ON SESSIONS LIST */}
              {resultsJustReleased && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border-2 border-emerald-500/50 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-4 shadow-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        🎉 Challenge Results Released Live by Administrator!
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">
                        Official scores and mistake reviews have just been published. Select your session below to view your results.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setResultsJustReleased(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {loadingSessions ? (
                <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
                  Loading active challenge sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No Active Sessions Available
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The administrator has not created any prompt challenges yet. Please check back when a challenge is scheduled.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sessions.map((s) => {
                    const sub = pastSubmissions.find(p => p.session_id === s.id);
                    const hasSubmitted = Boolean(sub);
                    const released = Boolean(s.results_published || sub?.session_published);

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/80 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              Dept: {s.target_department || 'ALL'}
                            </span>

                            {released ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Award className="w-3 h-3" />
                                Results Released
                              </span>
                            ) : hasSubmitted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Lock className="w-3 h-3" />
                                Results Locked
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Active Challenge
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {s.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                              {s.task_objective || s.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {hasSubmitted ? 'Already attempted' : 'Ready to attempt'}
                          </span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            {hasSubmitted ? (released ? 'View Results' : 'View Submission') : 'Open & Paste Prompt'}
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PARTICULAR SESSION VIEW (Only shown when student clicked a session!) */
            currentSession && (
              <div className="space-y-6">
                {/* Back Button & Session Title Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to All Sessions
                    </button>

                    <div className="flex items-center gap-2">
                      {isReleased ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Award className="w-3.5 h-3.5" />
                          Official Final Results Released by Admin
                        </span>
                      ) : currentSubmission ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Lock className="w-3.5 h-3.5" />
                          Evaluation Locked (Awaiting Admin Release)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                          Ready for Submission
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentSession.title}
                    </h2>
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-indigo-950 dark:text-indigo-200 block mb-1">Challenge Objective & Rubric:</strong>
                      {currentSession.task_objective || currentSession.description}
                    </div>
                  </div>
                </div>

                {/* LIVE CELEBRATION & RELEASE ALERT BANNER */}
                {resultsJustReleased && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border-2 border-emerald-500/50 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-4 shadow-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black flex items-center gap-2">
                          🎉 Official Final Results Released by Administrator!
                        </div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-300">
                          Your score, grade, mistakes breakdown, and leaderboard rankings have just been unlocked live without needing to refresh.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setResultsJustReleased(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* WORKSPACE AREA: Either Paste Area OR Results Area */}
                {(!currentSubmission || isResubmitting) ? (
                  /* PASTE AREA - ONLY DISPLAYED FOR THIS SELECTED SESSION */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Paste Your Prompt for: "{currentSession.title}"
                          </label>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {promptText.length} chars • ~{Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 1.3)} tokens
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            rows={12}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Paste your engineered prompt here... E.g.
'You are an expert AI software engineer. Analyze the code provided strictly within triple backticks (```input```). Identify bugs, security flaws, and performance bottlenecks.
Constraints:
- Do not make speculative assumptions.
- Format response strictly as JSON with fields: status, vulnerabilities, and fixed_code...'"
                            className="w-full text-xs md:text-sm font-mono bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                          />
                        </div>

                        {errorMsg && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setPromptText('')}
                              disabled={!promptText || evaluating}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              Clear
                            </button>
                            {isResubmitting && (
                              <button
                                type="button"
                                onClick={() => setIsResubmitting(false)}
                                className="text-xs text-slate-500 hover:underline"
                              >
                                Cancel Edit
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleEvaluate}
                            disabled={evaluating || !promptText.trim()}
                            className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {evaluating ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Submitting & Evaluating...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                {isResubmitting ? 'Update Submission' : 'Submit Prompt for Evaluation'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Best Practices Side Guide */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-3">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Key Evaluation Criteria:
                        </p>
                        <ul className="space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                          <li><strong className="text-indigo-600 dark:text-indigo-400">1. Persona Framing:</strong> Start by giving the model a precise role (e.g. "You are a Senior SecOps Analyst").</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">2. Negative Constraints:</strong> Explicitly state what the model must NEVER do (e.g., "Never fabricate data").</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">3. Format Specification:</strong> Require structured schemas (JSON, tables, or numbered lists).</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">4. Input Isolation:</strong> Enclose user queries in delimiters (` ``` `) to prevent prompt injection.</li>
                        </ul>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                          Note: Once submitted, evaluation results will be locked until released by the administrator.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* If Results Are Released, Also Display Official Leaderboard Below */}
                  {isReleased && renderLeaderboard()}
                </div>
              ) : (
                  /* POST-SUBMISSION VIEW: LOCKED OR RELEASED */
                  <div className="space-y-6">
                    {/* IF NOT RELEASED YET: ALL RESULTS (SCORE, GRADE, MISTAKES, CORRECTED PROMPT) ARE LOCKED */}
                    {!isReleased ? (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                              <Lock className="w-8 h-8 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  All Results Locked 🔒
                                </span>
                                <span className="text-xs font-semibold text-slate-400">
                                  Under Administrator Review
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Prompt Evaluated & Safely Registered
                              </h3>
                              <p className="text-xs text-slate-500">
                                Submitted on: {new Date(currentSubmission.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsResubmitting(true)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Resubmit Prompt
                          </button>
                        </div>

                        {/* Locked Explanation Notice */}
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-amber-500" />
                            What is currently locked?
                          </div>
                          <p className="leading-relaxed">
                            Your <strong>numerical score</strong>, <strong>letter grade</strong>, <strong>identified mistakes/penalties</strong>, and the <strong>AI-corrected prompt revision</strong> are temporarily locked. When the Administrator presses the <strong>"Launch & Release Final Results"</strong> button, all of these will be unlocked here simultaneously and sent to your email!
                          </p>
                        </div>

                        {/* Submitted Prompt Preview (Read Only) */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Your Submitted Prompt:
                          </label>
                          <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                            {currentSubmission.submitted_prompt}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* IF RELEASED: ALL THE THINGS SHOW (SCORE, GRADE, MISTAKES, AND CORRECTED PROMPT) */
                      <div className="space-y-6">
                        {/* Score & Grade Released Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                                <div className="text-center">
                                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                    {currentSubmission.score ?? evaluation?.score}
                                  </span>
                                  <span className="block text-[10px] font-bold text-slate-400">/ 100</span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase tracking-wider ${getGradeBadge(currentSubmission.grade || evaluation?.grade || 'C')}`}>
                                    Grade {currentSubmission.grade || evaluation?.grade}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-400">
                                    Official Final Result
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Released by Super Administrator
                                </p>
                              </div>
                            </div>

                            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                              <Award className="w-4 h-4 text-emerald-500" />
                              <div>
                                <div>Final Results Released</div>
                                <div className="text-[10px] font-normal opacity-80">Official score and mistake analysis unlocked</div>
                              </div>
                            </div>
                          </div>

                          {/* 5-Dimensional Metrics Breakdown */}
                          {(currentSubmission.metrics || evaluation?.metrics) && (
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Dimension Breakdown (Out of 20 each)
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { label: 'Clarity & Specificity', val: (currentSubmission.metrics || evaluation?.metrics)!.clarityAndSpecificity },
                                  { label: 'Persona & Role', val: (currentSubmission.metrics || evaluation?.metrics)!.personaAndRole },
                                  { label: 'Constraints & Rules', val: (currentSubmission.metrics || evaluation?.metrics)!.constraintsAndGuardrails },
                                  { label: 'Output Formatting', val: (currentSubmission.metrics || evaluation?.metrics)!.outputFormatting },
                                  { label: 'Security & Injection Guard', val: (currentSubmission.metrics || evaluation?.metrics)!.securityAndRobustness, fullSpan: true },
                                ].map((m, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 ${m.fullSpan ? 'sm:col-span-2' : ''}`}
                                  >
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="text-slate-700 dark:text-slate-300">{m.label}</span>
                                      <span className="font-mono text-slate-900 dark:text-white">{m.val}/20</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-700 ${getMetricColor(m.val)}`}
                                        style={{ width: `${(m.val / 20) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* DETECTED MISTAKES CARD (SHOWN WHEN RELEASED) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              Detected Mistakes & Flaws ({((currentSubmission.mistakes || evaluation?.mistakes) || []).length})
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              Total penalties: -{((currentSubmission.mistakes || evaluation?.mistakes) || []).reduce((acc, m) => acc + m.penaltyMarks, 0)} pts
                            </span>
                          </div>

                          {((currentSubmission.mistakes || evaluation?.mistakes) || []).length === 0 ? (
                            <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                Flawless Prompt Execution!
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                No critical omissions, missing constraints, or injection vulnerabilities were detected.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {((currentSubmission.mistakes || evaluation?.mistakes) || []).map((mistake, idx) => (
                                <div 
                                  key={mistake.id || idx}
                                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-2.5"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                        mistake.severity === 'CRITICAL'
                                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                          : mistake.severity === 'WARNING'
                                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                      }`}>
                                        {mistake.severity}
                                      </span>
                                      <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                                        {mistake.category}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                        {mistake.title}
                                      </h4>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-rose-500 shrink-0">
                                      -{mistake.penaltyMarks} pts
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {mistake.description}
                                  </p>

                                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-semibold">How to Fix: </strong>
                                      {mistake.howToFix}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CORRECTED / IMPROVED PROMPT REVISION (SHOWN WHEN RELEASED) */}
                        {(currentSubmission.improved_prompt || evaluation?.improvedPrompt) && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                Corrected & Enhanced AI Prompt Revision
                              </h3>
                              <button
                                type="button"
                                onClick={() => copyText(currentSubmission.improved_prompt || evaluation?.improvedPrompt || '')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-1.5"
                              >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Copy Corrected Prompt'}
                              </button>
                            </div>

                            <p className="text-xs text-slate-500">
                              Here is the corrected prompt revision incorporating all required constraints, role framing, and input delimiters:
                            </p>

                            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                              {currentSubmission.improved_prompt || evaluation?.improvedPrompt}
                            </div>
                          </div>
                        )}

                        {/* OFFICIAL CHALLENGE LEADERBOARD (1ST PLACE & REMAINING PLACES) */}
                        {renderLeaderboard()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Prompt Submissions & Evaluated Challenges
              </h2>
              <p className="text-xs text-slate-500">
                View your historical submissions and official release statuses.
              </p>
            </div>
            <button
              onClick={() => fetchPastSubmissions()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {pastSubmissions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No prompt submissions recorded yet. Click on any challenge session to paste and submit your prompt!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pastSubmissions.map((sub) => (
                <div key={sub.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {sub.session_title || 'Prompt Session'}
                        </span>
                        {sub.session_published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Award className="w-3 h-3" />
                            Results Released
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Lock className="w-3 h-3" />
                            Results Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>

                    {sub.session_published && sub.score !== null ? (
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-wider ${getGradeBadge(sub.grade)}`}>
                          Grade {sub.grade}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {sub.score}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Results Locked
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Awaiting Admin Release
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {sub.submitted_prompt}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {sub.session_published ? `${sub.mistakes?.length || 0} mistakes identified.` : 'All evaluation details locked.'}
                    </span>
                    <button
                      onClick={() => {
                        handleSelectSession(sub.session_id);
                        setActiveTab('CHALLENGES');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Open Session Workspace
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPromptEvaluator;
