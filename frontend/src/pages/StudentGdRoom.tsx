import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Crown,
  ChevronRight,
  ChevronLeft,
  Layers,
  Send,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';

export const StudentGdRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<GdSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'OVERALL' | string>('OVERALL');

  // Local state for rankings per question:
  // { [questionId]: { [targetStudentId]: rankNumber } }
  const [rankingsState, setRankingsState] = useState<{ [qId: string]: { [stdId: string]: number } }>({});

  const fetchSession = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/gd-sessions/${id}`);
      const data: GdSession = res.data;
      setSession(data);

      // Pre-fill previously submitted evaluations if any
      if (data.my_evaluations && Object.keys(data.my_evaluations).length > 0) {
        const prefill: { [qId: string]: { [stdId: string]: number } } = {};
        for (const [qId, evals] of Object.entries(data.my_evaluations)) {
          prefill[qId] = {};
          if (Array.isArray(evals)) {
            for (const item of evals) {
              prefill[qId][item.target_student_id] = item.rank;
            }
          }
        }
        setRankingsState(prev => Object.keys(prev).length === 0 ? prefill : prev);
      }
    } catch (err: any) {
      console.error('Error fetching GD session:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load GD session room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const currentStudentId = user?.id;

  const peers: GdParticipant[] = useMemo(() => {
    if (!session?.participants) return [];
    return session.participants.filter(p => p.student_id !== currentStudentId);
  }, [session?.participants, currentStudentId]);

  const questions = session?.questions || [];
  const currentQuestion = questions[activeQuestionIndex];

  const handleCopyPin = () => {
    if (session?.pin) {
      navigator.clipboard.writeText(session.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleAssignRank = (questionId: string, peerStudentId: string, targetRank: number) => {
    setRankingsState(prev => {
      const currentQuestionRanks = { ...(prev[questionId] || {}) };
      
      const existingPeerWithRank = Object.keys(currentQuestionRanks).find(
        pId => currentQuestionRanks[pId] === targetRank
      );

      if (existingPeerWithRank && existingPeerWithRank !== peerStudentId) {
        const currentRankOfPeer = currentQuestionRanks[peerStudentId];
        if (currentRankOfPeer) {
          currentQuestionRanks[existingPeerWithRank] = currentRankOfPeer;
        } else {
          delete currentQuestionRanks[existingPeerWithRank];
        }
      }

      currentQuestionRanks[peerStudentId] = targetRank;

      return {
        ...prev,
        [questionId]: currentQuestionRanks
      };
    });
  };

  const isQuestionValid = (questionId: string): boolean => {
    if (peers.length === 0) return false;
    const qRanks = rankingsState[questionId] || {};
    const assignedRanks = Object.values(qRanks);
    
    if (assignedRanks.length !== peers.length) return false;
    
    for (let r = 1; r <= peers.length; r++) {
      if (!assignedRanks.includes(r)) return false;
    }
    return true;
  };

  const isAllEvaluationsValid: boolean = useMemo(() => {
    if (questions.length === 0 || peers.length === 0) return false;
    return questions.every(q => isQuestionValid(q.id));
  }, [questions, peers, rankingsState]);

  const handleSubmitEvaluations = async () => {
    if (!isAllEvaluationsValid) {
      setErrorMsg('Please assign unique ranks (1 to ' + peers.length + ') to all peers across all discussion questions.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const evaluationsByQuestion: {
      [questionId: string]: Array<{
        target_student_id: string;
        target_student_name: string;
        rank: number;
      }>;
    } = {};

    for (const q of questions) {
      const qRanks = rankingsState[q.id] || {};
      evaluationsByQuestion[q.id] = peers.map(p => ({
        target_student_id: p.student_id,
        target_student_name: p.student_name,
        rank: qRanks[p.student_id] || 1
      }));
    }

    try {
      const res = await api.post(`/gd-sessions/${id}/evaluate`, {
        evaluationsByQuestion
      });
      setSuccessMsg(res.data.message || 'Peer evaluations submitted successfully!');
      fetchSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit evaluations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-7 h-7 text-slate-800 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Connecting to GD Room...</p>
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
          onClick={() => navigate('/gd-sessions')}
          className="px-5 py-2.5 bg-[#1d1d1f] text-white font-semibold text-xs rounded-full cursor-pointer"
        >
          Return to GD Sessions
        </button>
      </div>
    );
  }

  const isPublished = Boolean(session.is_results_published) || session.status === 'COMPLETED';
  const myParticipant = session.my_participant;
  const hasSubmitted = myParticipant?.status === 'EVALUATION_SUBMITTED' || Boolean(session.my_evaluations && Object.keys(session.my_evaluations).length > 0);
  const myRank = session.my_rank || myParticipant?.rank;
  const isTopThree = myRank && myRank <= 3;

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      {/* Top Navigation & Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/gd-sessions')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GD Directory</span>
        </button>

        <div className="flex items-center space-x-2">
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

          {/* Status badge */}
          {isPublished ? (
            <span className="bg-purple-50 text-purple-800 border border-purple-200/60 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>Results Revealed</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Session</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Session Liquid Glass Banner */}
      <div className="liquid-glass-dark rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.18)] relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/10 text-white/90 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-white/15">
              Capacity: {session.max_participants || 6} Students
            </span>
            <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
              {questions.length} Questions
            </span>
            <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{session.duration_minutes} Mins</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{session.title}</h1>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Discussion Topic:</p>
            <p className="text-sm font-medium text-white mt-0.5">{session.topic}</p>
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
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: REVEALED RESULTS & QUESTION-BASED LEADERBOARD
          ========================================================================= */}
      {isPublished ? (
        <div className="space-y-6">
          
          {/* Winner Podium & Standing Header */}
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-black/[0.05] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-black/[0.04] text-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-black/[0.05]">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Official GD Standing Revealed</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Cohort Leaderboard & Question Performance
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Ranks calculated across all {questions.length} discussion questions. Each candidate's rank is determined by cohort peer evaluations.
              </p>
            </div>

            {/* Top 3 Podium Cards */}
            {session.leaderboard && session.leaderboard.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 2nd Place */}
                {session.leaderboard[1] && (
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-slate-200 text-center flex flex-col justify-between order-2 md:order-1 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                        <Medal className="w-6 h-6 text-slate-600" />
                      </div>
                      <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        2nd Place • Silver
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[1].student_name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{session.leaderboard[1].student_reg} • {session.leaderboard[1].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/[0.04] flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Rank</span>
                        <strong className="text-slate-900 font-mono font-bold text-sm">#{session.leaderboard[1].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Points</span>
                        <strong className="text-slate-900 font-mono font-bold text-sm">{session.leaderboard[1].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place Champion */}
                {session.leaderboard[0] && (
                  <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-3xl p-6 border border-amber-300 text-center flex flex-col justify-between order-1 md:order-2 shadow-md shadow-amber-500/5">
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-sm">
                        <Crown className="w-7 h-7 text-amber-950 fill-amber-950" />
                      </div>
                      <span className="inline-block bg-amber-200/80 text-amber-900 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                        1st Place Champion 🥇
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1">{session.leaderboard[0].student_name}</h3>
                      <p className="text-xs text-amber-900 font-semibold">{session.leaderboard[0].student_reg} • {session.leaderboard[0].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200/80 flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-amber-700 block">Avg Rank</span>
                        <strong className="text-amber-950 font-mono font-extrabold text-base">#{session.leaderboard[0].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-amber-700 block">Total Points</span>
                        <strong className="text-amber-950 font-mono font-extrabold text-base">{session.leaderboard[0].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {session.leaderboard[2] && (
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-orange-200 text-center flex flex-col justify-between order-3 md:order-3 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-800 flex items-center justify-center mx-auto">
                        <Award className="w-6 h-6 text-amber-700" />
                      </div>
                      <span className="inline-block bg-orange-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        3rd Place • Bronze 🥉
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[2].student_name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{session.leaderboard[2].student_reg} • {session.leaderboard[2].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/[0.04] flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Rank</span>
                        <strong className="text-slate-900 font-mono font-bold text-sm">#{session.leaderboard[2].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Points</span>
                        <strong className="text-slate-900 font-mono font-bold text-sm">{session.leaderboard[2].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standing Spotlight */}
            {myRank && (
              <div className="p-4 bg-[#1d1d1f] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-white/10">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white text-[#1d1d1f] flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs">
                    #{myRank}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-300 tracking-wider">Your Official Outcome</span>
                    <h4 className="text-sm sm:text-base font-bold">
                      {isTopThree ? 'Podium Finish Achieved!' : 'Group Discussion Participation Recorded'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rank #{myRank} among {session.leaderboard?.length || 0} participants
                    </p>
                  </div>
                </div>

                {isTopThree && (
                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-md cursor-pointer transition-all flex items-center space-x-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Open Trophy Celebration 🎉</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Question Breakdown Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-black/[0.05] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <span>Question-by-Question Rank Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Each student's position across all discussion questions as evaluated by peers.
                </p>
              </div>

              {/* View toggle */}
              <div className="flex items-center space-x-1 bg-black/[0.04] p-1 rounded-full text-xs font-medium self-start">
                <button
                  onClick={() => setLeaderboardTab('OVERALL')}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    leaderboardTab === 'OVERALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'
                  }`}
                >
                  All Questions
                </button>
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setLeaderboardTab(q.id)}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      leaderboardTab === q.id ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.05] text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Overall Rank</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Reg & Dept</th>
                    <th className="py-3 px-3">Avg Rank</th>
                    {questions.map((q, idx) => (
                      <th key={q.id} className="py-3 px-2 text-center">
                        Q{idx + 1} Rank
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] font-medium">
                  {session.leaderboard?.map((entry) => {
                    const isMe = entry.student_id === currentStudentId;
                    return (
                      <tr
                        key={entry.student_id}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-amber-50/50 font-bold'
                            : 'hover:bg-black/[0.02]'
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono font-bold text-xs ${
                              entry.rank === 1
                                ? 'bg-amber-400 text-slate-950 shadow-2xs'
                                : entry.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : entry.rank === 3
                                ? 'bg-orange-200 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
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

                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">
                          #{entry.average_rank}
                        </td>

                        {questions.map((q) => {
                          const qRankData = entry.question_ranks?.[q.id];
                          const pos = qRankData?.rank_position;
                          return (
                            <td key={q.id} className="py-3.5 px-2 text-center">
                              {pos ? (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                    pos === 1
                                      ? 'bg-amber-100 text-amber-900'
                                      : pos === 2
                                      ? 'bg-slate-100 text-slate-800'
                                      : pos === 3
                                      ? 'bg-orange-50 text-amber-800'
                                      : 'bg-black/[0.03] text-slate-600'
                                  }`}
                                  title={`Q${q.order} Rank #${pos}`}
                                >
                                  #{pos}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                          {entry.total_points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : hasSubmitted ? (
        /* =========================================================================
           STAGE 3: WAITING FOR ADMIN TO REVEAL OFFICIAL RESULTS
           ========================================================================= */
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-black/[0.05] text-center space-y-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.04] text-slate-800 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-slate-800" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block bg-black/[0.04] text-slate-800 text-xs font-semibold uppercase px-3 py-0.5 rounded-full border border-black/[0.05]">
              Rankings Submitted • Sealed 🔒
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Awaiting Official Result Reveal
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Your peer evaluations have been recorded. When all participants finish ranking, the instructor will reveal the official standings.
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/[0.04] max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Cohort Peer Evaluations</span>
              </span>
              <span className="font-mono text-[#1d1d1f] font-bold">
                {session.submitted_evaluations_count || 1} / {session.participant_count || 1} Submitted
              </span>
            </div>

            <div className="w-full bg-black/[0.05] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#1d1d1f] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((session.submitted_evaluations_count || 1) / Math.max(1, session.participant_count || 1)) * 100
                    )
                  )}%`
                }}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center space-x-1">
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              <span>Live polling active. Results reveal automatically once published.</span>
            </p>
          </div>

        </div>
      ) : peers.length === 0 ? (
        /* =========================================================================
           STAGE 1: WAITING FOR PEERS TO JOIN ROOM
           ========================================================================= */
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-black/[0.05] text-center space-y-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.04] text-slate-800 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-slate-800" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Waiting for Peers to Join...</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              At least 2 participants must join before peer rankings can begin. Share this room's 6-digit Join PIN.
            </p>
          </div>

          <div className="p-4 bg-black/[0.02] border border-black/[0.05] rounded-2xl inline-flex flex-col items-center space-y-2">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Join PIN</span>
            <span className="text-3xl font-mono font-bold text-slate-900 tracking-widest">{session.pin}</span>
            <button
              onClick={handleCopyPin}
              className="px-4 py-1.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
           STAGE 2: ACTIVE PEER EVALUATION & RANKING
           ========================================================================= */
        <div className="space-y-6">
          
          {/* Instructions Bar */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-black/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-black/[0.04] text-slate-800 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase">Peer Evaluation Rubric:</h4>
                <p className="text-xs text-slate-500">
                  Assign ranks <strong className="text-slate-800">1 to {peers.length}</strong> to each peer for every question based on articulation and arguments.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Progress</span>
              <span className="text-xs font-bold text-slate-900">
                {questions.filter(q => isQuestionValid(q.id)).length} of {questions.length} Completed
              </span>
            </div>
          </div>

          {/* Question Navigation Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const valid = isQuestionValid(q.id);
              const isActive = idx === activeQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1d1d1f] text-white shadow-xs'
                      : valid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-white text-slate-600 border border-black/[0.06] hover:bg-slate-50'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  {valid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Current Question Card & Ranking Selector */}
          {currentQuestion && (
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-black/[0.05] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-6">
              
              <div className="space-y-1.5 border-b border-black/[0.05] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </span>
                  {isQuestionValid(currentQuestion.id) ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>All Peers Ranked Validly ✓</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-black/[0.04] px-2.5 py-0.5 rounded-full">
                      Assign ranks 1 to {peers.length}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {currentQuestion.question_text}
                </h3>
              </div>

              {/* Peers List with Interactive Rank Buttons */}
              <div className="space-y-3">
                {peers.map((peer) => {
                  const assignedRank = rankingsState[currentQuestion.id]?.[peer.student_id];

                  return (
                    <div
                      key={peer.student_id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        assignedRank
                          ? 'bg-black/[0.02] border-black/[0.1]'
                          : 'bg-white border-black/[0.05] hover:border-black/[0.1]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {peer.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{peer.student_name}</p>
                          <p className="text-xs text-slate-400">
                            {peer.student_reg} • {peer.student_department}
                          </p>
                        </div>
                      </div>

                      {/* Rank Selector Buttons */}
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="text-[11px] font-medium text-slate-400 mr-1.5">Rank:</span>
                        {Array.from({ length: peers.length }, (_, i) => i + 1).map((r) => {
                          const isSelected = assignedRank === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleAssignRank(currentQuestion.id, peer.student_id, r)}
                              className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? r === 1
                                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 shadow-xs scale-105'
                                    : r === 2
                                    ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-300/50 shadow-xs scale-105'
                                    : r === 3
                                    ? 'bg-orange-300 text-amber-950 ring-2 ring-orange-300/50 shadow-xs scale-105'
                                    : 'bg-[#1d1d1f] text-white shadow-xs scale-105'
                                  : 'bg-white text-slate-600 border border-black/[0.08] hover:bg-slate-100 hover:text-slate-900'
                              }`}
                              title={`Assign Rank #${r}`}
                            >
                              {r === 1 ? '1🥇' : r === 2 ? '2🥈' : r === 3 ? '3🥉' : `#${r}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next Question Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-black/[0.05]">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 border border-black/[0.08] text-slate-600 text-xs font-semibold rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {activeQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-semibold rounded-full hover:bg-black cursor-pointer flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Final Question</span>
                )}
              </div>

            </div>
          )}

          {/* Submit Evaluations Card */}
          <div className="bg-gradient-to-b from-[#1d1d1f] to-[#121214] text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white">Ready to Submit Rankings?</h3>
              <p className="text-xs text-slate-300">
                Confirm unique ranks for all peers. Once submitted, rankings are sealed for the official outcome.
              </p>
            </div>

            <button
              onClick={handleSubmitEvaluations}
              disabled={submitting || !isAllEvaluationsValid}
              className={`px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 ${
                isAllEvaluationsValid
                  ? 'bg-white hover:bg-slate-100 text-[#1d1d1f] shadow-lg cursor-pointer transform hover:scale-102 active:scale-98'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Peer Rankings</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Gift Burst Modal */}
      {showGiftModal && (
        <GiftBurstModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          quizTitle={`Group Discussion: ${session.title}`}
          rank={myRank === 2 ? 2 : myRank === 3 ? 3 : 1}
          score={myParticipant?.total_points || 100}
          maxScore={session.leaderboard?.[0]?.total_points || 100}
          accuracy={`${(myParticipant?.average_rank || 1.0).toFixed(1)} Avg Rank`}
          totalParticipants={session.leaderboard?.length || session.participant_count || 1}
        />
      )}

    </div>
  );
};
