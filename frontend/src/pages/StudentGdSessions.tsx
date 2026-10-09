import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { GdSession } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowRight, 
  Clock, 
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
  ChevronRight, 
  Lock, 
  HelpCircle,
  Eye,
  MessagesSquare
} from 'lucide-react';

export const StudentGdSessions: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [sessions, setSessions] = useState<GdSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchSessions = () => {
    api.get('/gd-sessions')
      .then(res => setSessions(res.data))
      .catch(err => console.error('Error fetching GD sessions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter a valid 6-digit Join PIN.');
      return;
    }

    setJoining(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/gd-sessions/join', { pin: pin.trim() });
      navigate(`/gd-sessions/${res.data.session_id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to join GD session. Please check your PIN.');
    } finally {
      setJoining(false);
    }
  };

  const handleDirectEnter = async (sessionId: string) => {
    try {
      const res = await api.post('/gd-sessions/join', { session_id: sessionId });
      navigate(`/gd-sessions/${sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to join this GD session.');
    }
  };

  const copyToClipboard = (pinStr: string) => {
    navigator.clipboard.writeText(pinStr);
    setCopiedPin(pinStr);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.pin.includes(searchQuery);
    if (!matchesSearch) return false;

    if (activeTab === 'LIVE') return s.status === 'ACTIVE';
    if (activeTab === 'SCHEDULED') return s.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return s.status === 'COMPLETED';
    return true;
  });

  const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
  const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  const myCompletedSessions = sessions.filter(s => s.status === 'COMPLETED' && s.my_rank);
  const bestRank = myCompletedSessions.length > 0 
    ? Math.min(...myCompletedSessions.map(s => s.my_rank || 999)) 
    : null;

  return (
    <div className="space-y-6">
      
      {/* Hero Banner with Quick PIN Entry */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-900/40 animate-fade-in-up">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 transform translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 text-xs font-black uppercase px-3 py-1 rounded-full border border-indigo-400/40">
              <MessagesSquare className="w-3.5 h-3.5 text-indigo-300" />
              <span>Campus Group Discussion & Peer Ranking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Live GD Evaluation Rooms
            </h1>
            <p className="text-xs text-indigo-200/90 leading-relaxed">
              Participate in group discussions with assigned cohort batches. Discuss key questions, rank your peers across evaluation dimensions, and view official rankings once revealed by your instructor.
            </p>
          </div>

          {/* Quick PIN Join Card */}
          <form 
            onSubmit={handleJoinByPin}
            className="w-full lg:w-auto bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shadow-xl space-y-3 shrink-0"
          >
            <div className="flex items-center space-x-2 text-xs font-extrabold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Join GD Session via PIN</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full sm:w-44 px-3.5 py-2.5 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 text-sm font-mono tracking-widest font-black focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-center"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={joining || pin.length < 4}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Enter Room</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-300 font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Live GD Rooms</p>
            <p className="text-lg font-black text-slate-900">{activeSessions.length} Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Scheduled</p>
            <p className="text-lg font-black text-slate-900">{scheduledSessions.length} Upcoming</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Completed</p>
            <p className="text-lg font-black text-slate-900">{completedSessions.length} Concluded</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-600 fill-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Best GD Rank</p>
            <p className="text-lg font-black text-amber-700">{bestRank ? `#${bestRank}` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
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
            Results Released ({completedSessions.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-bold text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
          <p>Loading Group Discussion rooms...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <MessagesSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">No GD Sessions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? 'No GD session matched your search filter.'
              : 'There are currently no GD sessions active for your department or community.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map(session => {
            const isLive = session.status === 'ACTIVE';
            const isScheduled = session.status === 'SCHEDULED';
            const isCompleted = session.status === 'COMPLETED' || Boolean(session.is_results_published);
            const isJoined = session.my_status === 'JOINED' || session.my_status === 'EVALUATION_SUBMITTED';
            const isFull = (session.participant_count || 0) >= (session.max_participants || 6);

            return (
              <div 
                key={session.id}
                className={`bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isLive
                    ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/10 shadow-emerald-500/5'
                    : isCompleted
                    ? 'border-2 border-purple-200 hover:border-purple-300'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Status Badges & PIN Pill */}
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      {isCompleted ? (
                        <span className="bg-purple-100 text-purple-800 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>RESULTS REVEALED</span>
                        </span>
                      ) : isLive ? (
                        <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>LIVE GD ACTIVE</span>
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

                  {/* Title & Topic */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words line-clamp-1">
                      {session.title}
                    </h3>
                    <p className="text-xs font-bold text-indigo-900 mt-1 line-clamp-2 break-words bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                      <strong>Topic:</strong> {session.topic}
                    </p>
                    {session.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 break-words">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.duration_minutes} mins</span>
                    </span>

                    <span className="flex items-center space-x-1 font-bold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.participant_count || 0} / {session.max_participants || 6} Seats</span>
                    </span>

                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {session.questions?.length || 4} Questions
                    </span>
                  </div>

                  {/* Joined Status or Official Rank */}
                  {isCompleted && session.my_rank ? (
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-purple-700">Your Official Standing</p>
                        <p className="font-black text-slate-900 text-sm">
                          Cohort Rank #{session.my_rank}
                        </p>
                      </div>
                      <div className="bg-white px-2.5 py-1 rounded-xl border border-purple-200 font-black text-xs text-amber-700 flex items-center space-x-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Rank #{session.my_rank}</span>
                      </div>
                    </div>
                  ) : isJoined ? (
                    <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center space-x-2 text-xs">
                      {session.my_status === 'EVALUATION_SUBMITTED' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <p className="text-[11px] font-bold text-amber-900">
                            Rankings Submitted • Waiting for admin to reveal results
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <p className="text-[11px] font-bold text-emerald-900">
                            Registered in GD Room • Ready for peer ranking
                          </p>
                        </>
                      )}
                    </div>
                  ) : isFull && !isJoined ? (
                    <div className="p-2 bg-slate-100 rounded-xl text-center text-[11px] text-slate-500 font-bold">
                      Cohort Full ({session.max_participants} student capacity reached)
                    </div>
                  ) : null}
                </div>

                {/* Action Buttons */}
                <div>
                  {isCompleted ? (
                    <button
                      onClick={() => navigate(`/gd-sessions/${session.id}`)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>View Revealed GD Leaderboard</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ) : isJoined ? (
                    <button
                      onClick={() => navigate(`/gd-sessions/${session.id}`)}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Enter GD Room</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : isLive ? (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      disabled={isFull}
                      className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        isFull 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{isFull ? 'Session Full' : 'Join GD Room Now'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      disabled={isFull}
                      className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer'
                      }`}
                    >
                      <span>{isFull ? 'Cohort Full' : 'Register / View Room'}</span>
                      <ChevronRight className="w-4 h-4" />
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
