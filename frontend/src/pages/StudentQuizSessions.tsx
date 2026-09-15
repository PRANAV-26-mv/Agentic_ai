import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QuizSession } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trophy, 
  Calendar, 
  Award,
  Sparkles
} from 'lucide-react';

export const StudentQuizSessions: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchSessions = () => {
    setLoading(true);
    api.get('/quiz-sessions')
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load quiz sessions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleJoinByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Quiz Session PIN.');
      return;
    }

    setJoining(true);
    try {
      const res = await api.post('/quiz-sessions/join', { pin: cleanPin });
      navigate(`/quiz-sessions/${res.data.session_id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid PIN or you are not eligible for this session.');
    } finally {
      setJoining(false);
    }
  };

  const handleDirectEnter = async (sessionId: string) => {
    try {
      const res = await api.post('/quiz-sessions/join', { session_id: sessionId });
      navigate(`/quiz-sessions/${res.data.session_id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to join session.');
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
  const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const pastSessions = sessions.filter(s => s.status === 'COMPLETED' || s.my_status === 'SUBMITTED');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Hero PIN Join Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-purple-700 text-white rounded-3xl p-8 shadow-xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            <span>Live Interactive Quiz Sessions</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Enter Quiz Session PIN
          </h1>
          <p className="text-amber-100 text-xs leading-relaxed">
            Have a 6-digit Join Code from your instructor or peer cohort? Enter it below to join the live room, compete with classmates, and climb the real-time leaderboard!
          </p>

          <form onSubmit={handleJoinByPin} className="pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 748291"
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                className="w-full sm:w-64 px-4 py-3.5 bg-white text-slate-900 font-mono font-black text-xl tracking-widest text-center rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all placeholder:text-slate-300"
              />

              <button
                type="submit"
                disabled={joining || pin.length !== 6}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entering Lobby...</span>
                  </>
                ) : (
                  <>
                    <span>Join Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 inline-flex items-center space-x-1.5 bg-rose-950/80 border border-rose-400 text-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none">
          <Zap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* ACTIVE LIVE SESSIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Active Sessions ({activeSessions.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Available for your cohort</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse"></div>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No active live sessions at this moment</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter a 6-digit Join PIN above if your instructor launched a private room.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => {
              const isSubmitted = session.my_status === 'SUBMITTED';

              return (
                <div 
                  key={session.id}
                  className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                        <span>LIVE NOW</span>
                      </span>

                      <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        PIN: {session.pin}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base break-words line-clamp-2">{session.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 break-words">
                      {session.description || 'Synchronized timed quiz session.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: <strong>{session.duration_minutes} mins</strong></span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-600 font-bold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{session.participant_count || 0} participants</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDirectEnter(session.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isSubmitted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>View Results & Leaderboard</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Enter Live Session Now</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCHEDULED UPCOMING SESSIONS */}
      {scheduledSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Upcoming Scheduled Sessions ({scheduledSessions.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-sky-100 text-sky-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                      SCHEDULED
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      PIN: {session.pin}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm break-words line-clamp-2">{session.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 break-words">{session.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Duration: {session.duration_minutes}m</span>
                  <button
                    onClick={() => handleDirectEnter(session.id)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View Lobby
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY COMPLETED SESSIONS / RESULTS */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span>My Quiz Session Results</span>
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
            {pastSessions.map((s) => (
              <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target: {s.target_type} • Duration: {s.duration_minutes}m
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  {s.my_score !== null && s.my_score !== undefined && (
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 text-sm">{s.my_score} pts</p>
                      {s.my_rank && (
                        <p className="text-[10px] font-bold text-amber-600">Rank #{s.my_rank}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/quiz-sessions/${s.id}`)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View Leaderboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
