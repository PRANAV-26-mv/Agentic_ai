import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Copy, 
  Check, 
  Award, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Layers, 
  Cpu, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Lock,
  ArrowLeft,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface PromptMistake {
  id: string;
  category: 'CLARITY' | 'CONSTRAINTS' | 'PERSONA' | 'FORMAT' | 'SECURITY';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  penaltyMarks: number;
  howToFix: string;
}

interface EvaluationResult {
  score: number | null;
  grade: 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'PENDING';
  metrics?: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  } | null;
  mistakes: PromptMistake[];
  strengths: string[];
  suggestions: string[];
  improvedPrompt: string | null;
  summaryFeedback: string;
  engineUsed: 'GEMINI_AI' | 'HEURISTIC_RULE_ENGINE';
  isResultsPublished?: boolean;
  statusMessage?: string;
}

interface PromptSession {
  id: string;
  title: string;
  description: string;
  task_objective?: string;
  target_community?: string;
  target_department?: string;
  target_year?: number;
  status: string;
  results_published: boolean;
  created_at: string;
}

interface PastSubmission {
  id: string;
  session_id: string;
  session_title?: string;
  session_published?: boolean;
  score: number | null;
  grade: string;
  submitted_prompt: string;
  metrics?: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  } | null;
  mistakes: PromptMistake[];
  strengths?: string[];
  suggestions?: string[];
  improved_prompt?: string | null;
  summary_feedback?: string;
  created_at: string;
}

