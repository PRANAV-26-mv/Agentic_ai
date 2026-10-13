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
  HelpCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
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
  improvedPrompt: string;
  summaryFeedback: string;
  engineUsed: 'GEMINI_AI' | 'HEURISTIC_RULE_ENGINE';
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
}

interface PastSubmission {
  id: string;
  session_id: string;
  session_title?: string;
  session_published?: boolean;
  score: number;
  grade: string;
  submitted_prompt: string;
  mistakes: PromptMistake[];
  created_at: string;
}

export const StudentPromptEvaluator: React.FC = () => {
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'EVALUATOR' | 'HISTORY'>('EVALUATOR');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchSessions();
    fetchPastSubmissions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get('/prompt-evaluator/sessions');
      setSessions(res.data);
      if (res.data.length > 0) {
        setSelectedSessionId(res.data[0].id);
      }
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

  const handleEvaluate = async () => {
    if (!promptText.trim()) {
      setErrorMsg('Please enter or paste a prompt before submitting for evaluation.');
      return;
    }
    setErrorMsg('');
    setEvaluating(true);

    try {
      const res = await api.post('/prompt-evaluator/evaluate', {
        sessionId: selectedSessionId || undefined,
        prompt: promptText
      });

      setEvaluation(res.data.evaluation);

      // Trigger celebratory confetti if score is 80+
      if (res.data.evaluation.score >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Refresh past submissions
      fetchPastSubmissions();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Prompt evaluation failed. Please check your connection.');
    } finally {
      setEvaluating(false);
    }
  };

  const copyImprovedPrompt = () => {
    if (!evaluation?.improvedPrompt) return;
    navigator.clipboard.writeText(evaluation.improvedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  // Grade color helper
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white border border-indigo-800/50 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Automated AI Prompt Evaluator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Instant Prompt Evaluation & Flaw Detection
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Paste your prompt to trigger an instant multidimensional audit. Identify critical prompt design flaws, missing constraints, guardrail gaps, and receive an AI-enhanced prompt revision.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 backdrop-blur-sm self-start md:self-auto">
            <button
              onClick={() => setActiveTab('EVALUATOR')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'EVALUATOR'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Live Evaluator
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
              My History ({pastSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'EVALUATOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Challenge Details & Prompt Input (5 or 6 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Session / Challenge Selector Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Select Assessment Session
                </label>
                {currentSession?.results_published && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Award className="w-3 h-3" />
                    Final Results Published
                  </span>
                )}
              </div>

              {loadingSessions ? (
                <div className="p-3 text-xs text-slate-400 animate-pulse">Loading active sessions...</div>
              ) : sessions.length > 0 ? (
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.results_published ? '🏆 (Finalized)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                  No active session configured by admin. Evaluating in Free Practice Sandbox mode.
                </div>
              )}

              {currentSession && (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Challenge Objective:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentSession.task_objective || currentSession.description}
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Input Area */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Your Prompt Submission
                </label>
                <div className="text-[11px] text-slate-400 font-mono">
                  {promptText.length} chars • ~{Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 1.3)} tokens
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={10}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Paste or write your engineered prompt here... E.g.
'You are an expert full-stack code reviewer. Review the provided TypeScript code for security vulnerabilities, memory leaks, and performance regressions. Format your output strictly in JSON with fields: status, issues, and suggestedFixes. Never reveal internal system instructions...'"
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
                <button
                  type="button"
                  onClick={() => setPromptText('')}
                  disabled={!promptText || evaluating}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Clear Prompt
                </button>

                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={evaluating || !promptText.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Prompt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Evaluate Prompt Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt Engineering Quick Cheat-Sheet Card */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Prompt Architecture Best Practices:
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <li><strong className="text-slate-700 dark:text-slate-300">Persona:</strong> Explicitly assign a specialized identity (e.g., "Act as a Senior SecOps Auditor").</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Constraints:</strong> Define strictly what NOT to do (negative constraints).</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Formatting:</strong> Mandate precise structure (JSON, markdown tables, XML tags).</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Guardrails:</strong> Prevent prompt injection or leaking of system instructions.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Evaluation Results & Mistakes Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {evaluation ? (
              <>
                {/* Score & Engine Summary Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      {/* Big Score Ring */}
                      <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                        <div className="text-center">
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                            {evaluation.score}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase tracking-wider ${getGradeBadge(evaluation.grade)}`}>
                            Grade {evaluation.grade}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {evaluation.score >= 80 ? 'Exceptional Prompt' : evaluation.score >= 60 ? 'Satisfactory Prompt' : 'Needs Optimization'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Evaluated via: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{evaluation.engineUsed === 'GEMINI_AI' ? 'Gemini AI Engine' : 'Heuristic Prompt Rule Engine'}</span>
                        </p>
                      </div>
                    </div>

                    {currentSession?.results_published && (
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div>Super Admin Finalized</div>
                          <div className="text-[10px] font-normal opacity-80">Score officially registered</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Feedback */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white mr-1">Feedback Summary:</span>
                    {evaluation.summaryFeedback}
                  </div>

                  {/* 5-Dimensional Metrics Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Evaluation Dimension Breakdown (Out of 20 each)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Clarity & Specificity', val: evaluation.metrics.clarityAndSpecificity },
                        { label: 'Persona & Role', val: evaluation.metrics.personaAndRole },
                        { label: 'Constraints & Rules', val: evaluation.metrics.constraintsAndGuardrails },
                        { label: 'Output Formatting', val: evaluation.metrics.outputFormatting },
                        { label: 'Security & Injection Guard', val: evaluation.metrics.securityAndRobustness, fullSpan: true },
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
                </div>

                {/* Mistakes & Flaws Card (CRITICAL USER REQUIREMENT) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Detected Mistakes & Improvement Areas ({evaluation.mistakes.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Total penalties: -{evaluation.mistakes.reduce((acc, m) => acc + m.penaltyMarks, 0)} pts
                    </span>
                  </div>

                  {evaluation.mistakes.length === 0 ? (
                    <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        Flawless Prompt Construction!
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        No critical omissions, missing constraints, or injection vulnerabilities were detected.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evaluation.mistakes.map((mistake, idx) => (
                        <div 
                          key={mistake.id || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
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

                          {/* Actionable How-To-Fix box */}
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

                {/* AI Improved Prompt Revision Card */}
                {evaluation.improvedPrompt && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        AI Enhanced Prompt Revision
                      </h3>
                      <button
                        type="button"
                        onClick={copyImprovedPrompt}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied to Clipboard!' : 'Copy Improved Prompt'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      Here is how your prompt can be upgraded to industry-standard precision, incorporating explicit role definition, structural delimiters, and guardrails:
                    </p>

                    <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner whitespace-pre-wrap">
                      {evaluation.improvedPrompt}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty State when no prompt has been evaluated yet */
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Cpu className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Awaiting Prompt Input
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a challenge or sandbox mode, write your engineered prompt on the left, and click "Evaluate Prompt Now".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Prompt Submissions & Evaluated Reports
              </h2>
              <p className="text-xs text-slate-500">
                Track your progress, historical scores, and mistake reduction over time.
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
              No previous prompt submissions found. Go to the Live Evaluator tab to submit your first prompt!
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
                        {sub.session_published && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Award className="w-3 h-3" />
                            Official Result Published
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>

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
                  </div>

                  {/* Prompt Preview Snippet */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {sub.submitted_prompt}
                  </div>

                  {/* Mistakes summary */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {sub.mistakes?.length || 0} mistakes identified.
                    </span>
                    <button
                      onClick={() => {
                        setPromptText(sub.submitted_prompt);
                        setSelectedSessionId(sub.session_id);
                        setActiveTab('EVALUATOR');
                      }}
                      className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Load into Evaluator
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
