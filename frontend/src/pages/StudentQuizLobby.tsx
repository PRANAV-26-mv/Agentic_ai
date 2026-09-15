import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { QuizSession, QuizSessionParticipant, Question, QuizLeaderboardEntry } from '../types';
import { 
  Zap, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Check, 
  Loader2, 
  HelpCircle,
  Award,
  Sparkles,
  Send
} from 'lucide-react';

export const StudentQuizLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States: 'LOBBY' | 'QUIZ' | 'RESULTS'
  const [stage, setStage] = useState<'LOBBY' | 'QUIZ' | 'RESULTS'>('LOBBY');

  // Quiz running state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any | null>(null);

  // Countdown timer state & refs
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<{ [qId: string]: string }>({});
  const submittingRef = useRef<boolean>(false);
  const stageRef = useRef<'LOBBY' | 'QUIZ' | 'RESULTS'>('LOBBY');
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync refs to prevent stale closures in async intervals & callbacks
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Auto-scroll current question pill into view in navigator rail
  useEffect(() => {
    if (navContainerRef.current) {
      const activeBtn = navContainerRef.current.children[currentQIndex] as HTMLElement;
      if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentQIndex]);

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

    // Immediate calculation to avoid 1-second visual latency
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

        // If user already submitted this quiz, show results directly
        if (data.my_participant?.status === 'SUBMITTED') {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setStage('RESULTS');
          setResultData({
            participant: data.my_participant,
            rank: data.leaderboard?.find(l => l.student_id === data.my_participant?.student_id)?.rank || 1,
            total_participants: data.leaderboard?.length || 1,
            leaderboard: data.leaderboard || []
          });
        } else if (data.my_participant?.status === 'IN_PROGRESS') {
          // Resume quiz
          setStage('QUIZ');

          // Compute target end time from server timestamp
          const startedAtMs = data.my_participant.started_at
            ? new Date(data.my_participant.started_at).getTime()
            : Date.now();
          const targetMs = startedAtMs + (data.duration_minutes || 15) * 60 * 1000;

          // CRITICAL: Do NOT reset the timer if it's already actively ticking!
          if (!timerRef.current || !targetEndTimeRef.current) {
            startTimerWithTarget(targetMs);
          } else if (Math.abs(targetEndTimeRef.current - targetMs) > 4000) {
            // Re-sync only if significant drift detected (> 4s)
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
    const interval = setInterval(fetchSessionDetails, 8000); // Polling for lobby & participant updates
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
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Submit quiz now?`)) {
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
      <div className="flex items-center justify-center p-16 text-slate-400 font-bold text-xs space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        <span>Connecting to Quiz Room...</span>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">Session Unavailable</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Quiz session not found.'}</p>
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Back to Quiz Sessions
        </button>
      </div>
    );
  }

  const questions: Question[] = session.questions || [];
  const currentQuestion = questions[currentQIndex];

  // ----------------------------------------------------
  // STAGE 1: LIVE LOBBY
  // ----------------------------------------------------
  if (stage === 'LOBBY') {
    const isLive = session.status === 'ACTIVE';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Back */}
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Lobby</span>
        </button>

        {/* Room Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1 ${
                  isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />}
                  <span>{isLive ? 'LIVE SESSION' : 'SCHEDULED LOBBY'}</span>
                </span>
                
                <span className="bg-amber-100 text-amber-900 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                  PIN: {session.pin}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 break-words">{session.title}</h1>
              <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">{session.description || 'Welcome to the live quiz room.'}</p>
            </div>

            <div className="text-left sm:text-right sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
              <p className="text-[11px] font-bold text-slate-400">Duration</p>
              <p className="text-xl font-black text-slate-900">{session.duration_minutes} Mins</p>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">{questions.length} Questions</p>
            </div>
          </div>

          {/* Lobby Status & Action Button */}
          <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-4">
            {isLive ? (
              <>
                <div className="inline-flex p-3 bg-amber-500 text-white rounded-2xl shadow-md">
                  <Zap className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">The Quiz Room is Open!</h3>
                  <p className="text-xs text-amber-800/80 mt-1 max-w-md mx-auto">
                    Once you click Start, your {session.duration_minutes}-minute timer will begin immediately. Good luck!
                  </p>
                </div>
                <button
                  onClick={handleStartQuiz}
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Quiz Now</span>
                </button>
              </>
            ) : (
              <>
                <Clock className="w-8 h-8 text-sky-500 mx-auto" />
                <div>
                  <h3 className="text-sm font-black text-slate-800">Waiting for the Host to Open Session...</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You are securely registered in the lobby. Keep this page open; it will update automatically.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Participants in Lobby */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Classmates in Room ({session.participants?.length || 0})</span>
              </span>
              <span className="text-slate-400 text-[11px]">Real-time participant list</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                    <p className="text-[10px] text-slate-400 font-mono truncate">{p.student_reg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // ----------------------------------------------------
  // STAGE 2: QUIZ RUNNER
  // ----------------------------------------------------
  if (stage === 'QUIZ') {
    const isLastQ = currentQIndex === questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const isUrgent = timeLeftSeconds < 120; // less than 2 minutes

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Control Bar - Responsive & Wrapping Protection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full min-w-0">
          <div className="flex items-center space-x-2.5 shrink-0 min-w-0">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Question <strong className="text-slate-900 font-black">{currentQIndex + 1}</strong> of {questions.length}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
              {answeredCount} Answered
            </span>
          </div>

          {/* Synchronized Live Timer */}
          <div className={`px-4 py-2 rounded-xl flex items-center space-x-2 font-mono font-black text-sm shrink-0 transition-colors ${
            isUrgent ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300' : 'bg-amber-100 text-amber-900'
          }`}>
            <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`} />
            <span className="tabular-nums">{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => handleSubmitQuiz(false)}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
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

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-6 animate-in fade-in max-w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg truncate max-w-xs">
                Topic: {currentQuestion.topic || 'General'}
              </span>
              <span className="text-xs font-bold text-slate-400 shrink-0">
                Marks: <strong className="text-slate-700">{currentQuestion.marks || 1}</strong>
              </span>
            </div>

            {/* Question Text with robust overflow protection */}
            <div className="w-full min-w-0 overflow-hidden">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed break-words whitespace-pre-wrap">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* MCQ Options with overflow wrap & aligned layout */}
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
                    className={`w-full p-4 rounded-2xl text-left border-2 flex items-start space-x-3 transition-all cursor-pointer min-w-0 max-w-full overflow-hidden ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold flex-1 min-w-0 break-words leading-relaxed">
                      {optText}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav: Prev / Question Rail / Next / Submit */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Previous</span>
              </button>

              {/* Responsive Question Navigator Rail (smooth horizontal scroll for 50+ questions on all screens) */}
              <div 
                ref={navContainerRef}
                className="flex items-center space-x-1.5 overflow-x-auto py-1 px-2 min-w-0 flex-1 max-w-[220px] xs:max-w-[300px] sm:max-w-md md:max-w-xl scrollbar-thin scrollbar-thumb-slate-200"
              >
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAns = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer ${
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
                  className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>Finish</span>
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span className="hidden xs:inline sm:inline">Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ----------------------------------------------------
  // STAGE 3: RESULTS & LIVE LEADERBOARD
  // ----------------------------------------------------
  const pRecord: QuizSessionParticipant = resultData?.participant || session.my_participant;
  const leaderboard: QuizLeaderboardEntry[] = resultData?.leaderboard || session.leaderboard || [];
  const myRank = resultData?.rank || leaderboard.find(l => l.student_id === pRecord?.student_id)?.rank || 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Celebration Score Hero Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-purple-800 text-white rounded-3xl p-8 shadow-xl text-center space-y-4 max-w-full overflow-hidden">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8 text-amber-200 fill-amber-200" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Quiz Completed!</h1>
          <p className="text-amber-100 text-xs mt-1 break-words">{session.title}</p>
        </div>

        {/* Score Metrics */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-amber-200">Score</p>
            <p className="text-xl font-black">{pRecord?.score ?? 0} / {pRecord?.max_score ?? questions.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-amber-200">Accuracy</p>
            <p className="text-xl font-black">{pRecord?.percentage ?? 0}%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <p className="text-[10px] uppercase font-bold text-amber-200">Your Rank</p>
            <p className="text-xl font-black">#{myRank}</p>
          </div>
        </div>

        {pRecord?.time_taken_seconds && (
          <p className="text-xs text-amber-200/90 font-medium">
            Completed in <strong className="text-white">{pRecord.time_taken_seconds} seconds</strong>
          </p>
        )}
      </div>

      {/* Live Session Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap sm:flex-nowrap">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Session Leaderboard ({leaderboard.length} submissions)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">Fastest submissions break ties</span>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No submitted ranks yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {leaderboard.map((lb) => {
              const isMe = lb.student_id === pRecord?.student_id;
              const badge = lb.rank === 1 ? '🥇' : lb.rank === 2 ? '🥈' : lb.rank === 3 ? '🥉' : `#${lb.rank}`;

              return (
                <div 
                  key={lb.student_id}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between transition-colors ${
                    isMe ? 'bg-amber-50/80 font-bold border border-amber-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="w-8 font-black text-center text-sm shrink-0">{badge}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold truncate ${isMe ? 'text-amber-950' : 'text-slate-800'}`}>
                        {lb.student_name} {isMe && <span className="text-[10px] text-amber-600 font-extrabold ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{lb.student_reg} • {lb.student_department}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className="font-black text-emerald-700">{lb.score} / {lb.max_score} pts</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{lb.time_taken_seconds}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/quiz-sessions')}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Return to Live Quiz Sessions
        </button>
      </div>

    </div>
  );
};