export const StudentPromptEvaluator: React.FC = () => {
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'CHALLENGES' | 'HISTORY'>('CHALLENGES');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
    fetchPastSubmissions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get('/prompt-evaluator/sessions');
      setSessions(res.data);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchPastSubmissions = async () => {
    try {
      const res = await api.get('/prompt-evaluator/my-submissions');
      setPastSubmissions(res.data);
    } catch (err: any) {
      console.error('Failed to load past submissions:', err);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setErrorMsg('');
    setIsResubmitting(false);

    // If student already has a submission for this session, load its prompt
    const existing = pastSubmissions.find(s => s.session_id === sessionId);
    if (existing) {
      setPromptText(existing.submitted_prompt);
    } else {
      setPromptText('');
      setEvaluation(null);
    }
  };

  const handleEvaluate = async () => {
    if (!promptText.trim()) {
      setErrorMsg('Please enter or paste your engineered prompt before submitting.');
      return;
    }
    if (!selectedSessionId) {
      setErrorMsg('Please select a session to evaluate.');
      return;
    }
    setErrorMsg('');
    setEvaluating(true);

    try {
      const res = await api.post('/prompt-evaluator/evaluate', {
        sessionId: selectedSessionId,
        prompt: promptText
      });

      setEvaluation(res.data.evaluation);
      setIsResubmitting(false);

      // Trigger celebratory confetti if results are published and score is 80+
      if (res.data.isResultsPublished && res.data.evaluation?.score && res.data.evaluation.score >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Refresh submissions list
      await fetchPastSubmissions();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Prompt evaluation failed. Please check your connection.');
    } finally {
      setEvaluating(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);
  const currentSubmission = pastSubmissions.find(s => s.session_id === selectedSessionId);

  // Determine if results are released for current session
  const isReleased = Boolean(currentSession?.results_published || currentSubmission?.session_published || evaluation?.isResultsPublished);

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-yellow-500/30';
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  const getMetricColor = (val: number) => {
    if (val >= 16) return 'bg-emerald-500';
    if (val >= 12) return 'bg-blue-500';
    if (val >= 8) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white border border-indigo-800/50 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Automated Prompt Engineering Evaluator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Prompt Challenges & Evaluator
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select an official session created by the administrator to open your workspace, craft your prompt, and submit for automated evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 backdrop-blur-sm self-start md:self-auto">
            <button
              onClick={() => {
                setActiveTab('CHALLENGES');
                setSelectedSessionId(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'CHALLENGES'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              My Submissions ({pastSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'CHALLENGES' ? (
        <>
          {/* STEP 1: SESSIONS LIST (Shown when no session is clicked) */}
          {!selectedSessionId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Available Challenge Sessions Created by Admin
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click on a session below to open the prompt submission area.
                  </p>
                </div>
                <button
                  onClick={fetchSessions}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingSessions ? (
                <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
                  Loading active challenge sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No Active Sessions Available
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The administrator has not created any prompt challenges yet. Please check back when a challenge is scheduled.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sessions.map((s) => {
                    const sub = pastSubmissions.find(p => p.session_id === s.id);
                    const hasSubmitted = Boolean(sub);
                    const released = Boolean(s.results_published || sub?.session_published);

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/80 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              Dept: {s.target_department || 'ALL'}
                            </span>

                            {released ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Award className="w-3 h-3" />
                                Results Released
                              </span>
                            ) : hasSubmitted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Lock className="w-3 h-3" />
                                Results Locked
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Active Challenge
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {s.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                              {s.task_objective || s.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {hasSubmitted ? 'Already attempted' : 'Ready to attempt'}
                          </span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            {hasSubmitted ? (released ? 'View Results' : 'View Submission') : 'Open & Paste Prompt'}
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PARTICULAR SESSION VIEW (Only shown when student clicked a session!) */
            currentSession && (
              <div className="space-y-6">
                {/* Back Button & Session Title Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to All Sessions
                    </button>

                    <div className="flex items-center gap-2">
                      {isReleased ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Award className="w-3.5 h-3.5" />
                          Official Final Results Released by Admin
                        </span>
                      ) : currentSubmission ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Lock className="w-3.5 h-3.5" />
                          Evaluation Locked (Awaiting Admin Release)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                          Ready for Submission
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentSession.title}
                    </h2>
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-indigo-950 dark:text-indigo-200 block mb-1">Challenge Objective & Rubric:</strong>
                      {currentSession.task_objective || currentSession.description}
                    </div>
                  </div>
                </div>

                {/* WORKSPACE AREA: Either Paste Area OR Results Area */}
                {(!currentSubmission || isResubmitting) ? (
                  /* PASTE AREA - ONLY DISPLAYED FOR THIS SELECTED SESSION */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Paste Your Prompt for: "{currentSession.title}"
                          </label>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {promptText.length} chars • ~{Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 1.3)} tokens
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            rows={12}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Paste your engineered prompt here... E.g.
'You are an expert AI software engineer. Analyze the code provided strictly within triple backticks (```input```). Identify bugs, security flaws, and performance bottlenecks.
Constraints:
- Do not make speculative assumptions.
- Format response strictly as JSON with fields: status, vulnerabilities, and fixed_code...'"
                            className="w-full text-xs md:text-sm font-mono bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                          />
                        </div>

                        {errorMsg && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setPromptText('')}
                              disabled={!promptText || evaluating}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              Clear
                            </button>
                            {isResubmitting && (
                              <button
                                type="button"
                                onClick={() => setIsResubmitting(false)}
                                className="text-xs text-slate-500 hover:underline"
                              >
                                Cancel Edit
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleEvaluate}
                            disabled={evaluating || !promptText.trim()}
                            className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {evaluating ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Submitting & Evaluating...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                {isResubmitting ? 'Update Submission' : 'Submit Prompt for Evaluation'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Best Practices Side Guide */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-3">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Key Evaluation Criteria:
                        </p>
                        <ul className="space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                          <li><strong className="text-indigo-600 dark:text-indigo-400">1. Persona Framing:</strong> Start by giving the model a precise role (e.g. "You are a Senior SecOps Analyst").</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">2. Negative Constraints:</strong> Explicitly state what the model must NEVER do (e.g., "Never fabricate data").</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">3. Format Specification:</strong> Require structured schemas (JSON, tables, or numbered lists).</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400">4. Input Isolation:</strong> Enclose user queries in delimiters (` ``` `) to prevent prompt injection.</li>
                        </ul>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                          Note: Once submitted, evaluation results will be locked until released by the administrator.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* POST-SUBMISSION VIEW: LOCKED OR RELEASED */
                  <div className="space-y-6">
                    {/* IF NOT RELEASED YET: ALL RESULTS (SCORE, GRADE, MISTAKES, CORRECTED PROMPT) ARE LOCKED */}
                    {!isReleased ? (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                              <Lock className="w-8 h-8 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  All Results Locked 🔒
                                </span>
                                <span className="text-xs font-semibold text-slate-400">
                                  Under Administrator Review
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Prompt Evaluated & Safely Registered
                              </h3>
                              <p className="text-xs text-slate-500">
                                Submitted on: {new Date(currentSubmission.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsResubmitting(true)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Resubmit Prompt
                          </button>
                        </div>

                        {/* Locked Explanation Notice */}
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-amber-500" />
                            What is currently locked?
                          </div>
                          <p className="leading-relaxed">
                            Your <strong>numerical score</strong>, <strong>letter grade</strong>, <strong>identified mistakes/penalties</strong>, and the <strong>AI-corrected prompt revision</strong> are temporarily locked. When the Administrator presses the <strong>"Launch & Release Final Results"</strong> button, all of these will be unlocked here simultaneously and sent to your email!
                          </p>
                        </div>

                        {/* Submitted Prompt Preview (Read Only) */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Your Submitted Prompt:
                          </label>
                          <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                            {currentSubmission.submitted_prompt}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* IF RELEASED: ALL THE THINGS SHOW (SCORE, GRADE, MISTAKES, AND CORRECTED PROMPT) */
                      <div className="space-y-6">
                        {/* Score & Grade Released Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                                <div className="text-center">
                                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                    {currentSubmission.score ?? evaluation?.score}
                                  </span>
                                  <span className="block text-[10px] font-bold text-slate-400">/ 100</span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase tracking-wider ${getGradeBadge(currentSubmission.grade || evaluation?.grade || 'C')}`}>
                                    Grade {currentSubmission.grade || evaluation?.grade}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-400">
                                    Official Final Result
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Released by Super Administrator
                                </p>
                              </div>
                            </div>

                            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                              <Award className="w-4 h-4 text-emerald-500" />
                              <div>
                                <div>Final Results Released</div>
                                <div className="text-[10px] font-normal opacity-80">Official score and mistake analysis unlocked</div>
                              </div>
                            </div>
                          </div>

                          {/* 5-Dimensional Metrics Breakdown */}
                          {(currentSubmission.metrics || evaluation?.metrics) && (
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Dimension Breakdown (Out of 20 each)
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { label: 'Clarity & Specificity', val: (currentSubmission.metrics || evaluation?.metrics)!.clarityAndSpecificity },
                                  { label: 'Persona & Role', val: (currentSubmission.metrics || evaluation?.metrics)!.personaAndRole },
                                  { label: 'Constraints & Rules', val: (currentSubmission.metrics || evaluation?.metrics)!.constraintsAndGuardrails },
                                  { label: 'Output Formatting', val: (currentSubmission.metrics || evaluation?.metrics)!.outputFormatting },
                                  { label: 'Security & Injection Guard', val: (currentSubmission.metrics || evaluation?.metrics)!.securityAndRobustness, fullSpan: true },
                                ].map((m, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 ${m.fullSpan ? 'sm:col-span-2' : ''}`}
                                  >
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="text-slate-700 dark:text-slate-300">{m.label}</span>
                                      <span className="font-mono text-slate-900 dark:text-white">{m.val}/20</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-700 ${getMetricColor(m.val)}`}
                                        style={{ width: `${(m.val / 20) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* DETECTED MISTAKES CARD (SHOWN WHEN RELEASED) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              Detected Mistakes & Flaws ({((currentSubmission.mistakes || evaluation?.mistakes) || []).length})
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              Total penalties: -{((currentSubmission.mistakes || evaluation?.mistakes) || []).reduce((acc, m) => acc + m.penaltyMarks, 0)} pts
                            </span>
                          </div>

                          {((currentSubmission.mistakes || evaluation?.mistakes) || []).length === 0 ? (
                            <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                Flawless Prompt Execution!
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                No critical omissions, missing constraints, or injection vulnerabilities were detected.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {((currentSubmission.mistakes || evaluation?.mistakes) || []).map((mistake, idx) => (
                                <div 
                                  key={mistake.id || idx}
                                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-2.5"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                        mistake.severity === 'CRITICAL'
                                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                          : mistake.severity === 'WARNING'
                                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                      }`}>
                                        {mistake.severity}
                                      </span>
                                      <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                                        {mistake.category}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                        {mistake.title}
                                      </h4>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-rose-500 shrink-0">
                                      -{mistake.penaltyMarks} pts
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {mistake.description}
                                  </p>

                                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-semibold">How to Fix: </strong>
                                      {mistake.howToFix}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CORRECTED / IMPROVED PROMPT REVISION (SHOWN WHEN RELEASED) */}
                        {(currentSubmission.improved_prompt || evaluation?.improvedPrompt) && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                Corrected & Enhanced AI Prompt Revision
                              </h3>
                              <button
                                type="button"
                                onClick={() => copyText(currentSubmission.improved_prompt || evaluation?.improvedPrompt || '')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-1.5"
                              >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Copy Corrected Prompt'}
                              </button>
                            </div>

                            <p className="text-xs text-slate-500">
                              Here is the corrected prompt revision incorporating all required constraints, role framing, and input delimiters:
                            </p>

                            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                              {currentSubmission.improved_prompt || evaluation?.improvedPrompt}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Prompt Submissions & Evaluated Challenges
              </h2>
              <p className="text-xs text-slate-500">
                View your historical submissions and official release statuses.
              </p>
            </div>
            <button
              onClick={fetchPastSubmissions}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {pastSubmissions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No prompt submissions recorded yet. Click on any challenge session to paste and submit your prompt!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pastSubmissions.map((sub) => (
                <div key={sub.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {sub.session_title || 'Prompt Session'}
                        </span>
                        {sub.session_published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Award className="w-3 h-3" />
                            Results Released
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Lock className="w-3 h-3" />
                            Results Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>

                    {sub.session_published && sub.score !== null ? (
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-wider ${getGradeBadge(sub.grade)}`}>
                          Grade {sub.grade}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {sub.score}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Results Locked
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Awaiting Admin Release
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {sub.submitted_prompt}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {sub.session_published ? `${sub.mistakes?.length || 0} mistakes identified.` : 'All evaluation details locked.'}
                    </span>
                    <button
                      onClick={() => {
                        handleSelectSession(sub.session_id);
                        setActiveTab('CHALLENGES');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Open Session Workspace
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPromptEvaluator;
