import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { QuizSession, QuizSessionParticipant, Question, QuizLeaderboardEntry } from '../types';
import { 
  Zap, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  Trophy, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Check, 
  X,
  Loader2, 
  HelpCircle,
  Award,
  Sparkles,
  Send,
  Printer,
  ChevronRight,
  BookOpen,
  Filter,
  Flame,
  Medal,
  Crown
} from 'lucide-react';
import { GiftBurstModal } from '../components/GiftBurstModal';

// Helper to determine if an answer matches the question's correct answer
const checkIsCorrect = (q: Question, userAns?: string): boolean => {
  if (!userAns || !q.correct_answer) return false;
  const sel = userAns.trim().toUpperCase();
  const corr = q.correct_answer.trim().toUpperCase();

  if (sel === corr) return true;

  const letterMap: Record<string, string | undefined> = {
    'A': q.option_a?.trim().toUpperCase(),
    'B': q.option_b?.trim().toUpperCase(),
    'C': q.option_c?.trim().toUpperCase(),
    'D': q.option_d?.trim().toUpperCase(),
  };

  if (corr === 'OPTION_A' && sel === 'A') return true;
  if (corr === 'OPTION_B' && sel === 'B') return true;
  if (corr === 'OPTION_C' && sel === 'C') return true;
  if (corr === 'OPTION_D' && sel === 'D') return true;

  if (sel === 'OPTION_A' && corr === 'A') return true;
  if (sel === 'OPTION_B' && corr === 'B') return true;
  if (sel === 'OPTION_C' && corr === 'C') return true;
  if (sel === 'OPTION_D' && corr === 'D') return true;

  if (letterMap[sel] && letterMap[sel] === corr) return true;

  const corrLetter = ['A', 'B', 'C', 'D'].find(l => letterMap[l] && letterMap[l] === corr);
  if (corrLetter && corrLetter === sel) return true;

  return false;
};

// Helper to get normalized correct letter ('A' | 'B' | 'C' | 'D')
const getCorrectLetter = (q: Question): string => {
  if (!q.correct_answer) return '';
  const corr = q.correct_answer.trim().toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(corr)) return corr;
  if (corr === 'OPTION_A') return 'A';
  if (corr === 'OPTION_B') return 'B';
  if (corr === 'OPTION_C') return 'C';
  if (corr === 'OPTION_D') return 'D';
  if (q.option_a && q.option_a.trim().toUpperCase() === corr) return 'A';
  if (q.option_b && q.option_b.trim().toUpperCase() === corr) return 'B';
  if (q.option_c && q.option_c.trim().toUpperCase() === corr) return 'C';
  if (q.option_d && q.option_d.trim().toUpperCase() === corr) return 'D';
  return corr;
};

