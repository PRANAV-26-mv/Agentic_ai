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
  Sparkles,
  Search,
  Check,
  Copy,
  Flame,
  Medal,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const StudentQuizSessions: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(text);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Grouped sessions
  const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
  const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED' || s.my_status === 'SUBMITTED');

  // Filtered by search & active tab
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pin.includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeTab === 'LIVE') return s.status === 'ACTIVE';
    if (activeTab === 'SCHEDULED') return s.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return s.status === 'COMPLETED' || s.my_status === 'SUBMITTED';
    return true;
  });

  // Calculate highest rank achieved
  const bestRank = completedSessions.reduce<number | null>((min, s) => {
    if (s.my_rank) {
      return min === null ? s.my_rank : Math.min(min, s.my_rank);
    }
    return min;
  }, null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Hero PIN Join Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-500/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-300">
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            <span>Interactive Live Quizzes</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Join Live Quiz Session
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Enter your 6-digit Join Code provided by your instructor to compete in real-time with your classmates, review instant solutions, and climb the cohort leaderboard!
          </p>

          <form onSubmit={handleJoinByPin} className="pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-DIGIT PIN"
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setErrorMsg(null);
                  }}
                  className="w-full px-5 py-4 bg-white/10 backdrop-blur-md text-white font-mono font-black text-2xl tracking-[0.3em] text-center rounded-2xl border border-white/20 shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-500 placeholder:text-sm placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={joining || pin.length !== 6}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Session</span>
                    <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 inline-flex items-center space-x-2 bg-rose-500/20 border border-rose-500/50 text-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Decorative Watermark Graphics */}
        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
          <Zap className="w-72 h-72 text-amber-400" />
        </div>
      </div>

      {/* Quick Performance & Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Live Active</p>
            <p className="text-lg font-black text-slate-900">{activeSessions.length} Rooms</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Upcoming</p>
            <p className="text-lg font-black text-slate-900">{scheduledSessions.length} Rooms</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Completed</p>
            <p className="text-lg font-black text-slate-900">{completedSessions.length} Quizzes</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-600 fill-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Best Rank</p>
            <p className="text-lg font-black text-amber-700">{bestRank ? `#${bestRank}` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Sessions ({sessions.length})
          </button>

          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'LIVE'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Now ({activeSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SCHEDULED'
                ? 'bg-white text-sky-800 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming ({scheduledSessions.length})
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'COMPLETED'
                ? 'bg-white text-purple-800 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            My Results ({completedSessions.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or PIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-xs placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* SESSIONS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">No Quiz Sessions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? `No sessions match "${searchQuery}". Try a different search term or clear the filter.` 
              : activeTab === 'LIVE'
              ? 'There are no active live sessions currently open for your cohort. Enter a PIN above if your host shared a private code.'
              : 'No sessions are available in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const isLive = session.status === 'ACTIVE';
            const isSubmitted = session.my_status === 'SUBMITTED';
            const isScheduled = session.status === 'SCHEDULED';

            return (
              <div 
                key={session.id}
                className={`bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isLive && !isSubmitted
                    ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/10 shadow-emerald-500/5'
                    : isSubmitted
                    ? 'border-2 border-purple-200 hover:border-purple-300'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Status & PIN Badges */}
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      {isSubmitted ? (
                        <span className="bg-purple-100 text-purple-800 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>COMPLETED</span>
                        </span>
                      ) : isLive ? (
                        <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : isScheduled ? (
                        <span className="bg-sky-100 text-sky-800 font-black text-[10px] px-2.5 py-1 rounded-full">
                          UPCOMING
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-full">
                          {session.status}
                        </span>
                      )}
                    </div>

                    {/* Copyable PIN Pill */}
                    <button
                      onClick={() => copyToClipboard(session.pin)}
                      title="Click to copy PIN"
                      className="inline-flex items-center space-x-1 text-xs font-mono font-black text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      <span>PIN: {session.pin}</span>
                      {copiedPin === session.pin ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-amber-700" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 break-words">
                      {session.description || 'Synchronized timed quiz room for cohort evaluation.'}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>{session.duration_minutes}</strong> mins</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-600 font-bold">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.participant_count || 0} participants</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {session.question_ids?.length || 0} questions
                    </span>
                  </div>

                  {/* Submitted Performance Score Strip */}
                  {isSubmitted && session.my_score !== null && session.my_score !== undefined && (
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-purple-700">Your Performance</p>
                        <p className="font-black text-slate-900 text-sm">
                          {session.my_score} pts {session.my_percentage !== null && session.my_percentage !== undefined ? `(${session.my_percentage}%)` : ''}
                        </p>
                      </div>
                      {session.my_rank && (
                        <div className="bg-white px-2.5 py-1 rounded-xl border border-purple-200 font-black text-xs text-amber-700 flex items-center space-x-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Rank #{session.my_rank}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div>
                  {isSubmitted ? (
                    <button
                      onClick={() => navigate(`/quiz-sessions/${session.id}`)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>View Results & Detailed Solutions</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ) : isLive ? (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Enter Live Room Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>View Scheduled Lobby</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
