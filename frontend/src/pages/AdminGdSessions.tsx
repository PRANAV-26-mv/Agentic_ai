import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { GdSession, GdQuestion, GdParticipant, GdLeaderboardEntry } from '../types';
import {
  Users,
  Plus,
  Clock,
  Copy,
  Check,
  Trash2,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  X,
  Sparkles,
  Layers,
  Crown,
  Medal,
  Award,
  Play,
  RotateCcw,
  CheckCheck,
  MessagesSquare,
  Eye,
  Lock,
  Unlock,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Sliders
} from 'lucide-react';

const DEPARTMENTS = ['CS', 'AD', 'IT', 'ECE', 'EEE', 'MECH'];
const COMMUNITIES = [
  'Agentic AI & LLM Optimization',
  'Cloud Computing & DevOps',
  'Full Stack Development',
  'Cybersecurity & Networks',
  'Data Science & Analytics'
];

const DEFAULT_QUESTIONS = [
  'Opening & Problem Definition: Clarity in introducing the core issue',
  'Subject Knowledge & Argumentation: Evidence-based persuasive points',
  'Active Listening & Rebuttals: Courteous and logical counter-arguments',
  'Team Collaboration & Synthesis: Concluding consensus and group leadership'
];

export const AdminGdSessions: React.FC = () => {
  const [sessions, setSessions] = useState<GdSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<GdSession | null>(null);
  const [selectedSessionForLeaderboard, setSelectedSessionForLeaderboard] = useState<GdSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<GdSession | null>(null);

  // Action states
  const [creating, setCreating] = useState<boolean>(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    description: '',
    pin: '',
    max_participants: 5,
    target_type: 'ALL' as 'ALL' | 'DEPARTMENT' | 'COMMUNITY',
    target_department: 'CS',
    target_community: 'Agentic AI & LLM Optimization',
    duration_minutes: 20
  });

  const [formQuestions, setFormQuestions] = useState<string[]>([...DEFAULT_QUESTIONS]);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  const fetchSessions = () => {
    api.get('/gd-sessions')
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load GD sessions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData(prev => ({ ...prev, pin }));
  };

  const handleOpenCreateModal = () => {
    generateRandomPin();
    setFormQuestions([...DEFAULT_QUESTIONS]);
    setFormData({
      title: '',
      topic: '',
      description: '',
      pin: Math.floor(100000 + Math.random() * 900000).toString(),
      max_participants: 5,
      target_type: 'ALL',
      target_department: 'CS',
      target_community: 'Agentic AI & LLM Optimization',
      duration_minutes: 20
    });
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setFormQuestions(prev => [...prev, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (idx: number) => {
    if (formQuestions.length <= 1) {
      alert('A GD session must have at least one evaluation question.');
      return;
    }
    setFormQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Please enter a session title.');
      return;
    }
    if (!formData.topic.trim()) {
      setErrorMsg('Please enter a discussion topic.');
      return;
    }
    if (formQuestions.length === 0) {
      setErrorMsg('Please include at least one evaluation question.');
      return;
    }

    setCreating(true);
    setErrorMsg(null);

    try {
      await api.post('/gd-sessions', {
        title: formData.title.trim(),
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        pin: formData.pin.trim() || undefined,
        max_participants: Number(formData.max_participants) || 5,
        target_type: formData.target_type,
        target_department: formData.target_type === 'DEPARTMENT' ? formData.target_department : undefined,
        target_community: formData.target_type === 'COMMUNITY' ? formData.target_community : undefined,
        duration_minutes: Number(formData.duration_minutes) || 20,
        questions: formQuestions.map((q, i) => ({
          id: `gdq-${i + 1}`,
          question_text: q,
          order: i + 1
        }))
      });

      setShowCreateModal(false);
      setSuccessMsg('GD Session created successfully! Students can now join using the PIN.');
      fetchSessions();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create GD session.');
    } finally {
      setCreating(false);
    }
  };

  // Publish and reveal results
  const handlePublishResults = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (!session.all_students_ranked) {
      const confirmEarly = window.confirm(
        `Not all participants have finished ranking yet (${session.submitted_evaluations_count || 0} of ${session.participant_count || 0} submitted). Are you sure you want to reveal results now?`
      );
      if (!confirmEarly) return;
    }

    setPublishingId(sessionId);
    try {
      const res = await api.put(`/gd-sessions/${sessionId}/publish-results`);
      setSuccessMsg(res.data.message || 'GD results published! Standings are now revealed to all participants.');
      fetchSessions();

      // Open leaderboard modal to view immediately
      const updatedDetails = await api.get(`/gd-sessions/${sessionId}`);
      setSelectedSessionForLeaderboard(updatedDetails.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reveal results.');
    } finally {
      setPublishingId(null);
    }
  };

  // Change session status
  const handleChangeStatus = async (sessionId: string, newStatus: string) => {
    try {
      await api.put(`/gd-sessions/${sessionId}/status`, { status: newStatus });
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update session status.');
    }
  };

  // Delete session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/gd-sessions/${sessionToDelete.id}`);
      setSessionToDelete(null);
      setSuccessMsg('GD session deleted successfully.');
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete GD session.');
    } finally {
      setDeleting(false);
    }
  };

  // Open live roster modal
  const handleOpenRoster = async (session: GdSession) => {
    try {
      const res = await api.get(`/gd-sessions/${session.id}`);
      setSelectedSessionForRoster(res.data);
    } catch (err) {
      setSelectedSessionForRoster(session);
    }
  };

  // Open leaderboard modal
  const handleOpenLeaderboard = async (session: GdSession) => {
    try {
      const res = await api.get(`/gd-sessions/${session.id}`);
      setSelectedSessionForLeaderboard(res.data);
    } catch (err) {
      setSelectedSessionForLeaderboard(session);
    }
  };

  const copyToClipboard = (pinStr: string) => {
    navigator.clipboard.writeText(pinStr);
    setCopiedPin(pinStr);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pin.includes(searchQuery);
    if (!matchesSearch) return false;

    if (filterTab === 'ACTIVE') return s.status === 'ACTIVE';
    if (filterTab === 'SCHEDULED') return s.status === 'SCHEDULED';
    if (filterTab === 'COMPLETED') return s.status === 'COMPLETED' || Boolean(s.is_results_published);
    return true;
  });

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED' || Boolean(s.is_results_published)).length;
  const totalParticipants = sessions.reduce((sum, s) => sum + (s.participant_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <MessagesSquare className="w-6 h-6 text-indigo-600" />
            <span>Group Discussion (GD) Sessions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure participant capacity, define discussion questions, monitor peer rankings, and reveal official standings.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center space-x-2 w-fit transition-transform transform hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Create GD Session</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total GD Rooms</p>
            <p className="text-lg font-black text-slate-900">{sessions.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Active GD Rooms</p>
            <p className="text-lg font-black text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-purple-600 fill-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Results Revealed</p>
            <p className="text-lg font-black text-slate-900">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Participants</p>
            <p className="text-lg font-black text-slate-900">{totalParticipants}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-500'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('SCHEDULED')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'SCHEDULED' ? 'bg-white text-sky-800 shadow-xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'COMPLETED' ? 'bg-white text-purple-800 shadow-xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Revealed ({completedCount})
          </button>
        </div>

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
        <div className="p-16 text-center text-slate-400 text-xs font-bold space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
          <p>Loading GD Sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <MessagesSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">No GD Sessions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by scheduling a new GD session with participant capacity and peer evaluation questions.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-extrabold cursor-pointer"
          >
            Create GD Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((s) => {
            const isCompleted = s.status === 'COMPLETED' || Boolean(s.is_results_published);
            const isLive = s.status === 'ACTIVE';
            const participantCount = s.participant_count || 0;
            const submittedCount = s.submitted_evaluations_count || 0;
            const maxParticipants = s.max_participants || 5;
            const allRanked = s.all_students_ranked;

            return (
              <div
                key={s.id}
                className={`bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 border ${
                  isCompleted
                    ? 'border-purple-200'
                    : isLive
                    ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/10'
                    : 'border-slate-200'
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
                        <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>LIVE GD</span>
                        </span>
                      ) : (
                        <span className="bg-sky-100 text-sky-800 font-black text-[10px] px-2.5 py-1 rounded-full">
                          SCHEDULED
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => copyToClipboard(s.pin)}
                      title="Click to copy PIN"
                      className="inline-flex items-center space-x-1 text-xs font-mono font-black text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      <span>PIN: {s.pin}</span>
                      {copiedPin === s.pin ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-amber-700" />
                      )}
                    </button>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words line-clamp-1">
                      {s.title}
                    </h3>
                    <p className="text-xs font-bold text-indigo-950 mt-1 line-clamp-2 break-words bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                      <strong>Topic:</strong> {s.topic}
                    </p>
                  </div>

                  {/* Capacity & Evaluation Progress */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Participant Capacity:</span>
                      <strong className="text-slate-900 font-mono">
                        {participantCount} / {maxParticipants} Students
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Rankings Submitted:</span>
                      <strong className="text-indigo-600 font-mono">
                        {submittedCount} / {participantCount} Ranked
                      </strong>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          allRanked ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((submittedCount / Math.max(1, participantCount)) * 100)
                          )}%`
                        }}
                      />
                    </div>

                    {/* All ranked notification badge */}
                    {allRanked && !isCompleted && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-extrabold flex items-center space-x-1.5 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>All students ranked! Ready to reveal results.</span>
                      </div>
                    )}
                  </div>

                  {/* Details metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{s.duration_minutes} Mins</span>
                    <span>{s.questions?.length || 4} Questions</span>
                    <span className="uppercase font-bold text-slate-600">{s.target_type}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Primary Action: Reveal Results or View Revealed Leaderboard */}
                  {isCompleted ? (
                    <button
                      onClick={() => handleOpenLeaderboard(s)}
                      className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>View Revealed Leaderboard</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublishResults(s.id)}
                      disabled={publishingId === s.id}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md ${
                        allRanked
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-500/20 animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {publishingId === s.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Revealing...</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Publish & Reveal Results</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Secondary Actions: Live Roster & Status Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenRoster(s)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Live Roster ({participantCount})</span>
                    </button>

                    {s.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleChangeStatus(s.id, 'ACTIVE')}
                        title="Start GD Session"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {s.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleChangeStatus(s.id, 'SCHEDULED')}
                        title="Pause Session"
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setSessionToDelete(s)}
                      title="Delete Session"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE GD SESSION MODAL
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Create New GD Session</h3>
                <p className="text-xs text-slate-500">Configure participant capacity, duration, and discussion questions.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Title & Topic */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cohort A - Campus Placement GD"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Discussion Topic *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Will Generative AI displace software engineering jobs or elevate them?"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Instructions / Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Guidelines & Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Each candidate gets 2 mins opening followed by 10 mins open discussion."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Participants Capacity & Duration & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Participants Limit *</span>
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    required
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Number of students who participate and rank peers.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Duration (Mins) *</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 20 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Total discussion time</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase">Join PIN *</label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Randomize
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">6-digit access code</p>
                </div>
              </div>

              {/* Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Target Audience *</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Students (Campus Wide)</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="COMMUNITY">Specific Community</option>
                  </select>
                </div>

                {formData.target_type === 'DEPARTMENT' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Department</label>
                    <select
                      value={formData.target_department}
                      onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.target_type === 'COMMUNITY' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Community</label>
                    <select
                      value={formData.target_community}
                      onChange={(e) => setFormData({ ...formData, target_community: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {COMMUNITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Discussion Evaluation Questions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Evaluation Questions ({formQuestions.length}) *</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Students rank peers for each question</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{q}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                        title="Remove question"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Question Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom evaluation dimension..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end items-center space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: LIVE ROSTER & PEER EVALUATION SUBMISSION MODAL
          ========================================================================= */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">GD Session Roster</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedSessionForRoster.title}</p>
              </div>
              <button
                onClick={() => setSelectedSessionForRoster(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-500 block">Participants Joined</span>
                <strong className="text-indigo-950 font-mono text-sm">
                  {selectedSessionForRoster.participants?.length || 0} / {selectedSessionForRoster.max_participants || 5} Capacity
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-500 block">Evaluations Completed</span>
                <strong className="text-indigo-950 font-mono text-sm">
                  {selectedSessionForRoster.submitted_evaluations_count || 0} Submitted
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Registered Candidates:</h4>
              {(!selectedSessionForRoster.participants || selectedSessionForRoster.participants.length === 0) ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl">
                  No students have joined this GD session yet. Share PIN: {selectedSessionForRoster.pin}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSessionForRoster.participants.map((p) => {
                    const isSubmitted = p.status === 'EVALUATION_SUBMITTED';
                    return (
                      <div
                        key={p.id}
                        className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                            {p.student_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{p.student_name}</p>
                            <p className="text-[11px] text-slate-400">{p.student_reg} • {p.student_department}</p>
                          </div>
                        </div>

                        <div>
                          {isSubmitted ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center space-x-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Rankings Submitted</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSessionForRoster(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REVEALED LEADERBOARD MODAL (WITH QUESTION-BASED RANKS)
          ========================================================================= */}
      {selectedSessionForLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full mb-1">
                  <Trophy className="w-3 h-3 text-purple-700 fill-purple-700" />
                  <span>Official GD Cohort Standing</span>
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedSessionForLeaderboard.title}</h3>
                <p className="text-xs text-slate-500">{selectedSessionForLeaderboard.topic}</p>
              </div>
              <button
                onClick={() => setSelectedSessionForLeaderboard(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Podium */}
            {selectedSessionForLeaderboard.leaderboard && selectedSessionForLeaderboard.leaderboard.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 2nd Place */}
                {selectedSessionForLeaderboard.leaderboard[1] && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center order-2 sm:order-1">
                    <Medal className="w-8 h-8 text-slate-500 mx-auto" />
                    <span className="text-[10px] font-black uppercase text-slate-600 block mt-1">2nd Place</span>
                    <strong className="text-slate-900 text-sm block truncate">
                      {selectedSessionForLeaderboard.leaderboard[1].student_name}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      Avg Rank #{selectedSessionForLeaderboard.leaderboard[1].average_rank}
                    </span>
                  </div>
                )}

                {/* 1st Place */}
                {selectedSessionForLeaderboard.leaderboard[0] && (
                  <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-400 text-center order-1 sm:order-2 shadow-sm">
                    <Crown className="w-9 h-9 text-amber-600 fill-amber-500 mx-auto" />
                    <span className="text-[10px] font-black uppercase text-amber-800 block mt-1">1st Place Champion 🥇</span>
                    <strong className="text-slate-900 text-base block truncate">
                      {selectedSessionForLeaderboard.leaderboard[0].student_name}
                    </strong>
                    <span className="text-xs font-bold text-amber-900">
                      Avg Rank #{selectedSessionForLeaderboard.leaderboard[0].average_rank} • {selectedSessionForLeaderboard.leaderboard[0].total_points} Pts
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {selectedSessionForLeaderboard.leaderboard[2] && (
                  <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-200 text-center order-3 sm:order-3">
                    <Award className="w-8 h-8 text-amber-600 mx-auto" />
                    <span className="text-[10px] font-black uppercase text-amber-800 block mt-1">3rd Place</span>
                    <strong className="text-slate-900 text-sm block truncate">
                      {selectedSessionForLeaderboard.leaderboard[2].student_name}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      Avg Rank #{selectedSessionForLeaderboard.leaderboard[2].average_rank}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Official Leaderboard Table with Question Ranks */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Overall Rank</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Reg & Dept</th>
                    <th className="py-3 px-3">Overall Avg Rank</th>
                    {selectedSessionForLeaderboard.questions?.map((q, idx) => (
                      <th key={q.id} className="py-3 px-2 text-center" title={q.question_text}>
                        Q{idx + 1} Rank
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSessionForLeaderboard.leaderboard?.map((entry) => (
                    <tr key={entry.student_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs">
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{entry.student_name}</td>
                      <td className="py-3 px-3 text-slate-500">{entry.student_reg} • {entry.student_department}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">#{entry.average_rank}</td>
                      {selectedSessionForLeaderboard.questions?.map((q) => {
                        const qr = entry.question_ranks?.[q.id];
                        return (
                          <td key={q.id} className="py-3 px-2 text-center">
                            {qr?.rank_position ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                                #{qr.rank_position}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">{entry.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSessionForLeaderboard(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete GD Session?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800">{sessionToDelete.title}</strong>? All participants and evaluation data will be permanently removed.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