export const StudentQuizLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stages: 'LOBBY' | 'QUIZ' | 'RESULTS'
  const [stage, setStage] = useState<'LOBBY' | 'QUIZ' | 'RESULTS'>('LOBBY');

  // Quiz taking state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any | null>(null);

  // Results page state: 'REVIEW' | 'LEADERBOARD'
  const [activeResultTab, setActiveResultTab] = useState<'REVIEW' | 'LEADERBOARD'>('REVIEW');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL');
  const [showGiftBurst, setShowGiftBurst] = useState<boolean>(false);
  const hasBurstTriggeredRef = useRef<boolean>(false);

  // Countdown timer state & refs
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<{ [qId: string]: string }>({});
  const submittingRef = useRef<boolean>(false);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Keep answersRef synced to prevent stale state in timer callbacks
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // Auto-scroll current question pill into view in navigator rail
  useEffect(() => {
    if (navContainerRef.current) {
      const activeBtn = navContainerRef.current.children[currentQIndex] as HTMLElement;
      if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentQIndex]);

  // Keyboard navigation during QUIZ stage
  useEffect(() => {
    if (stage !== 'QUIZ') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      const currentQ = session?.questions?.[currentQIndex];
      if (!currentQ) return;

      if (key === 'A' || key === '1') {
        handleSelectOption(currentQ.id, 'A');
      } else if (key === 'B' || key === '2') {
        handleSelectOption(currentQ.id, 'B');
      } else if (key === 'C' || key === '3') {
        handleSelectOption(currentQ.id, 'C');
      } else if (key === 'D' || key === '4') {
        handleSelectOption(currentQ.id, 'D');
      } else if (key === 'ARROWLEFT' && currentQIndex > 0) {
        setCurrentQIndex(prev => Math.max(0, prev - 1));
      } else if (key === 'ARROWRIGHT' && session?.questions && currentQIndex < session.questions.length - 1) {
        setCurrentQIndex(prev => Math.min(session.questions!.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentQIndex, session]);

  const startTimerWithTarget = (targetMs: number) => {
    targetEndTimeRef.current = targetMs;

    const updateTimer = () => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setTimeLeftSeconds(remaining);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (!hasAutoSubmittedRef.current && !submittingRef.current) {
          hasAutoSubmittedRef.current = true;
          handleAutoSubmit();
        }
      }
    };

    updateTimer();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const fetchSessionDetails = () => {
    if (!id) return;
    api.get(`/quiz-sessions/${id}`)
      .then(res => {
        const data: QuizSession = res.data;
        setSession(data);

        // If user already submitted this quiz, show results and restore choices
        if (data.my_participant?.status === 'SUBMITTED') {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (data.my_participant.answers_json) {
            try {
              const parsed = JSON.parse(data.my_participant.answers_json);
              setAnswers(parsed);
              answersRef.current = parsed;
            } catch (e) {
              console.error('Failed to parse answers_json:', e);
            }
          }

          setStage('RESULTS');
          const myParticipant = data.my_participant;
          const myRank = data.leaderboard?.find(l => l.student_id === myParticipant.student_id)?.rank || myParticipant.rank || 1;
          setResultData({
            participant: myParticipant,
            rank: myRank,
            total_participants: data.leaderboard?.length || 1,
            leaderboard: data.leaderboard || [],
            questions: data.questions || []
          });
        } else if (data.my_participant?.status === 'IN_PROGRESS') {
          // Resume in-progress quiz
          setStage('QUIZ');
          const startedAtMs = data.my_participant.started_at
            ? new Date(data.my_participant.started_at).getTime()
            : Date.now();
          const targetMs = startedAtMs + (data.duration_minutes || 15) * 60 * 1000;

          if (!timerRef.current || !targetEndTimeRef.current) {
            startTimerWithTarget(targetMs);
          } else if (Math.abs(targetEndTimeRef.current - targetMs) > 4000) {
            targetEndTimeRef.current = targetMs;
          }
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to load session details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessionDetails();
    const interval = setInterval(fetchSessionDetails, 8000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartQuiz = async () => {
    if (!session) return;
    try {
      const res = await api.post(`/quiz-sessions/${session.id}/start-quiz`);
      setStage('QUIZ');
      const startIso = res.data.participant?.started_at || new Date().toISOString();
      const targetMs = new Date(startIso).getTime() + (session.duration_minutes || 15) * 60 * 1000;
      startTimerWithTarget(targetMs);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to start quiz.');
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz(true);
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (!session || submittingRef.current) return;

    const currentAnswers = answersRef.current;
    const unansweredCount = (session.questions?.length || 0) - Object.keys(currentAnswers).length;
    if (!isAuto && unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered question(s). Submit quiz now?`)) {
        return;
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSubmitting(true);
    submittingRef.current = true;

    try {
      const res = await api.post(`/quiz-sessions/${session.id}/submit`, { answers: currentAnswers });
      setResultData(res.data);
      if (res.data.questions && res.data.questions.length > 0) {
        setSession(prev => prev ? { ...prev, questions: res.data.questions, my_participant: res.data.participant } : prev);
      }
      setStage('RESULTS');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting quiz.');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center animate-pulse">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin absolute -top-1 -right-1" />
        </div>
        <p className="text-slate-600 font-bold text-xs tracking-wide">Connecting to Live Quiz Room...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Session Unavailable</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Quiz session not found or you may not have permission to join.'}</p>
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Back to Quiz Sessions
        </button>
      </div>
    );
  }

  const questions: Question[] = resultData?.questions || session.questions || [];
  const currentQuestion = questions[currentQIndex];

  // =========================================================================
  // STAGE 1: LIVE LOBBY WAITING ROOM
  // =========================================================================
  if (stage === 'LOBBY') {
    const isLive = session.status === 'ACTIVE';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Back */}
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Lobby</span>
        </button>

        {/* Room Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5 ${
                  isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                  <span>{isLive ? 'LIVE SESSION ACTIVE' : 'SCHEDULED LOBBY'}</span>
                </span>
                
                <span className="bg-amber-100 text-amber-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-amber-200">
                  PIN: {session.pin}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 break-words">{session.title}</h1>
              <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">{session.description || 'Welcome to the synchronized quiz room.'}</p>
            </div>

            <div className="text-left sm:text-right sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
              <p className="text-[11px] font-bold text-slate-400">Duration</p>
              <p className="text-xl font-black text-slate-900">{session.duration_minutes} Mins</p>
              <p className="text-[10px] text-purple-600 font-extrabold mt-0.5">{questions.length} Questions</p>
            </div>
          </div>

          {/* Lobby Status & Action Button */}
          <div className="p-8 bg-gradient-to-br from-amber-50 via-amber-50/70 to-purple-50/50 rounded-2xl border border-amber-200 text-center space-y-4 shadow-xs">
            {isLive ? (
              <>
                <div className="inline-flex p-3.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                  <Zap className="w-7 h-7 fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">The Quiz Room is Live!</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                    Once you click <strong className="text-amber-700">Start Quiz</strong>, your individual {session.duration_minutes}-minute countdown timer begins immediately. Answer all questions and submit when done.
                  </p>
                </div>
                <button
                  onClick={handleStartQuiz}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/30 transition-all inline-flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Quiz Now</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Waiting for Instructor to Open Room...</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    You are securely registered in the lobby. This room updates automatically when your instructor starts the session.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Participants in Lobby */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Classmates in Room ({session.participants?.length || 0})</span>
              </span>
              <span className="text-slate-400 text-[11px] font-semibold">Synchronized cohort</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {session.participants?.map((p: QuizSessionParticipant) => (
                <div 
                  key={p.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2.5 min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {p.student_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-xs truncate">{p.student_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{p.student_reg || p.student_department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // STAGE 2: QUIZ TAKING RUNNER
  // =========================================================================
  if (stage === 'QUIZ') {
    const isLastQ = currentQIndex === questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const isUrgent = timeLeftSeconds < 120; // less than 2 minutes
    const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Top Control Bar with Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Question <strong className="text-slate-900 font-black text-sm">{currentQIndex + 1}</strong> of {questions.length}
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-extrabold">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>

            {/* Synchronized Live Timer */}
            <div className={`px-4 py-2 rounded-xl flex items-center space-x-2 font-mono font-black text-sm shrink-0 transition-all ${
              isUrgent 
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-white' : 'text-amber-700'}`} />
              <span className="tabular-nums tracking-wider">{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => handleSubmitQuiz(false)}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Animated Question Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in max-w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                  Topic: {currentQuestion.topic || 'General Knowledge'}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  currentQuestion.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                  currentQuestion.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentQuestion.difficulty || 'Medium'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 shrink-0">
                Points: <strong className="text-slate-800 font-extrabold">{currentQuestion.marks || 1}</strong>
              </span>
            </div>

            {/* Question Text */}
            <div className="w-full min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed break-words whitespace-pre-wrap">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* MCQ Options with Keyboard Shortcuts */}
            <div className="space-y-3 pt-2 w-full min-w-0">
              {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optKey, idx) => {
                const optText = (currentQuestion as any)[optKey];
                if (!optText) return null;
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isSelected = answers[currentQuestion.id] === letter;

                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, letter)}
                    className={`w-full p-4 rounded-2xl text-left border-2 flex items-start space-x-3.5 transition-all cursor-pointer min-w-0 max-w-full ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 text-slate-900 shadow-sm ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isSelected ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold flex-1 min-w-0 break-words leading-relaxed pt-1">
                      {optText}
                    </span>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-mono uppercase font-bold shrink-0 mt-1">
                        [{idx + 1}]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav: Prev / Question Rail / Next / Finish */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3 w-full min-w-0">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Responsive Question Navigator Rail */}
              <div 
                ref={navContainerRef}
                className="flex items-center space-x-2 overflow-x-auto py-1 px-2 min-w-0 flex-1 max-w-[220px] xs:max-w-[300px] sm:max-w-md md:max-w-xl scrollbar-thin scrollbar-thumb-slate-200"
              >
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAns = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all shrink-0 flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-900 text-white shadow-md ring-2 ring-amber-400'
                          : isAns
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={`Go to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {isLastQ ? (
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                >
                  <span>Finish</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // STAGE 3: RESULTS & DETAILED SOLUTIONS REVIEW
  // =========================================================================
  const pRecord: QuizSessionParticipant = resultData?.participant || session.my_participant;
  const leaderboard: QuizLeaderboardEntry[] = resultData?.leaderboard || session.leaderboard || [];
  const myRank = resultData?.rank || leaderboard.find(l => l.student_id === pRecord?.student_id)?.rank || pRecord?.rank || 1;

  // Automatically trigger celebration burst for 1st rank
  useEffect(() => {
    if (stage === 'RESULTS' && myRank === 1 && !hasBurstTriggeredRef.current) {
      hasBurstTriggeredRef.current = true;
      setShowGiftBurst(true);
    }
  }, [stage, myRank]);

  // Calculate detailed performance breakdown with verified logic
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  questions.forEach(q => {
    const sel = answers[q.id];
    if (!sel) {
      skippedCount++;
    } else if (checkIsCorrect(q, sel)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const totalQuestions = questions.length;
  const maxScore = pRecord?.max_score || totalQuestions;
  const earnedScore = pRecord?.score ?? 0;
  const accuracyPercentage = pRecord?.percentage ?? (totalQuestions > 0 ? Math.round((earnedScore / maxScore) * 100) : 0);

  // Filtered review questions
  const filteredQuestions = questions.filter(q => {
    const sel = answers[q.id];
    if (reviewFilter === 'CORRECT') return Boolean(sel && checkIsCorrect(q, sel));
    if (reviewFilter === 'INCORRECT') return Boolean(sel && !checkIsCorrect(q, sel));
    if (reviewFilter === 'SKIPPED') return !sel;
    return true;
  });

  // Rank badge graphic
  const isPodium = myRank <= 3;
  const rankColor = myRank === 1 
    ? 'from-amber-500 via-amber-600 to-yellow-600' 
    : myRank === 2 
    ? 'from-slate-700 via-slate-800 to-indigo-900' 
    : myRank === 3 
    ? 'from-amber-700 via-orange-800 to-amber-950' 
    : 'from-slate-900 via-purple-950 to-slate-900';

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      
      {/* Celebration Hero Banner */}
      <div className={`bg-gradient-to-br ${rankColor} text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 overflow-hidden relative`}>
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-white/20">
            {myRank === 1 ? (
              <Crown className="w-9 h-9 text-amber-300 fill-amber-300 animate-bounce" />
            ) : myRank === 2 ? (
              <Medal className="w-9 h-9 text-slate-200 fill-slate-200" />
            ) : myRank === 3 ? (
              <Medal className="w-9 h-9 text-amber-400 fill-amber-400" />
            ) : (
              <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Session Result</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Quiz Completed!</h1>
            <p className="text-white/80 text-xs mt-1 break-words max-w-lg mx-auto">{session.title}</p>
            {myRank === 1 && (
              <div className="pt-3">
                <button
                  onClick={() => setShowGiftBurst(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl shadow-xl shadow-amber-500/40 border-2 border-yellow-100 cursor-pointer transform hover:scale-105 active:scale-95 transition-all shimmer-badge animate-float"
                >
                  <span className="text-base">🎁</span>
                  <span>Open 1st Place Gift Burst</span>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            )}
          </div>

          {/* 4 Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-1 text-left sm:text-center">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-amber-200">Your Score</p>
              <p className="text-xl font-black mt-0.5">{earnedScore} / {maxScore}</p>
              <p className="text-[10px] text-white/70">points earned</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-amber-200">Accuracy</p>
              <p className="text-xl font-black mt-0.5">{accuracyPercentage}%</p>
              <p className="text-[10px] text-white/70">overall rate</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-amber-200">Your Rank</p>
              <p className="text-xl font-black mt-0.5">#{myRank}</p>
              <p className="text-[10px] text-white/70">of {leaderboard.length || 1} peers</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-amber-200">Time Taken</p>
              <p className="text-xl font-black mt-0.5">
                {pRecord?.time_taken_seconds 
                  ? `${Math.floor(pRecord.time_taken_seconds / 60)}m ${pRecord.time_taken_seconds % 60}s` 
                  : 'Fast'}
              </p>
              <p className="text-[10px] text-white/70">completion time</p>
            </div>
          </div>

          {/* Performance Pill Indicators */}
          <div className="flex items-center justify-center space-x-3 pt-2 flex-wrap gap-y-2 text-xs font-extrabold">
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{correctCount} Correct</span>
            </span>
            <span className="bg-rose-500/30 text-rose-200 border border-rose-400/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>{incorrectCount} Incorrect</span>
            </span>
            <span className="bg-white/15 text-slate-200 border border-white/20 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>{skippedCount} Skipped</span>
            </span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl" />
      </div>

      {/* Main Tabs: Question Review vs Live Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        {/* Navigation Tab Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveResultTab('REVIEW')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeResultTab === 'REVIEW'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Question Review & Solutions</span>
            </button>

            <button
              onClick={() => setActiveResultTab('LEADERBOARD')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeResultTab === 'LEADERBOARD'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Live Leaderboard ({leaderboard.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print results summary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Result</span>
            </button>
            <button
              onClick={() => navigate('/quiz-sessions')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Quiz Sessions
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: QUESTION REVIEW & SOLUTIONS                   */}
        {/* ---------------------------------------------------- */}
        {activeResultTab === 'REVIEW' && (
          <div className="space-y-6">
            
            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold flex items-center space-x-1 mr-1 text-[11px]">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {(['ALL', 'CORRECT', 'INCORRECT', 'SKIPPED'] as const).map(f => {
                const count = f === 'ALL' ? totalQuestions : f === 'CORRECT' ? correctCount : f === 'INCORRECT' ? incorrectCount : skippedCount;
                const isCurrent = reviewFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f === 'ALL' ? 'All Questions' : f === 'CORRECT' ? 'Correct' : f === 'INCORRECT' ? 'Incorrect' : 'Skipped'} ({count})
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
                No questions found in this category.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredQuestions.map((q, idx) => {
                  const studentAns = answers[q.id];
                  const isCorrect = checkIsCorrect(q, studentAns);
                  const isSkipped = !studentAns;
                  const correctLetter = getCorrectLetter(q);

                  return (
                    <div 
                      key={q.id}
                      className={`rounded-2xl border-2 p-5 sm:p-6 space-y-4 transition-all ${
                        isCorrect 
                          ? 'border-emerald-200 bg-emerald-50/20' 
                          : isSkipped 
                          ? 'border-slate-200 bg-slate-50/50' 
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      {/* Question Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-xs text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            Q{questions.findIndex(item => item.id === q.id) + 1}
                          </span>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                            {q.topic || 'General'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {q.marks || 1} Mark{(q.marks || 1) > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isCorrect ? (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-3 py-1 rounded-full inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Correct (+{q.marks || 1} pts)</span>
                            </span>
                          ) : isSkipped ? (
                            <span className="bg-slate-100 text-slate-600 font-extrabold text-[11px] px-3 py-1 rounded-full inline-flex items-center space-x-1">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Skipped / Unanswered</span>
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-extrabold text-[11px] px-3 py-1 rounded-full inline-flex items-center space-x-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Incorrect (0 pts)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed break-words">
                        {q.question_text}
                      </h3>

                      {/* Options Review Grid */}
                      <div className="space-y-2 pt-1">
                        {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optKey, optIdx) => {
                          const optText = (q as any)[optKey];
                          if (!optText) return null;
                          const letter = ['A', 'B', 'C', 'D'][optIdx];
                          const isUserChoice = studentAns === letter;
                          const isOfficialAnswer = correctLetter === letter;

                          let optionStyle = 'border-slate-200 bg-white text-slate-700';
                          let badgeContent: React.ReactNode = null;

                          if (isOfficialAnswer && isUserChoice) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badgeContent = (
                              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Your Answer (Correct)</span>
                              </span>
                            );
                          } else if (isUserChoice && !isOfficialAnswer) {
                            optionStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold shadow-xs';
                            badgeContent = (
                              <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <X className="w-3 h-3 stroke-[3]" />
                                <span>Your Answer (Incorrect)</span>
                              </span>
                            );
                          } else if (isOfficialAnswer) {
                            optionStyle = 'border-emerald-400 bg-emerald-50/60 text-emerald-900 font-bold';
                            badgeContent = (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Correct Answer</span>
                              </span>
                            );
                          }

                          return (
                            <div 
                              key={optKey}
                              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all ${optionStyle}`}
                            >
                              <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                  isOfficialAnswer
                                    ? 'bg-emerald-600 text-white'
                                    : isUserChoice
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {letter}
                                </span>
                                <span className="leading-relaxed break-words pt-0.5 flex-1">{optText}</span>
                              </div>

                              {badgeContent && (
                                <div className="shrink-0 mt-0.5">{badgeContent}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Callout */}
                      <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Explanation & Key Concepts</span>
                        </div>
                        <p className="text-amber-950/80 leading-relaxed font-medium">
                          {q.explanation || 'This question tests core competencies in the topic area. Remember to review the associated study materials.'}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: REAL-TIME SESSION LEADERBOARD                 */}
        {/* ---------------------------------------------------- */}
        {activeResultTab === 'LEADERBOARD' && (
          <div className="space-y-6">
            
            {/* Top 3 Podium Cards */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 2nd Place */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center order-2 sm:order-1 flex flex-col justify-between">
                  <div>
                    <span className="text-2xl">🥈</span>
                    <p className="text-[11px] uppercase font-black text-slate-400 mt-1">2nd Place</p>
                    <p className="font-extrabold text-slate-900 text-xs mt-1 truncate">{leaderboard[1].student_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{leaderboard[1].student_department}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="font-black text-slate-800 text-sm">{leaderboard[1].score} pts</span>
                    <span className="text-[10px] text-slate-400 ml-1">({leaderboard[1].time_taken_seconds}s)</span>
                  </div>
                </div>

                {/* 1st Place Champion */}
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/20 rounded-2xl border-2 border-amber-400 p-5 text-center order-1 sm:order-2 shadow-sm flex flex-col justify-between transform sm:-translate-y-1">
                  <div>
                    <span className="text-3xl">🥇</span>
                    <p className="text-[11px] uppercase font-black text-amber-700 mt-1 flex items-center justify-center space-x-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>Champion</span>
                    </p>
                    <p className="font-black text-slate-900 text-sm mt-1 truncate">{leaderboard[0].student_name}</p>
                    <p className="text-[10px] text-amber-800 font-mono truncate">{leaderboard[0].student_department}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-200">
                    <span className="font-black text-amber-900 text-base">{leaderboard[0].score} pts</span>
                    <span className="text-[10px] text-amber-700 ml-1">({leaderboard[0].time_taken_seconds}s)</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center order-3 sm:order-3 flex flex-col justify-between">
                  <div>
                    <span className="text-2xl">🥉</span>
                    <p className="text-[11px] uppercase font-black text-slate-400 mt-1">3rd Place</p>
                    <p className="font-extrabold text-slate-900 text-xs mt-1 truncate">{leaderboard[2].student_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{leaderboard[2].student_department}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="font-black text-slate-800 text-sm">{leaderboard[2].score} pts</span>
                    <span className="text-[10px] text-slate-400 ml-1">({leaderboard[2].time_taken_seconds}s)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Ranking Table */}
            <div className="divide-y divide-slate-100 text-xs">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No completed submissions recorded yet.</p>
              ) : (
                leaderboard.map((lb) => {
                  const isMe = lb.student_id === pRecord?.student_id;
                  const badge = lb.rank === 1 ? '🥇' : lb.rank === 2 ? '🥈' : lb.rank === 3 ? '🥉' : `#${lb.rank}`;

                  return (
                    <div 
                      key={lb.student_id}
                      className={`py-3.5 px-3 rounded-xl flex items-center justify-between transition-colors ${
                        isMe ? 'bg-amber-50 font-bold border-2 border-amber-300 shadow-xs' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className="w-8 font-black text-center text-sm shrink-0">{badge}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold truncate ${isMe ? 'text-amber-950' : 'text-slate-800'}`}>
                            {lb.student_name} {isMe && <span className="text-[10px] text-amber-600 font-extrabold ml-1.5">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {lb.student_reg} • {lb.student_department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p className="font-black text-emerald-700 text-sm">{lb.score} / {lb.max_score} pts</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{lb.percentage}% • {lb.time_taken_seconds}s</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Live Quiz Sessions</span>
        </button>
      </div>

      {/* 1st Place Champion Gift Burst Celebration */}
      <GiftBurstModal
        isOpen={showGiftBurst}
        onClose={() => setShowGiftBurst(false)}
        quizTitle={session.title}
        score={earnedScore}
        maxScore={maxScore}
        accuracy={accuracyPercentage}
        timeTaken={pRecord?.time_taken_seconds ? `${Math.floor(pRecord.time_taken_seconds / 60)}m ${pRecord.time_taken_seconds % 60}s` : undefined}
        totalParticipants={leaderboard.length || 1}
      />

    </div>
  );
};
