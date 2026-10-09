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
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Apple Product Storytelling Hero Card with Quick PIN Access */}
      <div className="bg-gradient-to-b from-[#1d1d1f] to-[#121214] text-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.14)] relative overflow-hidden border border-white/10 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-white/90 text-xs font-medium px-3.5 py-1 rounded-full border border-white/15 backdrop-blur-md">
              <MessagesSquare className="w-3.5 h-3.5 text-white" />
              <span>Campus Group Discussion & Peer Ranking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Live GD Evaluation Rooms
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Participate in assigned cohort batches. Engage in structured debate across discussion questions, evaluate peers, and discover official standings once published by the instructor.
            </p>
          </div>

          {/* Quick PIN Join Frosted Glass Card */}
          <form 
            onSubmit={handleJoinByPin}
            className="w-full lg:w-auto bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/15 shadow-lg space-y-3 shrink-0"
          >
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Join GD Room with PIN</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full sm:w-40 px-3.5 py-2.5 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm font-mono tracking-widest font-bold focus:outline-hidden focus:ring-2 focus:ring-white/40 text-center"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={joining || pin.length < 4}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#1d1d1f] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Enter</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-300 font-medium flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 4 Apple Glass Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-black/[0.05] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Live GD Rooms</p>
            <p className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{activeSessions.length} Active</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-black/[0.05] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Scheduled</p>
            <p className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{scheduledSessions.length} Upcoming</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-black/[0.05] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Concluded</p>
            <p className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{completedSessions.length} Revealed</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-black/[0.05] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Best GD Rank</p>
            <p className="text-xl font-extrabold text-amber-700 tracking-tight">{bestRank ? `#${bestRank}` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center space-x-1 bg-black/[0.04] p-1 rounded-full overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Sessions ({sessions.length})
          </button>

          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'LIVE'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Now ({activeSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SCHEDULED'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming ({scheduledSessions.length})
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'COMPLETED'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Revealed ({completedSessions.length})
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-9 pr-4 py-2 bg-white/90 border border-black/[0.08] rounded-full text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-black/10 shadow-2xs"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-semibold text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
          <p>Loading Group Discussion rooms...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-black/[0.05] text-center space-y-3 shadow-xs">
          <MessagesSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">No GD Sessions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'No GD session matched your search filter.'
              : 'There are currently no GD sessions active for your cohort.'}
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
                className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5 border border-black/[0.05] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status Badges & PIN Pill */}
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      {isCompleted ? (
                        <span className="bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Results Revealed</span>
                        </span>
                      ) : isLive ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Live Active</span>
                        </span>
                      ) : isScheduled ? (
                        <span className="bg-sky-50 text-sky-800 border border-sky-200/60 font-semibold text-[10px] px-2.5 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-full">
                          {session.status}
                        </span>
                      )}
                    </div>

                    {/* Copyable PIN Pill */}
                    <button
                      onClick={() => copyToClipboard(session.pin)}
                      title="Click to copy PIN"
                      className="inline-flex items-center space-x-1 text-xs font-mono font-semibold text-slate-700 bg-black/[0.03] hover:bg-black/[0.06] px-2.5 py-0.5 rounded-full border border-black/[0.05] transition-colors cursor-pointer"
                    >
                      <span>PIN: {session.pin}</span>
                      {copiedPin === session.pin ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words line-clamp-1 tracking-tight">
                      {session.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-2 break-words bg-black/[0.02] p-2.5 rounded-2xl border border-black/[0.04]">
                      <strong>Topic:</strong> {session.topic}
                    </p>
                    {session.description && (
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 break-words">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.duration_minutes} mins</span>
                    </span>

                    <span className="flex items-center space-x-1 font-semibold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.participant_count || 0} / {session.max_participants || 6} Seats</span>
                    </span>

                    <span className="text-[10px] font-semibold text-slate-600 bg-black/[0.03] px-2.5 py-0.5 rounded-full border border-black/[0.05]">
                      {session.questions?.length || 4} Questions
                    </span>
                  </div>

                  {/* Standing / Submitted Status */}
                  {isCompleted && session.my_rank ? (
                    <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-purple-700">Official Standing</p>
                        <p className="font-extrabold text-slate-900 text-sm">
                          Rank #{session.my_rank}
                        </p>
                      </div>
                      <div className="bg-white px-2.5 py-1 rounded-full border border-purple-200 font-bold text-xs text-amber-700 flex items-center space-x-1 shadow-2xs">
                        <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>#{session.my_rank}</span>
                      </div>
                    </div>
                  ) : isJoined ? (
                    <div className="p-2.5 bg-black/[0.02] rounded-2xl border border-black/[0.04] flex items-center space-x-2 text-xs">
                      {session.my_status === 'EVALUATION_SUBMITTED' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <p className="text-[11px] font-medium text-slate-700">
                            Rankings Locked • Waiting for reveal
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <p className="text-[11px] font-medium text-slate-700">
                            Joined • Ready for peer ranking
                          </p>
                        </>
                      )}
                    </div>
                  ) : isFull && !isJoined ? (
                    <div className="p-2 bg-black/[0.02] rounded-xl text-center text-[11px] text-slate-400 font-medium">
                      Cohort Full ({session.max_participants} limit reached)
                    </div>
                  ) : null}
                </div>

                {/* Primary Action Button */}
                <div>
                  {isCompleted ? (
                    <button
                      onClick={() => navigate(`/gd-sessions/${session.id}`)}
                      className="w-full py-2.5 bg-[#1d1d1f] hover:bg-black text-white font-semibold text-xs rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>View Revealed Leaderboard</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ) : isJoined ? (
                    <button
                      onClick={() => navigate(`/gd-sessions/${session.id}`)}
                      className="w-full py-2.5 bg-[#1d1d1f] hover:bg-black text-white font-semibold text-xs rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Enter GD Room</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isLive ? (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      disabled={isFull}
                      className={`w-full py-2.5 rounded-full font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                        isFull 
                          ? 'bg-black/[0.04] text-slate-400 cursor-not-allowed'
                          : 'bg-[#1d1d1f] hover:bg-black text-white shadow-xs cursor-pointer'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isFull ? 'Session Full' : 'Join GD Room'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDirectEnter(session.id)}
                      disabled={isFull}
                      className={`w-full py-2.5 rounded-full font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                        isFull
                          ? 'bg-black/[0.04] text-slate-400 cursor-not-allowed'
                          : 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 border border-black/[0.05] cursor-pointer'
                      }`}
                    >
                      <span>{isFull ? 'Cohort Full' : 'Register / View Room'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
