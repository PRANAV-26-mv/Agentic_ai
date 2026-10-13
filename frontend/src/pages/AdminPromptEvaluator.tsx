import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Send, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Mail, 
  Bell, 
  Users, 
  FileText, 
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  ChevronRight, 
  Clock, 
  Check, 
  X,
  ShieldCheck,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface PromptMistake {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  penaltyMarks: number;
  howToFix: string;
}

interface PromptSubmission {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_reg: string;
  student_department?: string;
  student_year?: number;
  submitted_prompt: string;
  score: number;
  grade: 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';
  metrics: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  };
  mistakes: PromptMistake[];
  strengths: string[];
  suggestions: string[];
  improved_prompt: string;
  summary_feedback: string;
  engine_used: string;
  is_published: boolean;
  published_at?: string;
  notification_sent: boolean;
  email_sent: boolean;
  created_at: string;
}

interface PromptSession {
  id: string;
  title: string;
  description: string;
  task_objective?: string;
  target_community?: string;
  target_department?: string;
  target_year?: number;
  status: 'DRAFT' | 'ACTIVE' | 'EVALUATED' | 'PUBLISHED' | 'ARCHIVED';
  results_published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
}

export const AdminPromptEvaluator: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [submissions, setSubmissions] = useState<PromptSubmission[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [inspectSubmission, setInspectSubmission] = useState<PromptSubmission | null>(null);
  const [showLaunchConfirmModal, setShowLaunchConfirmModal] = useState<boolean>(false);

  // Form states for creating session
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTaskObjective, setNewTaskObjective] = useState<string>('');
  const [newTargetDept, setNewTargetDept] = useState<string>('ALL');
  const [newTargetComm, setNewTargetComm] = useState<string>('ALL');
  const [submittingSession, setSubmittingSession] = useState<boolean>(false);

  // Launching results state
  const [launching, setLaunching] = useState<boolean>(false);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string>('');
  const [launchErrorMsg, setLaunchErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSubmissions(selectedSessionId);
    } else {
      setSubmissions([]);
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get('/prompt-evaluator/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(res.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch prompt sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSubmissions = async (sessionId: string) => {
    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/prompt-evaluator/sessions/${sessionId}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch (err: any) {
      console.error('Failed to fetch session submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmittingSession(true);
    try {
      const res = await api.post('/prompt-evaluator/sessions', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        task_objective: newTaskObjective.trim(),
        target_department: newTargetDept,
        target_community: newTargetComm
      });

      setSessions([res.data, ...sessions]);
      setSelectedSessionId(res.data.id);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewTaskObjective('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create challenge session');
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleLaunchFinalResults = async () => {
    if (!selectedSessionId) return;

    setLaunching(true);
    setLaunchErrorMsg('');
    setLaunchSuccessMsg('');

    try {
      const res = await api.post(`/prompt-evaluator/sessions/${selectedSessionId}/launch-results`);
      
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setLaunchSuccessMsg(res.data.message || 'Results officially published and broadcasted!');
      setShowLaunchConfirmModal(false);

      // Refresh sessions and submissions
      fetchSessions();
      fetchSubmissions(selectedSessionId);
    } catch (err: any) {
      setLaunchErrorMsg(err.response?.data?.message || 'Failed to launch final results');
    } finally {
      setLaunching(false);
    }
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  // Filter submissions by search
  const filteredSubmissions = submissions.filter(s => {
    const query = searchTerm.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(query) ||
      s.student_reg.toLowerCase().includes(query) ||
      s.student_email.toLowerCase().includes(query) ||
      s.grade.toLowerCase().includes(query)
    );
  });

  // Calculate session metrics
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
    : 0;

  const totalMistakesCount = submissions.reduce((acc, s) => acc + (s.mistakes?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white border border-indigo-800/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Administrative Prompt Engineering Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Prompt Evaluator & Final Results Broadcast
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Create prompt challenges, review student prompt submissions and detected structural mistakes, and launch official final results to automatically dispatch notifications and emails to every student.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Prompt Challenge
            </button>
          </div>
        </div>
      </div>

      {launchSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>{launchSuccessMsg}</span>
          </div>
          <button onClick={() => setLaunchSuccessMsg('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {launchErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs md:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{launchErrorMsg}</span>
          </div>
          <button onClick={() => setLaunchErrorMsg('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Challenge Sessions List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                Prompt Challenges ({sessions.length})
              </h2>
              <button
                onClick={fetchSessions}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingSessions ? (
              <div className="p-4 text-xs text-slate-400 animate-pulse text-center">Loading challenges...</div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No prompt challenges created yet. Click "Create Prompt Challenge" to start!
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => {
                  const isSelected = s.id === selectedSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                          {s.title}
                        </h3>
                        {s.results_published ? (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {s.task_objective || s.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 text-[10px] text-slate-400">
                        <span>Dept: {s.target_department || 'ALL'}</span>
                        <span>•</span>
                        <span>Created: {new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Challenge Details & Submissions Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {currentSession ? (
            <>
              {/* Challenge Overview & SUPER ADMIN LAUNCH ACTION CARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {currentSession.title}
                      </h2>
                      {currentSession.results_published && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Final Results Published
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Target Audience: {currentSession.target_department || 'ALL'} Department • {currentSession.target_community || 'ALL'} Community
                    </p>
                  </div>

                  {/* SUPER ADMIN LAUNCH BUTTON (CRITICAL REQUIREMENT) */}
                  <div className="flex items-center gap-3">
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => setShowLaunchConfirmModal(true)}
                        disabled={launching || submissions.length === 0}
                        className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                          currentSession.results_published
                            ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700'
                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-purple-600/30 hover:opacity-95 animate-pulse'
                        } disabled:opacity-50 disabled:pointer-events-none`}
                      >
                        <Sparkles className="w-4 h-4" />
                        {currentSession.results_published ? 'Re-Broadcast Final Results' : '🚀 Launch Final Results'}
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        Super Admin Authorization Required to Launch
                      </div>
                    )}
                  </div>
                </div>

                {/* Challenge Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Submissions</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{submissions.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Average Score</span>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{avgScore}/100</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Mistakes</span>
                    <p className="text-xl font-black text-amber-500 mt-1">{totalMistakesCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-2">
                      {currentSession.results_published ? '✅ Results Published' : '⏳ Awaiting Launch'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submissions Table Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Student Prompt Submissions ({submissions.length})
                  </h3>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search student, reg no, grade..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {loadingSubmissions ? (
                  <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                    Loading student submissions...
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No submissions recorded yet for this prompt challenge.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                          <th className="py-3 px-3">Student</th>
                          <th className="py-3 px-3">Reg No</th>
                          <th className="py-3 px-3">Score & Grade</th>
                          <th className="py-3 px-3">Mistakes</th>
                          <th className="py-3 px-3">Engine</th>
                          <th className="py-3 px-3">Notifications</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              {sub.student_name}
                              <div className="text-[10px] text-slate-400 font-normal">{sub.student_email}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                              {sub.student_reg}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                  {sub.score}/100
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                                }`}>
                                  {sub.grade}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.mistakes.length === 0 
                                  ? 'bg-emerald-500/10 text-emerald-600' 
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                <AlertTriangle className="w-3 h-3" />
                                {sub.mistakes.length} issues
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[10px] font-mono text-slate-500">
                              {sub.engine_used === 'GEMINI_AI' ? 'Gemini AI' : 'Heuristic'}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                {sub.email_sent ? (
                                  <span className="text-emerald-500 flex items-center gap-0.5" title="Email sent">
                                    <Mail className="w-3 h-3" /> Sent
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-0.5" title="Pending broadcast">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setInspectSubmission(sub)}
                                className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
              Select a prompt challenge on the left or create a new challenge to inspect results.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create Challenge Session */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                Create New Prompt Challenge
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g., Challenge 01: Secure Customer Support Bot Prompt"
                  className="w-full text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the context and domain for students..."
                  className="w-full text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Task Objective & Rubric Requirements
                </label>
                <textarea
                  rows={3}
                  value={newTaskObjective}
                  onChange={(e) => setNewTaskObjective(e.target.value)}
                  placeholder="E.g., Must enforce strict persona, forbid disclosure of credentials, and format response as structured JSON."
                  className="w-full text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={newTargetDept}
                    onChange={(e) => setNewTargetDept(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="AIDS">AI & DS</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Community
                  </label>
                  <select
                    value={newTargetComm}
                    onChange={(e) => setNewTargetComm(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Communities</option>
                    <option value="AI Club">AI Club</option>
                    <option value="Web Developers">Web Developers</option>
                    <option value="Cloud Engineers">Cloud Engineers</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  {submittingSession ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Super Admin Launch & Broadcast Confirmation */}
      {showLaunchConfirmModal && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Launch & Broadcast Final Results
                </h3>
                <p className="text-xs text-slate-500">
                  Super Administrator Dispatch Trigger
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-indigo-900 dark:text-indigo-200">
                You are about to launch final results for:
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                "{currentSession.title}"
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                <li><strong className="text-slate-800 dark:text-slate-200">{submissions.length} students</strong> will have their scores officially locked and published.</li>
                <li>In-portal notifications will be broadcasted to every student's account.</li>
                <li>Personalized emails containing their score, grade, detected mistakes, penalty marks, and fixes will be delivered.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowLaunchConfirmModal(false)}
                disabled={launching}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchFinalResults}
                disabled={launching}
                className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
              >
                {launching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Broadcasting Results...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Broadcast Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inspect Single Student Submission */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submission Details: {inspectSubmission.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Reg No: {inspectSubmission.student_reg} • Email: {inspectSubmission.student_email}
                </p>
              </div>
              <button onClick={() => setInspectSubmission(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Grade summary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Overall Score</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {inspectSubmission.score} <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                Grade {inspectSubmission.grade}
              </span>
            </div>

            {/* Submitted Prompt Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Submitted Prompt:
              </label>
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                {inspectSubmission.submitted_prompt}
              </div>
            </div>

            {/* Mistakes Breakdown */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Detected Mistakes ({inspectSubmission.mistakes.length}):
              </label>

              {inspectSubmission.mistakes.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                  No critical mistakes found in this prompt.
                </div>
              ) : (
                <div className="space-y-2">
                  {inspectSubmission.mistakes.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-rose-500/10 text-rose-600">
                            {m.severity}
                          </span>
                          {m.title}
                        </span>
                        <span className="font-mono text-rose-500">-{m.penaltyMarks} pts</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{m.description}</p>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        <strong>Fix:</strong> {m.howToFix}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Improved Prompt Revision */}
            {inspectSubmission.improved_prompt && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  AI Improved Prompt Suggestion:
                </label>
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-slate-100 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {inspectSubmission.improved_prompt}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromptEvaluator;
