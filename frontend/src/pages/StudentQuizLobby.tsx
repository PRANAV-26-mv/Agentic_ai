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

  // Countdown timer state (seconds remaining)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  const fetchSessionDetails = () => {
    if (!id) return;
    api.get(`/quiz-sessions/${id}`)
      .then(res => {
        const data: QuizSession = res.data;
        setSession(data);

        // If user already submitted this quiz, show results directly
        if (data.my_participant?.status === 'SUBMITTED') {
          setStage('RESULTS');
          setResultData({
            participant: data.my_participant,
            rank: data.leaderboard?.find(l => l.student_id === data.my_participant?.student_id)?.rank || 1,
            total_participants: data.leaderboard?.length || 1,
            leaderboard: data.leaderboard || []
          });
        } else if (data.my_participant?.status === 'IN_PROGRESS') {
          // If in progress, resume quiz
          setStage('QUIZ');
          initTimer(data.duration_minutes * 60);
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to load session details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessionDetails();
    const interval = setInterval(fetchSessionDetails, 8000); // Polling for lobby updates
    return () => clearInterval(interval);
  }, [id]);

  const initTimer = (seconds: number) => {
    setTimeLeftSeconds(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartQuiz = async () => {
    if (!session) return;
    try {
      await api.post(`/quiz-sessions/${session.id}/start-quiz`);
      setStage('QUIZ');
      initTimer(session.duration_minutes * 60);
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
    if (!session || submitting) return;

    const unansweredCount = (session.questions?.length || 0) - Object.keys(answers).length;
    if (!isAuto && unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Submit quiz now?`)) {
        return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const res = await api.post(`/quiz-sessions/${session.id}/submit`, { answers });
      setResultData(res.data);
      setStage('RESULTS');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting quiz.');
    } finally {
      setSubmitting(false);
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
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-2">
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

              <h1 className="text-2xl font-black text-slate-900">{session.title}</h1>
              <p className="text-xs text-slate-500 mt-1">{session.description || 'Welcome to the live quiz room.'}</p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
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
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2.5"
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
        
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-400">
              Question <strong className="text-slate-900 font-black">{currentQIndex + 1}</strong> of {questions.length}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {answeredCount} Answered
            </span>
          </div>

          {/* Synchronized Live Timer */}
          <div className={`px-4 py-2 rounded-xl flex items-center space-x-2 font-mono font-black text-sm transition-colors ${
            isUrgent ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300' : 'bg-amber-100 text-amber-900'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => handleSubmitQuiz(false)}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
                Topic: {currentQuestion.topic || 'General'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Marks: <strong className="text-slate-700">{currentQuestion.marks || 1}</strong>
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question_text}
            </h2>

            {/* MCQ Options */}
            <div className="space-y-3 pt-2">
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
                    className={`w-full p-4 rounded-2xl text-left border-2 flex items-center space-x-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold flex-1 leading-relaxed">
                      {optText}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav: Prev / Next / Submit */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Question Navigator Pills */}
              <div className="hidden sm:flex items-center space-x-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAns = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-900 text-white shadow-xs'
                          : isAns
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Finish Quiz</span>
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>Next</span>
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
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-purple-800 text-white rounded-3xl p-8 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8 text-amber-200 fill-amber-200" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Quiz Completed!</h1>
          <p className="text-amber-100 text-xs mt-1">{session.title}</p>
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
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Session Leaderboard ({leaderboard.length} submissions)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">Fastest submissions break ties</span>
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
                  <div className="flex items-center space-x-3">
                    <span className="w-8 font-black text-center text-sm">{badge}</span>
                    <div>
                      <p className={`font-bold ${isMe ? 'text-amber-950' : 'text-slate-800'}`}>
                        {lb.student_name} {isMe && <span className="text-[10px] text-amber-600 font-extrabold ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{lb.student_reg} • {lb.student_department}</p>
                    </div>
                  </div>

                  <div className="text-right">
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
