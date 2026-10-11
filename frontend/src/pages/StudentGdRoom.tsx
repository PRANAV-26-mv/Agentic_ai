import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GdSession, GdParticipant, GdLeaderboardEntry } from '../types';
import { GiftBurstModal } from '../components/GiftBurstModal';
import {
  Users,
  Trophy,
  Award,
  Medal,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Lock,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  RefreshCw,
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Volume2,
  Star,
  Flame,
  ThumbsUp,
  BarChart3,
  Sliders,
  Plus,
  Minus,
  X
} from 'lucide-react';

const getSocketUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    try {
      const u = new URL(import.meta.env.VITE_API_URL);
      return `${u.protocol}//${u.host}`;
    } catch (_) {}
  }
  return window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
};

const formatSeconds = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const FEEDBACK_TAGS = [
  'Clear & Articulate',
  'Strong Data & Facts',
  'Logical Rebuttals',
  'Active Listening',
  'Persuasive Delivery',
  'Collaborative Demeanor'
];

const CAPACITY_PRESETS = [5, 8, 10, 12, 15, 20, 25, 30, 50, 100];
const DURATION_PRESETS = [60, 90, 120, 180, 300];

export const StudentGdRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [session, setSession] = useState<GdSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [advancing, setAdvancing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'OVERALL' | string>('OVERALL');

  // Capacity Cart Live Control State
  const [showCapacityModal, setShowCapacityModal] = useState<boolean>(false);
  const [liveCapacityInput, setLiveCapacityInput] = useState<number>(10);
  const [liveDurationLimitInput, setLiveDurationLimitInput] = useState<number>(120);
  const [updatingCapacity, setUpdatingCapacity] = useState<boolean>(false);

  // Live Speaking Stopwatch State
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // 10-Point Rating State: { [targetStudentId]: { [questionId]: mark (1..10) } }
  const [speakerMarksState, setSpeakerMarksState] = useState<{ [targetStdId: string]: { [qId: string]: number } }>({});
  const [speakerFeedbackState, setSpeakerFeedbackState] = useState<{ [targetStdId: string]: string }>({});
  const [activeRatingQuestionIndex, setActiveRatingQuestionIndex] = useState<number>(0);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  const fetchSession = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/gd-sessions/${id}`);
      const data: GdSession = res.data;
      setSession(data);

      // Pre-fill previously submitted 10-point ratings if any
      if (data.my_speaker_ratings && Object.keys(data.my_speaker_ratings).length > 0) {
        setSpeakerMarksState(prev => ({
          ...data.my_speaker_ratings,
          ...prev
        }));
      }

      if (data.max_participants) {
        setLiveCapacityInput(data.max_participants);
      }
      if (data.speaker_duration_limit_seconds) {
        setLiveDurationLimitInput(data.speaker_duration_limit_seconds);
      }
    } catch (err: any) {
      console.error('Error fetching GD session:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load GD session room.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and fallback polling
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Real-time Socket.io lifecycle
  useEffect(() => {
    if (!id) return;
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.emit('gd-join-room', { sessionId: id, user });

    socket.on('gd-speaker-started', () => {
      fetchSession();
    });

    socket.on('gd-speaker-stopped', () => {
      fetchSession();
    });

    socket.on('gd-rating-submitted', () => {
      fetchSession();
    });

    socket.on('gd-speaker-advanced', () => {
      fetchSession();
    });

    socket.on('gd-session-reset', () => {
      fetchSession();
    });

    socket.on('gd-session-updated', () => {
      fetchSession();
    });

    return () => {
      socket.emit('gd-leave-room', { sessionId: id });
      socket.disconnect();
    };
  }, [id, user?.id]);

  // Live Timer Synchronizer
  useEffect(() => {
    if (!session?.active_speaker_id || !session?.speaker_started_at || session.session_stage !== 'SPEAKING') {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(session.speaker_started_at).getTime();
    const updateTime = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [session?.active_speaker_id, session?.speaker_started_at, session?.session_stage]);

  const currentStudentId = user?.id;
  const participants = session?.participants || [];
  const questions = session?.questions || [];

  // Determine Active Speaker
  const activeSpeaker = useMemo(() => {
    if (!session?.active_speaker_id) return null;
    return participants.find(p => p.student_id === session.active_speaker_id) || null;
  }, [session?.active_speaker_id, participants]);

  // Determine candidate who just spoke or is being evaluated
  const candidateUnderEvaluation = useMemo(() => {
    if (session?.session_stage === 'RATING' && activeSpeaker) {
      return activeSpeaker;
    }
    if (session?.session_stage === 'RATING' && session.speaker_order && session.current_speaker_index !== undefined) {
      const currentSpeakerId = session.speaker_order[session.current_speaker_index];
      return participants.find(p => p.student_id === currentSpeakerId) || activeSpeaker;
    }
    return activeSpeaker;
  }, [session?.session_stage, session?.speaker_order, session?.current_speaker_index, activeSpeaker, participants]);

  // Am I the speaker right now?
  const isMeSpeaking = Boolean(activeSpeaker && activeSpeaker.student_id === currentStudentId);
  const isMeUnderEvaluation = Boolean(candidateUnderEvaluation && candidateUnderEvaluation.student_id === currentStudentId);

  // Queued order of participants
  const orderedParticipants = useMemo(() => {
    if (!session?.speaker_order || session.speaker_order.length === 0) {
      return participants;
    }
    const orderMap = new Map<string, number>();
    session.speaker_order.forEach((id, idx) => orderMap.set(id, idx));

    return [...participants].sort((a, b) => {
      const posA = orderMap.has(a.student_id) ? orderMap.get(a.student_id)! : 999;
      const posB = orderMap.has(b.student_id) ? orderMap.get(b.student_id)! : 999;
      return posA - posB;
    });
  }, [participants, session?.speaker_order]);

  const handleCopyPin = () => {
    if (session?.pin) {
      navigator.clipboard.writeText(session.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Turn Action 1: Start Speaking
  const handleStartSpeaking = async (targetStudentId?: string) => {
    const studentToStart = targetStudentId || currentStudentId;
    if (!studentToStart) return;
    try {
      setErrorMsg(null);
      await api.post(`/gd-sessions/${id}/speaker/start`, { student_id: studentToStart });
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Unable to start candidate turn.');
    }
  };

  // Turn Action 2: Stop Speaking and Store Duration
  const handleStopSpeaking = async () => {
    const targetId = activeSpeaker?.student_id || currentStudentId;
    if (!targetId) return;
    try {
      setErrorMsg(null);
      await api.post(`/gd-sessions/${id}/speaker/stop`, {
        student_id: targetId,
        duration_seconds: elapsedSeconds
      });
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to conclude speaking turn.');
    }
  };

  // Turn Action 3: Set Marks out of 10
  const handleSetMark = (targetStudentId: string, questionId: string, mark: number) => {
    setSpeakerMarksState(prev => ({
      ...prev,
      [targetStudentId]: {
        ...(prev[targetStudentId] || {}),
        [questionId]: mark
      }
    }));
  };

  // Turn Action 4: Submit Marks for Current Speaker
  const handleSubmitMarks = async (targetStudentId: string) => {
    const marksForSpeaker = speakerMarksState[targetStudentId] || {};
    const unrated = questions.find(q => !marksForSpeaker[q.id]);
    if (unrated) {
      setErrorMsg(`Please award marks (1 to 10) for all ${questions.length} discussion questions.`);
      return;
    }

    const ratingsPayload = questions.map(q => ({
      question_id: q.id,
      marks_out_of_10: marksForSpeaker[q.id] || 5,
      feedback: speakerFeedbackState[targetStudentId] || ''
    }));

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/gd-sessions/${id}/speaker/rate`, {
        speaker_student_id: targetStudentId,
        ratings: ratingsPayload
      });
      setSuccessMsg(res.data.message || 'Marks recorded successfully for candidate!');
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit marks.');
    } finally {
      setSubmitting(false);
    }
  };

  // Turn Action 5: Advance to Next Speaker
  const handleAdvanceNextSpeaker = async () => {
    setAdvancing(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/gd-sessions/${id}/speaker/next`, {});
      if (res.data.completed) {
        setSuccessMsg('All candidate turns have concluded! Cohort results are now finalized.');
      } else {
        setSuccessMsg(`Advanced to next speaker: ${res.data.next_speaker?.student_name || 'Candidate'}`);
      }
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to advance to next speaker.');
    } finally {
      setAdvancing(false);
    }
  };

  // Admin Turn Action: Reset Turns
  const handleResetTurns = async () => {
    if (!window.confirm('Reset all speaker turns, timers, and ratings for a fresh round?')) return;
    try {
      await api.post(`/gd-sessions/${id}/speaker/reset`, {});
      setSuccessMsg('Session turns and timers reset.');
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset session.');
    }
  };

  // Admin Action: Publish Final Results
  const handlePublishResults = async () => {
    try {
      await api.put(`/gd-sessions/${id}/publish-results`, {});
      setSuccessMsg('Official results published! Standings and marks are now visible to all candidates.');
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to publish results.');
    }
  };

  // Admin Action: Update Live Capacity & Duration
  const handleUpdateLiveCapacity = async () => {
    if (!id) return;
    setUpdatingCapacity(true);
    try {
      const res = await api.put(`/gd-sessions/${id}/capacity`, {
        max_participants: liveCapacityInput,
        speaker_duration_limit_seconds: liveDurationLimitInput
      });
      setSuccessMsg(res.data.message || 'Room capacity limit updated successfully.');
      setShowCapacityModal(false);
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update capacity limit.');
    } finally {
      setUpdatingCapacity(false);
    }
  };

  const handleQuickExpandLiveCapacity = async (increment: number = 5) => {
    if (!id || !session) return;
    const currentMax = session.max_participants || 10;
    const newMax = Math.min(500, currentMax + increment);
    try {
      await api.put(`/gd-sessions/${id}/capacity`, { max_participants: newMax });
      setSuccessMsg(`Expanded room capacity to ${newMax} candidate seats!`);
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to expand capacity.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Connecting to Live GD Room...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-black/[0.05] text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">GD Session Not Found</h2>
        <p className="text-xs text-slate-500">The session you are looking for may have concluded or been removed.</p>
        <button
          onClick={() => navigate(isAdmin ? '/admin/gd-sessions' : '/gd-sessions')}
          className="px-5 py-2.5 bg-[#1d1d1f] text-white font-semibold text-xs rounded-full cursor-pointer hover:bg-black"
        >
          Return to GD Directory
        </button>
      </div>
    );
  }

  const isPublished = Boolean(session.is_results_published) || session.status === 'COMPLETED' || session.session_stage === 'COMPLETED';
  const myParticipant = session.my_participant;
  const myRank = session.my_rank || myParticipant?.rank;
  const currentSpeakerIdx = (session.current_speaker_index ?? 0) + 1;
  const totalSpeakersCount = Math.max(participants.length, session.max_participants || 10);

  // Check if current user has already evaluated the candidate under evaluation
  const hasEvaluatedCurrentCandidate = Boolean(
    candidateUnderEvaluation &&
    session.my_speaker_ratings &&
    session.my_speaker_ratings[candidateUnderEvaluation.student_id] &&
    Object.keys(session.my_speaker_ratings[candidateUnderEvaluation.student_id]).length >= questions.length
  );

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16 animate-fade-in">
      
      {/* Top Navigation & Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(isAdmin ? '/admin/gd-sessions' : '/gd-sessions')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isAdmin ? 'Admin GD Management' : 'GD Directory'}</span>
        </button>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* PIN badge */}
          <div className="inline-flex items-center space-x-2 liquid-glass-pill px-3 py-1 text-slate-800 text-xs font-mono font-bold shadow-2xs">
            <span>PIN: {session.pin}</span>
            <button
              onClick={handleCopyPin}
              title="Copy PIN"
              className="text-slate-400 hover:text-slate-800 cursor-pointer p-0.5"
            >
              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Session Stage Badge */}
          {session.session_stage === 'SPEAKING' ? (
            <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Speaking Turn Active</span>
            </span>
          ) : session.session_stage === 'RATING' ? (
            <span className="bg-amber-500/10 text-amber-800 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Peer Rating Phase</span>
            </span>
          ) : isPublished ? (
            <span className="bg-purple-50 text-purple-800 border border-purple-200/60 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>Results Finalized</span>
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Awaiting Speaker Start</span>
            </span>
          )}

          {/* Socket live pulse */}
          <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Live Sync</span>
          </span>
        </div>
      </div>

      {/* Hero Session Liquid Glass Banner */}
      <div className="liquid-glass-dark rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.18)] relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/10 text-white/95 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-white/15">
              Turn-Based GD • Capacity: {session.max_participants || 10} Candidates
            </span>
            <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
              {questions.length} Evaluation Questions (1-10 Marks)
            </span>
            <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{session.duration_minutes} Mins Session</span>
            </span>
            <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              {participants.length} Candidates Present
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{session.title}</h1>
          
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Group Discussion Topic:</p>
              <p className="text-sm font-semibold text-white mt-0.5">{session.topic}</p>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCapacityModal(true)}
                  className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 text-[11px] font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="Configure candidate limit or expand seats"
                >
                  <Sliders className="w-3 h-3 text-amber-300" />
                  <span>Capacity Cart ({participants.length}/{session.max_participants || 10})</span>
                </button>
                <button
                  onClick={handleResetTurns}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-xl border border-white/15 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Turns</span>
                </button>
                {!isPublished && (
                  <button
                    onClick={handlePublishResults}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Trophy className="w-3 h-3" />
                    <span>Publish Results</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {session.description && (
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* =========================================================================
          STAGE 1: ACTIVE SPEAKER SPOTLIGHT (PINNED AT THE FIRST POSITION FOR ALL CANDIDATES)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Live Speaker Spotlight (Comes First for All Candidates)
            </h2>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-500">
            Turn {currentSpeakerIdx} of {participants.length || 1}
          </span>
        </div>

        {session.session_stage === 'SPEAKING' && activeSpeaker ? (
          /* ===================================================================
             SUB-STAGE A: CANDIDATE IS CURRENTLY SPEAKING (TIMER RUNNING)
             =================================================================== */
          <div className="liquid-glass-dark rounded-3xl p-6 sm:p-8 border-2 border-emerald-400/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Speaker Profile & Aura */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-3xl font-extrabold shadow-lg ring-4 ring-emerald-400/30 animate-pulse">
                    {activeSpeaker.student_name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-xl border-2 border-slate-950 shadow-md">
                    <Mic className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase px-3 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Speaker on the Floor • Candidate #{activeSpeaker.speaking_order || currentSpeakerIdx}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeSpeaker.student_name}
                  </h3>
                  
                  <p className="text-xs text-slate-300 font-medium">
                    Reg: <span className="font-mono text-white">{activeSpeaker.student_reg}</span> • Department: <span className="text-white">{activeSpeaker.student_department}</span>
                  </p>
                  <p className="text-[11px] text-emerald-300 font-medium">
                    Community: {activeSpeaker.student_community}
                  </p>
                </div>
              </div>

              {/* Live Digital Timer & Speaking Frequency Wave */}
              <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-white/15 min-w-[220px] shadow-inner text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Speaking Duration</span>
                </span>

                <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
                  {formatSeconds(elapsedSeconds)}
                </div>

                {/* Animated Audio Wave Bars */}
                <div className="flex items-center justify-center space-x-1.5 h-6">
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s] h-5" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_1.0s_ease-in-out_infinite_0.2s] h-6" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.3s] h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.4s] h-5" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.5s] h-3" />
                </div>

                <p className="text-[10px] text-slate-400">
                  Timer is permanently stored upon finish
                </p>
              </div>

            </div>

            {/* Dynamic Interactive Speaker Controls */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 text-center sm:text-left">
                {isMeSpeaking ? (
                  <p className="font-semibold text-emerald-300">
                    🎙️ You are currently speaking! Present your points clearly. When finished, conclude to receive peer marks.
                  </p>
                ) : (
                  <p className="text-slate-300">
                    🎧 Listening to <strong>{activeSpeaker.student_name}</strong>. Listen carefully; you will rate their speech out of 10 marks per question immediately.
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {(isMeSpeaking || isAdmin) && (
                  <button
                    onClick={handleStopSpeaking}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center space-x-2 cursor-pointer transition-all transform hover:scale-102 active:scale-98"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Conclude Speaking & Start Peer Rating</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={handleAdvanceNextSpeaker}
                    disabled={advancing}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-2xl border border-white/20 cursor-pointer flex items-center space-x-1"
                  >
                    <span>Skip to Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        ) : session.session_stage === 'RATING' && candidateUnderEvaluation ? (
          /* ===================================================================
             SUB-STAGE B: CANDIDATE HAS FINISHED SPEAKING -> RATING OUT OF 10 MARKS
             =================================================================== */
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.06)] space-y-6">
            
            {/* Speaker Header with Stored Speaking Time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                  {candidateUnderEvaluation.student_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                      Speaking Turn Concluded
                    </span>
                    <span className="text-[10px] text-slate-400">Candidate #{candidateUnderEvaluation.speaking_order || currentSpeakerIdx}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {candidateUnderEvaluation.student_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {candidateUnderEvaluation.student_reg} • {candidateUnderEvaluation.student_department}
                  </p>
                </div>
              </div>

              {/* Permanently Stored Time Badge */}
              <div className="flex items-center space-x-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-emerald-400" />
                <div className="text-right sm:text-left">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Recorded Speaking Time</span>
                  <span className="text-base font-mono font-bold text-emerald-300">
                    {formatSeconds(candidateUnderEvaluation.speaking_time_seconds || 0)} (Stored)
                  </span>
                </div>
              </div>
            </div>

            {/* Evaluation Content: Based on User Role */}
            {isMeUnderEvaluation ? (
              /* The speaker themselves is waiting for peers to rate */
              <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Star className="w-7 h-7 text-amber-600 fill-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Your Speech Concluded • Peer Marks in Progress</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your speaking time of <strong>{formatSeconds(candidateUnderEvaluation.speaking_time_seconds || 0)}</strong> has been recorded to your scorecard. The remaining candidates are now rating your speech out of 10 marks per question.
                </p>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleAdvanceNextSpeaker}
                    disabled={advancing}
                    className="px-6 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold rounded-full flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>Proceed to Next Candidate</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : hasEvaluatedCurrentCandidate ? (
              /* Current student has already submitted marks for this speaker */
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-950">You Awarded Marks to {candidateUnderEvaluation.student_name}!</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Your 1-to-10 marks across all questions have been recorded. Waiting for cohort peers to finish before the next candidate takes the floor.
                </p>

                <button
                  onClick={handleAdvanceNextSpeaker}
                  disabled={advancing}
                  className="px-6 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold rounded-full inline-flex items-center space-x-2 cursor-pointer"
                >
                  <span>Ready for Next Speaker</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* The remaining candidates rate the speaker across questions out of 10 marks */
              <div className="space-y-6">
                
                {/* Rubric Header */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Rate {candidateUnderEvaluation.student_name}'s Arguments (Marks Out of 10):</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select marks from 1 (Basic) to 10 (Outstanding) for each discussion question based on their speech.
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shrink-0">
                    {questions.length} Questions Rubric
                  </span>
                </div>

                {/* Question-by-Question Rating Cards */}
                <div className="space-y-4">
                  {questions.map((q, qIdx) => {
                    const currentMarks = speakerMarksState[candidateUnderEvaluation.student_id]?.[q.id] || 0;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          currentMarks > 0
                            ? 'bg-white border-black/[0.1] shadow-2xs'
                            : 'bg-white/60 border-black/[0.05]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] pb-3 mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Question {qIdx + 1} of {questions.length}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {q.question_text}
                            </h4>
                          </div>

                          <div className="shrink-0 flex items-center space-x-2">
                            {currentMarks > 0 ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-black font-mono flex items-center space-x-1 ${
                                currentMarks >= 9
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : currentMarks >= 7
                                  ? 'bg-blue-100 text-blue-900'
                                  : currentMarks >= 5
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}>
                                <span>{currentMarks} / 10 Marks</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium bg-black/[0.03] px-2.5 py-0.5 rounded-full">
                                Awaiting Selection
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive 1 to 10 Marks Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                            <span>1 (Needs Work)</span>
                            <span>5 (Average)</span>
                            <span>10 (Outstanding)</span>
                          </div>

                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((markVal) => {
                              const isSelected = currentMarks === markVal;
                              return (
                                <button
                                  key={markVal}
                                  type="button"
                                  onClick={() => handleSetMark(candidateUnderEvaluation.student_id, q.id, markVal)}
                                  className={`h-11 rounded-xl font-mono text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                    isSelected
                                      ? markVal >= 9
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                                        : markVal >= 7
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                        : markVal >= 5
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
                                        : 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                  title={`Award ${markVal} Marks`}
                                >
                                  <span>{markVal}</span>
                                  <span className="text-[9px] font-sans font-normal opacity-70">
                                    {markVal === 10 ? '⭐' : 'pts'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Quick Feedback Chips & Submit Bar */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                      Optional Constructive Commendation / Tag:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {FEEDBACK_TAGS.map((tag) => {
                        const currentFb = speakerFeedbackState[candidateUnderEvaluation.student_id] || '';
                        const isSelected = currentFb === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSpeakerFeedbackState(prev => ({
                              ...prev,
                              [candidateUnderEvaluation.student_id]: isSelected ? '' : tag
                            }))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-400'
                                : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Evaluation Summary:</span>
                      <p className="text-sm font-bold text-white">
                        {questions.filter(q => Boolean(speakerMarksState[candidateUnderEvaluation.student_id]?.[q.id])).length} of {questions.length} Questions Graded
                      </p>
                    </div>

                    <button
                      onClick={() => handleSubmitMarks(candidateUnderEvaluation.student_id)}
                      disabled={submitting || questions.some(q => !speakerMarksState[candidateUnderEvaluation.student_id]?.[q.id])}
                      className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                        questions.every(q => Boolean(speakerMarksState[candidateUnderEvaluation.student_id]?.[q.id]))
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg transform hover:scale-102 active:scale-98'
                          : 'bg-white/20 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Marks...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Marks for {candidateUnderEvaluation.student_name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Advance Speaker Button */}
            <div className="pt-4 border-t border-black/[0.05] flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                Turn {currentSpeakerIdx} of {participants.length || 1}
              </span>

              <button
                onClick={handleAdvanceNextSpeaker}
                disabled={advancing}
                className="px-6 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-bold rounded-full flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                {advancing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Advancing...</span>
                  </>
                ) : (
                  <>
                    <span>Advance to Next Candidate</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          /* ===================================================================
             SUB-STAGE C: WAITING FOR CANDIDATE #1 TO START SPEAKING
             =================================================================== */
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-black/[0.05] shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto shadow-inner">
              <Mic className="w-8 h-8 text-slate-700" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Floor Open • Ready for Candidate #1 to Speak
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When candidate starts speaking, their profile comes first to all candidates and their speaking timer begins counting up.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleStartSpeaking(orderedParticipants[0]?.student_id || currentStudentId)}
                className="px-7 py-3 bg-[#1d1d1f] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center space-x-2 cursor-pointer transition-all transform hover:scale-102 active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Candidate #1 Turn & Timer</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleAdvanceNextSpeaker}
                  className="px-5 py-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-xs font-bold rounded-full cursor-pointer flex items-center space-x-1"
                >
                  <span>Auto-Advance Turn</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          STAGE 2: CANDIDATE TURN QUEUE & ROSTER (ALL CANDIDATES 1 TO 10)
          ========================================================================= */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-black/[0.05] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.05] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Candidate Speaking Roster & Turn Order ({participants.length} Candidates)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each candidate speaks in turn, timer is stored, and peers rate them out of 10 marks.
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
            Queue: {orderedParticipants.filter(p => p.speaking_status === 'SPOKEN').length} / {orderedParticipants.length} Completed
          </span>
        </div>

        {orderedParticipants.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No candidates have joined yet. Share PIN: <strong className="font-mono text-slate-800">{session.pin}</strong>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {orderedParticipants.map((candidate, idx) => {
              const isCurrent = activeSpeaker?.student_id === candidate.student_id;
              const hasSpoken = candidate.speaking_status === 'SPOKEN';
              const isMe = candidate.student_id === currentStudentId;
              const turnNum = candidate.speaking_order || (idx + 1);

              return (
                <div
                  key={candidate.student_id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20 shadow-md'
                      : hasSpoken
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-white border-black/[0.06] hover:border-black/[0.15]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-400'
                          : hasSpoken
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-[#1d1d1f] text-white'
                      }`}>
                        {candidate.student_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">#{turnNum}</span>
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{candidate.student_name}</h4>
                          {isMe && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {candidate.student_reg} • {candidate.student_department}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isCurrent ? (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                        <Mic className="w-3 h-3" />
                        <span>Speaking</span>
                      </span>
                    ) : hasSpoken ? (
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Done ✓
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        Queued
                      </span>
                    )}
                  </div>

                  {/* Speaking Time Stored & Score Preview */}
                  <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{candidate.speaking_time_seconds ? formatSeconds(candidate.speaking_time_seconds) : '—'}</span>
                    </span>

                    {candidate.average_score_out_of_10 ? (
                      <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{candidate.average_score_out_of_10} / 10</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Score Pending</span>
                    )}

                    {(isAdmin || (!activeSpeaker && candidate.student_id === currentStudentId)) && !hasSpoken && !isCurrent && (
                      <button
                        onClick={() => handleStartSpeaking(candidate.student_id)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                      >
                        Start Turn
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          STAGE 3: COHORT RESULTS & 10-POINT LEADERBOARD SCORECARD
          ========================================================================= */}
      <section className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-black/[0.05] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.05] pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-black/[0.04] text-slate-800 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Cohort Standings & Scorecard</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Speaking Time & 10-Point Scorecard
            </h3>
            <p className="text-xs text-slate-400">
              Rankings determined by cohort peer marks out of 10 and speaking time stored for each candidate.
            </p>
          </div>

          {session.leaderboard && session.leaderboard.length > 0 && (
            <button
              onClick={() => setShowGiftModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold rounded-full flex items-center space-x-1.5 shadow-sm cursor-pointer w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Celebrate Top Performers</span>
            </button>
          )}
        </div>

        {/* Top 3 Podium Cards */}
        {session.leaderboard && session.leaderboard.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 2nd Place */}
            {session.leaderboard[1] && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 text-center flex flex-col justify-between order-2 md:order-1 shadow-2xs">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                    <Medal className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    2nd Place • Silver
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[1].student_name}</h4>
                  <p className="text-[11px] text-slate-400">{session.leaderboard[1].student_reg} • {session.leaderboard[1].student_department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Marks / 10</span>
                    <span className="font-mono font-bold text-slate-800">
                      {session.leaderboard[1].average_score_out_of_10 ? `${session.leaderboard[1].average_score_out_of_10}/10` : `#${session.leaderboard[1].average_rank}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Speaking Time</span>
                    <span className="font-mono font-bold text-slate-800">{session.leaderboard[1].speaking_time_formatted || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {session.leaderboard[0] && (
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-300 text-center flex flex-col justify-between order-1 md:order-2 shadow-lg scale-102">
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                    <Trophy className="w-8 h-8 text-slate-950" />
                  </div>
                  <span className="inline-block bg-amber-400 text-slate-950 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase shadow-2xs">
                    1st Place • Gold Champion
                  </span>
                  <h4 className="font-black text-slate-900 text-lg line-clamp-1">{session.leaderboard[0].student_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{session.leaderboard[0].student_reg} • {session.leaderboard[0].student_department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200/60 flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Marks / 10</span>
                    <span className="font-mono font-black text-amber-950 text-sm">
                      {session.leaderboard[0].average_score_out_of_10 ? `${session.leaderboard[0].average_score_out_of_10}/10` : `#${session.leaderboard[0].average_rank}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Speaking Time</span>
                    <span className="font-mono font-black text-amber-950 text-sm">{session.leaderboard[0].speaking_time_formatted || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {session.leaderboard[2] && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 text-center flex flex-col justify-between order-3 shadow-2xs">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-amber-800 flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6 text-amber-700" />
                  </div>
                  <span className="inline-block bg-orange-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    3rd Place • Bronze
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[2].student_name}</h4>
                  <p className="text-[11px] text-slate-400">{session.leaderboard[2].student_reg} • {session.leaderboard[2].student_department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Marks / 10</span>
                    <span className="font-mono font-bold text-slate-800">
                      {session.leaderboard[2].average_score_out_of_10 ? `${session.leaderboard[2].average_score_out_of_10}/10` : `#${session.leaderboard[2].average_rank}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Speaking Time</span>
                    <span className="font-mono font-bold text-slate-800">{session.leaderboard[2].speaking_time_formatted || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Leaderboard Table */}
        <div className="overflow-x-auto rounded-2xl border border-black/[0.05]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-black/[0.05]">
              <tr>
                <th className="py-3 px-3.5">Rank</th>
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3">Dept & Reg</th>
                <th className="py-3 px-3 text-center">Speaking Time (Stored)</th>
                <th className="py-3 px-3 text-center">Score (Out of 10)</th>
                {questions.map((q) => (
                  <th key={q.id} className="py-3 px-2 text-center" title={q.question_text}>
                    Q{q.order} Marks
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Total Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] font-medium">
              {session.leaderboard?.map((entry) => {
                const isMe = entry.student_id === currentStudentId;
                return (
                  <tr
                    key={entry.student_id}
                    className={`transition-colors ${
                      isMe ? 'bg-amber-50/60 font-bold' : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-3.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono font-bold text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-2xs'
                          : entry.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : entry.rank === 3
                          ? 'bg-orange-200 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-900 font-extrabold">
                      <div className="flex items-center space-x-2">
                        <span>{entry.student_name}</span>
                        {isMe && (
                          <span className="bg-amber-200 text-amber-900 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-500">
                      <span>{entry.student_reg}</span>
                      <span className="text-slate-400 block text-[10px]">{entry.student_department}</span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-700">
                      {entry.speaking_time_formatted || '00:00'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-amber-100 text-amber-950">
                        {entry.average_score_out_of_10 ? `${entry.average_score_out_of_10} / 10` : `Rank #${entry.average_rank}`}
                      </span>
                    </td>

                    {questions.map((q) => {
                      const qRankData = entry.question_ranks?.[q.id];
                      const qScore = qRankData?.average_score_out_of_10;
                      return (
                        <td key={q.id} className="py-3.5 px-2 text-center font-mono text-[11px]">
                          {qScore !== undefined ? (
                            <span className="font-bold text-slate-800">{qScore} / 10</span>
                          ) : qRankData?.rank_position ? (
                            <span>#{qRankData.rank_position}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {entry.total_marks || entry.total_points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gift Burst Modal */}
      {showGiftModal && (
        <GiftBurstModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          quizTitle={`Group Discussion: ${session.title}`}
          rank={myRank === 2 ? 2 : myRank === 3 ? 3 : 1}
          score={myParticipant?.total_marks_received || myParticipant?.total_points || 100}
          maxScore={session.leaderboard?.[0]?.total_marks || session.leaderboard?.[0]?.total_points || 100}
          accuracy={`${(myParticipant?.average_score_out_of_10 || 9.0).toFixed(1)} / 10 Marks`}
          totalParticipants={session.leaderboard?.length || session.participant_count || 1}
        />
      )}

      {/* CANDIDATE CAPACITY CART MODAL (LIVE MODERATOR CONTROL) */}
      {showCapacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-black/[0.08] space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-black/[0.05] pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Sliders className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Candidate Capacity Cart</h3>
                  <p className="text-[11px] text-slate-400">Dynamically update seat limit & turn timers during live session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCapacityModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-black/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Status Banner */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-black/[0.05] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Active Candidates:</span>
                <span className="font-mono font-bold text-slate-900">{participants.length} Present</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Current Room Limit:</span>
                <span className="font-mono font-bold text-indigo-600">{session.max_participants || 10} Seats</span>
              </div>
            </div>

            {/* Stepper & Number Control */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-2xl border border-indigo-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Adjust Total Candidate Seats</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Min {participants.length || 2} - Max 500
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => setLiveCapacityInput(prev => Math.max(Math.max(2, participants.length), prev - 5))}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-black/[0.1] text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs active:scale-95"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setLiveCapacityInput(prev => Math.max(Math.max(2, participants.length), prev - 1))}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-black/[0.1] text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs active:scale-95"
                >
                  -1
                </button>
                <div className="relative w-36">
                  <input
                    type="number"
                    min={Math.max(2, participants.length)}
                    max={500}
                    value={liveCapacityInput}
                    onChange={(e) => setLiveCapacityInput(Math.max(2, Math.min(500, parseInt(e.target.value, 10) || 2)))}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-300 rounded-xl text-center text-lg font-mono font-black text-indigo-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                  <span className="text-[9px] font-bold uppercase text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    Seats
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveCapacityInput(prev => Math.min(500, prev + 1))}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-black/[0.1] text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs active:scale-95"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setLiveCapacityInput(prev => Math.min(500, prev + 5))}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-black/[0.1] text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs active:scale-95"
                >
                  +5
                </button>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {CAPACITY_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLiveCapacityInput(p)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      liveCapacityInput === p
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-105'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-black/[0.08]'
                    }`}
                  >
                    {p} Seats
                  </button>
                ))}
              </div>
            </div>

            {/* Speaking Time Limit Per Candidate */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-black/[0.05]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Speaking Time Per Candidate:</span>
                </span>
                <span className="font-mono font-bold text-indigo-600">
                  {Math.floor(liveDurationLimitInput / 60)}m {liveDurationLimitInput % 60 ? `${liveDurationLimitInput % 60}s` : ''} ({liveDurationLimitInput}s)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setLiveDurationLimitInput(sec)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      liveDurationLimitInput === sec
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50'
                    }`}
                  >
                    {sec < 60 ? `${sec}s` : `${sec / 60} min${sec / 60 > 1 ? 's' : ''}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.05]">
              <button
                type="button"
                onClick={() => handleQuickExpandLiveCapacity(5)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Expand (+5 Seats)</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCapacityModal(false)}
                  className="px-4 py-2 border border-black/[0.08] text-slate-600 rounded-full text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateLiveCapacity}
                  disabled={updatingCapacity}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  {updatingCapacity ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Limit ({liveCapacityInput} Seats)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
