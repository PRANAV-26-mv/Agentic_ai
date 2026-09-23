import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Play, 
  Calendar, 
  Clock, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  Users,
  Search,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types';

export const StudentMeetings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetings();
      setMeetings(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch available meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeInputValue.trim().toLowerCase();
    if (!clean) return;
    navigate(`/meetings/room/${clean}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const liveMeetings = meetings.filter(m => m.status === 'ACTIVE');
  const scheduledMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status === 'ENDED');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Join with Code Hero */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 rounded-3xl border border-sky-500/20 shadow-2xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-900/50 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-300">
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Virtual Classroom & Video Meetings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Live Video & Voice Sessions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Connect with faculty, instructors, and peers in real-time. Join ongoing lectures, doubt-clearing sessions, and department workshops.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Meeting creation is authorized and managed by college faculty & administration.</span>
            </div>
          </div>

          {/* Quick Join With Code Form */}
          <div className="lg:col-span-5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Join with Meeting Code</span>
            </h2>
            <form onSubmit={handleJoinByCode} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. abc-defg-hij"
                value={codeInputValue}
                onChange={e => setCodeInputValue(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!codeInputValue.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-sky-950/50 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[10px] text-slate-500">
              Paste a meeting code or link shared by your instructor to join directly.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE MEETINGS (HAPPENING NOW) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-base font-bold text-white">Live Meetings Happening Now</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              {liveMeetings.length}
            </span>
          </div>
          <button
            onClick={fetchMeetings}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            Refresh
          </button>
        </div>

        {liveMeetings.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
            <Video className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No live sessions in progress right now</p>
            <p className="text-xs text-slate-500">
              When an instructor or admin starts a meeting for your department or year, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMeetings.map(meeting => (
              <div
                key={meeting.id}
                className="p-5 bg-slate-900/90 border border-sky-500/40 rounded-3xl space-y-4 shadow-xl hover:border-sky-500/70 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>IN PROGRESS</span>
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                      {meeting.audience_type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{meeting.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>Host:</span>
                      <span className="font-semibold text-slate-200">{meeting.host_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Code:</span>
                      <button
                        onClick={() => handleCopyCode(meeting.code)}
                        className="font-mono text-xs font-bold text-sky-300 hover:text-white flex items-center space-x-1"
                      >
                        <span>{meeting.code}</span>
                        {copiedId === meeting.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => navigate(`/meetings/room/${meeting.id}`)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-sky-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Join Meeting</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SCHEDULED MEETINGS */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-bold text-white">Upcoming Scheduled Meetings</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {scheduledMeetings.length}
          </span>
        </div>

        {scheduledMeetings.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl text-xs text-slate-500">
            No upcoming meetings scheduled at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledMeetings.map(meeting => (
              <div
                key={meeting.id}
                className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    SCHEDULED
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {meeting.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{meeting.title}</h3>
                {meeting.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{meeting.description}</p>
                )}

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Scheduled for:</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(meeting.scheduled_start_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="text-slate-300">{meeting.host_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMeetings;
