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
  Star,
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
    // Live polling every 4 seconds to observe peers joining, submissions, or admin publishing results
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Determine current student identity
  const currentStudentId = user?.id;

  // Filter peers (all participants in room except current student)
  const peers: GdParticipant[] = useMemo(() => {
    if (!session?.participants) return [];
    return session.participants.filter(p => p.student_id !== currentStudentId);
  }, [session?.participants, currentStudentId]);

  // Questions
  const questions = session?.questions || [];
  const currentQuestion = questions[activeQuestionIndex];

  // Helper to copy session PIN
  const handleCopyPin = () => {
    if (session?.pin) {
      navigator.clipboard.writeText(session.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Assign or toggle rank for a peer on current question
  const handleAssignRank = (questionId: string, peerStudentId: string, targetRank: number) => {
    setRankingsState(prev => {
      const currentQuestionRanks = { ...(prev[questionId] || {}) };
      
      // If another peer already had this rank on this question, remove or swap
      const existingPeerWithRank = Object.keys(currentQuestionRanks).find(
        pId => currentQuestionRanks[pId] === targetRank
      );

      if (existingPeerWithRank && existingPeerWithRank !== peerStudentId) {
        // If current peer already had a rank, swap it
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

  // Validation check for a question: all peers must have a unique rank from 1 to peers.length
  const isQuestionValid = (questionId: string): boolean => {
    if (peers.length === 0) return false;
    const qRanks = rankingsState[questionId] || {};
    const assignedRanks = Object.values(qRanks);
    
    if (assignedRanks.length !== peers.length) return false;
    
    // Check all ranks 1..peers.length are covered
    for (let r = 1; r <= peers.length; r++) {
      if (!assignedRanks.includes(r)) return false;
    }
    return true;
  };

  // Overall evaluation form validity: every question must be valid
  const isAllEvaluationsValid: boolean = useMemo(() => {
    if (questions.length === 0 || peers.length === 0) return false;
    return questions.every(q => isQuestionValid(q.id));
  }, [questions, peers, rankingsState]);

  // Submit peer evaluations
  const handleSubmitEvaluations = async () => {
    if (!isAllEvaluationsValid) {
      setErrorMsg('Please assign unique ranks (1 to ' + peers.length + ') to all peers across all discussion questions.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Format payload
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
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Connecting to GD Room...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">GD Session Not Found</h2>
        <p className="text-xs text-slate-500">The session you are looking for may have been deleted or does not exist.</p>
        <button
          onClick={() => navigate('/gd-sessions')}
          className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Navigation & Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/gd-sessions')}
          className="inline-flex items-center space-x-2 text-xs font-black text-slate-600 hover:text-indigo-600 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GD Directory</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* PIN badge */}
          <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl text-amber-900 text-xs font-mono font-black shadow-xs">
            <span>Room PIN: {session.pin}</span>
            <button
              onClick={handleCopyPin}
              title="Copy PIN"
              className="hover:text-amber-700 cursor-pointer p-0.5"
            >
              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Status badge */}
          {isPublished ? (
            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>Results Revealed</span>
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Session</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Session Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 transform translate-x-16 -translate-y-8 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-indigo-400/30">
              Max {session.max_participants || 6} Participants
            </span>
            <span className="bg-white/10 text-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
              {questions.length} Evaluation Questions
            </span>
            <span className="bg-white/10 text-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{session.duration_minutes} Mins</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{session.title}</h1>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-xs text-amber-300 font-extrabold uppercase tracking-wide">Discussion Topic:</p>
            <p className="text-sm font-semibold text-white mt-0.5">{session.topic}</p>
          </div>

          {session.description && (
            <p className="text-xs text-indigo-200/80 leading-relaxed max-w-3xl">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
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
        <div className="space-y-6 animate-fade-in">
          
          {/* Winner Podium & Standing Header */}
          <div className="bg-gradient-to-b from-purple-900/10 via-white to-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-md space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-purple-100 text-purple-900 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-purple-700 fill-purple-700" />
                <span>Official GD Standing Revealed</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Cohort Leaderboard & Question Performance
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Official ranks calculated across all {questions.length} discussion evaluation questions. Each student's rank is mathematically determined by peer evaluations.
              </p>
            </div>

            {/* Top 3 Podium Cards */}
            {session.leaderboard && session.leaderboard.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {/* 2nd Place */}
                {session.leaderboard[1] && (
                  <div className="bg-gradient-to-b from-slate-100 to-white rounded-3xl p-5 border-2 border-slate-300 text-center flex flex-col justify-between order-2 md:order-1 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-inner">
                        <Medal className="w-6 h-6 text-slate-600 fill-slate-300" />
                      </div>
                      <span className="inline-block bg-slate-200 text-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        2nd Place • Silver
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[1].student_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{session.leaderboard[1].student_reg} • {session.leaderboard[1].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Rank</span>
                        <strong className="text-slate-900 font-mono font-black text-sm">#{session.leaderboard[1].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
                        <strong className="text-slate-900 font-mono font-black text-sm">{session.leaderboard[1].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place Champion */}
                {session.leaderboard[0] && (
                  <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-3 border-amber-400 text-center flex flex-col justify-between order-1 md:order-2 shadow-lg shadow-amber-500/10 scale-102 transition-transform">
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                        <Crown className="w-8 h-8 text-amber-950 fill-amber-950" />
                      </div>
                      <span className="inline-block bg-amber-200 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        1st Place Champion • Gold 🥇
                      </span>
                      <h3 className="font-black text-slate-900 text-lg line-clamp-1">{session.leaderboard[0].student_name}</h3>
                      <p className="text-xs text-amber-900 font-semibold">{session.leaderboard[0].student_reg} • {session.leaderboard[0].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200 flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Avg Rank</span>
                        <strong className="text-amber-950 font-mono font-black text-base">#{session.leaderboard[0].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Total Points</span>
                        <strong className="text-amber-950 font-mono font-black text-base">{session.leaderboard[0].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {session.leaderboard[2] && (
                  <div className="bg-gradient-to-b from-orange-50/60 to-white rounded-3xl p-5 border-2 border-amber-500/70 text-center flex flex-col justify-between order-3 md:order-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mx-auto shadow-inner">
                        <Award className="w-6 h-6 text-amber-700 fill-amber-500" />
                      </div>
                      <span className="inline-block bg-orange-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        3rd Place • Bronze 🥉
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{session.leaderboard[2].student_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{session.leaderboard[2].student_reg} • {session.leaderboard[2].student_department}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-orange-200 flex justify-around text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Rank</span>
                        <strong className="text-slate-900 font-mono font-black text-sm">#{session.leaderboard[2].average_rank}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
                        <strong className="text-slate-900 font-mono font-black text-sm">{session.leaderboard[2].total_points}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Your Standing Spotlight & Reward Button */}
            {myRank && (
              <div className="p-4 bg-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-indigo-800">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                    #{myRank}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Your Official Outcome</span>
                    <h4 className="text-base font-extrabold">
                      {isTopThree ? 'Outstanding! You placed on the GD Podium!' : 'Group Discussion Participation Completed'}
                    </h4>
                    <p className="text-xs text-indigo-200">
                      Cohort Rank #{myRank} among {session.leaderboard?.length || 0} participants
                    </p>
                  </div>
                </div>

                {isTopThree && (
                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Open Podium Trophy 🎉</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Detailed Question-by-Question Rank Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Individual Question Rank Performance Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Each student's position across all discussion questions as evaluated by peers.
                </p>
              </div>

              {/* View toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start">
                <button
                  onClick={() => setLeaderboardTab('OVERALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    leaderboardTab === 'OVERALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All Questions
                </button>
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setLeaderboardTab(q.id)}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      leaderboardTab === q.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Overall Rank</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Reg No & Dept</th>
                    <th className="py-3 px-3">Avg Rank</th>
                    {questions.map((q, idx) => (
                      <th key={q.id} className="py-3 px-2 text-center">
                        Q{idx + 1} Rank
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {session.leaderboard?.map((entry) => {
                    const isMe = entry.student_id === currentStudentId;
                    return (
                      <tr
                        key={entry.student_id}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-amber-50/70 font-bold border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Overall Rank */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono font-black text-xs ${
                              entry.rank === 1
                                ? 'bg-amber-400 text-slate-950 shadow-xs'
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

                        {/* Student Name */}
                        <td className="py-3.5 px-3 text-slate-900 font-extrabold">
                          <div className="flex items-center space-x-2">
                            <span>{entry.student_name}</span>
                            {isMe && (
                              <span className="bg-amber-200 text-amber-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reg & Dept */}
                        <td className="py-3.5 px-3 text-slate-500">
                          <span>{entry.student_reg}</span>
                          <span className="text-slate-400 block text-[10px]">{entry.student_department}</span>
                        </td>

                        {/* Average Rank */}
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                          #{entry.average_rank}
                        </td>

                        {/* Question Ranks Breakdown */}
                        {questions.map((q) => {
                          const qRankData = entry.question_ranks?.[q.id];
                          const pos = qRankData?.rank_position;
                          return (
                            <td key={q.id} className="py-3.5 px-2 text-center">
                              {pos ? (
                                <span
                                  className={`inline-block px-2 py-1 rounded-lg font-mono font-bold text-[11px] ${
                                    pos === 1
                                      ? 'bg-amber-100 text-amber-900 font-black'
                                      : pos === 2
                                      ? 'bg-slate-100 text-slate-800'
                                      : pos === 3
                                      ? 'bg-orange-50 text-amber-800'
                                      : 'bg-slate-50 text-slate-600'
                                  }`}
                                  title={`Q${q.order} Rank #${pos} (Avg Rank: ${qRankData.average_rank})`}
                                >
                                  #{pos}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Points */}
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900">
                          {entry.total_points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Directory Reference Cards */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Discussion Questions Reference</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-white rounded-2xl border border-slate-200 text-xs">
                  <span className="font-black text-indigo-600 mr-2">Question {idx + 1}:</span>
                  <span className="font-medium text-slate-800">{q.question_text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : hasSubmitted ? (
        /* =========================================================================
           STAGE 3: WAITING FOR ADMIN TO REVEAL OFFICIAL RESULTS
           ========================================================================= */
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center space-y-6 shadow-sm animate-fade-in max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-amber-100 text-amber-900 text-xs font-black uppercase px-3 py-1 rounded-full">
              Rankings Submitted • Sealed 🔒
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Awaiting Official Result Reveal
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your peer evaluations have been recorded. Once all participants finish ranking, your instructor/admin will press the button to calculate and reveal the final standings.
            </p>
          </div>

          {/* Peer Completion Counter Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Cohort Peer Evaluations</span>
              </span>
              <span className="font-mono text-indigo-600 font-extrabold">
                {session.submitted_evaluations_count || 1} / {session.participant_count || 1} Submitted
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
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

            <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center space-x-1">
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              <span>Live polling active. Results will appear here instantly when published!</span>
            </p>
          </div>

          {/* Participants Roster List */}
          <div className="text-left border-t border-slate-100 pt-5 max-w-md mx-auto space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">Current Participants in Room:</h4>
            <div className="space-y-1.5">
              {session.participants?.map((p) => {
                const isPeerSubmitted = p.status === 'EVALUATION_SUBMITTED';
                const isMe = p.student_id === currentStudentId;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {p.student_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {p.student_name} {isMe && <span className="text-indigo-600 font-black">(You)</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">{p.student_reg}</p>
                      </div>
                    </div>
                    {isPeerSubmitted ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Ranking peers...</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : peers.length === 0 ? (
        /* =========================================================================
           STAGE 1: WAITING FOR PEERS TO JOIN ROOM
           ========================================================================= */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-6 shadow-sm max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-indigo-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Waiting for Peers to Join...</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              At least 2 participants must join before peer rankings can begin. Share this room's 6-digit Join PIN with your cohort.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl inline-flex flex-col items-center space-y-2">
            <span className="text-[10px] font-bold uppercase text-amber-800">Join PIN</span>
            <span className="text-3xl font-mono font-black text-amber-950 tracking-widest">{session.pin}</span>
            <button
              onClick={handleCopyPin}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center space-x-1 cursor-pointer"
            >
              {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPin ? 'Copied!' : 'Copy PIN'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-semibold flex items-center justify-center space-x-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <span>Checking for new participants every 4 seconds...</span>
          </div>
        </div>
      ) : (
        /* =========================================================================
           STAGE 2: ACTIVE PEER EVALUATION & RANKING
           ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          
          {/* Instructions Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">How Peer Ranking Works:</h4>
                <p className="text-xs text-slate-500">
                  Assign ranks <strong className="text-slate-800">1 to {peers.length}</strong> to each peer for every question based on their performance and arguments.
                </p>
              </div>
            </div>

            {/* Questions progress counter */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Evaluation Progress</span>
              <span className="text-xs font-black text-indigo-600">
                {questions.filter(q => isQuestionValid(q.id)).length} of {questions.length} Questions Completed
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
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : valid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
              
              {/* Question Header */}
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </span>
                  {isQuestionValid(currentQuestion.id) ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>All {peers.length} Peers Ranked Validly ✓</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Assign unique ranks (1 to {peers.length})
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {currentQuestion.question_text}
                </h3>
              </div>

              {/* Peers List with Interactive Rank Buttons */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select rank for each peer candidate:
                </p>

                {peers.map((peer) => {
                  const assignedRank = rankingsState[currentQuestion.id]?.[peer.student_id];

                  return (
                    <div
                      key={peer.student_id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        assignedRank
                          ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Peer info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                          {peer.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{peer.student_name}</p>
                          <p className="text-xs text-slate-400">
                            {peer.student_reg} • {peer.student_department}
                          </p>
                        </div>
                      </div>

                      {/* Rank Selector Buttons */}
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="text-[11px] font-bold text-slate-400 mr-1.5">Rank:</span>
                        {Array.from({ length: peers.length }, (_, i) => i + 1).map((r) => {
                          const isSelected = assignedRank === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleAssignRank(currentQuestion.id, peer.student_id, r)}
                              className={`w-9 h-9 rounded-xl font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? r === 1
                                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 shadow-md scale-105'
                                    : r === 2
                                    ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-300/50 shadow-md scale-105'
                                    : r === 3
                                    ? 'bg-orange-300 text-amber-950 ring-2 ring-orange-300/50 shadow-md scale-105'
                                    : 'bg-indigo-600 text-white shadow-md scale-105'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Question</span>
                </button>

                {activeQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-slate-800 cursor-pointer flex items-center space-x-1"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-bold">Final Question</span>
                )}
              </div>

            </div>
          )}

          {/* Submit Evaluations Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold">Ready to Lock & Submit Evaluations?</h3>
              <p className="text-xs text-indigo-200">
                Ensure all {questions.length} questions have unique ranks for all peers. Once submitted, rankings cannot be altered.
              </p>
            </div>

            <button
              onClick={handleSubmitEvaluations}
              disabled={submitting || !isAllEvaluationsValid}
              className={`px-7 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 ${
                isAllEvaluationsValid
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-400/25 cursor-pointer transform hover:scale-105 active:scale-95 animate-pulse'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Rankings...</span>
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

      {/* Gift Burst Celebration Modal for Podium Achievers */}
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
