import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Assessment, Question, AssessmentAttempt, StudentAnswer } from '../types';
import { Clock, ShieldAlert, CheckCircle2, Save, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export const StudentAssessmentTake: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, { selected_option?: string; student_answer?: string }>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSummary, setSubmittedSummary] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or resume assessment attempt
  useEffect(() => {
    if (!id) return;

    api.post(`/assessments/${id}/start`)
      .then(res => {
        const { attempt: att, questions: qList, answers: aList, expired } = res.data;
        if (expired) {
          setSubmittedSummary(att);
          setLoading(false);
          return;
        }

        setAttempt(att);
        setQuestions(qList);
        setTabSwitches(att.tab_switches_count || 0);

        // Populate existing answers
        const ansMap: Record<string, { selected_option?: string; student_answer?: string }> = {};
        if (aList) {
          aList.forEach((a: StudentAnswer) => {
            ansMap[a.question_id] = {
              selected_option: a.selected_option,
              student_answer: a.student_answer
            };
          });
        }
        setAnswers(ansMap);

        // Fetch assessment details
        return api.get(`/assessments/${id}`);
      })
      .then(res => {
        if (res) setAssessment(res.data);
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Unable to load assessment.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || submittedSummary) return;

    const calculateRemaining = () => {
      const expires = new Date(attempt.expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        handleAutoSubmit();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [attempt, submittedSummary]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Request Fullscreen on test load & listen for fullscreen exits
  const requestFullscreenMode = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || submittedSummary) return;

    requestFullscreenMode();

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);

      if (!isFull) {
        // Log Fullscreen Exit proctoring event
        api.post('/tab-switch-events', {
          attempt_id: attempt.id,
          assessment_id: id,
          event_type: 'FULLSCREEN_EXIT'
        }).then(res => {
          if (res.data.tab_switches_count) {
            setTabSwitches(res.data.tab_switches_count);
          }
        }).catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attempt, id, submittedSummary]);

  // Tab-switch monitoring (§21)
  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || submittedSummary) return;

    const handleTabLeave = (eventType: string) => {
      api.post('/tab-switch-events', {
        attempt_id: attempt.id,
        assessment_id: id,
        event_type: eventType
      }).then(res => {
        if (res.data.tab_switches_count) {
          setTabSwitches(res.data.tab_switches_count);
        }
      }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleTabLeave('VISIBILITY_HIDDEN');
    };

    const onWindowBlur = () => {
      handleTabLeave('WINDOW_BLUR');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [attempt, id, submittedSummary]);

  // Auto-save answer draft periodically
  const saveAnswerDraft = (qid: string, data: { selected_option?: string; student_answer?: string }) => {
    if (!attempt) return;
    setSaving(true);

    const updatedAnswers = { ...answers, [qid]: { ...answers[qid], ...data } };
    setAnswers(updatedAnswers);
    try {
      localStorage.setItem(`student_attempt_${attempt.id}`, JSON.stringify({
        attempt_id: attempt.id,
        assessment_id: id,
        answers: updatedAnswers,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {}

    api.post(`/assessments/${id}/answer`, {
      attempt_id: attempt.id,
      question_id: qid,
      ...data
    }).finally(() => setSaving(false));
  };

  const handleAutoSubmit = () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    api.post(`/assessments/${id}/submit`, { attempt_id: attempt.id })
      .then(res => {
        setSubmittedSummary(res.data);
        try {
          const submittedItems = JSON.parse(localStorage.getItem('portal_submitted_attempts') || '[]');
          const updatedList = [...submittedItems.filter((i: any) => i.attempt_id !== attempt.id), {
            attempt_id: attempt.id,
            assessment_id: id,
            answers,
            summary: res.data,
            submitted_at: new Date().toISOString()
          }];
          localStorage.setItem('portal_submitted_attempts', JSON.stringify(updatedList));
        } catch (e) {}
      })
      .finally(() => setSubmitting(false));
  };

  const handleSubmitAssessment = () => {
    if (!window.confirm('Are you sure you want to submit your assessment? Once submitted, you cannot change your answers.')) {
      return;
    }
    handleAutoSubmit();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-sm">Loading assessment environment...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Assessment Unavailable</h3>
          <p className="text-xs text-slate-600">{errorMsg}</p>
          <button
            onClick={() => navigate('/assessments')}
            className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // Submission Summary View matching §20
  if (submittedSummary) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Assessment Submitted Successfully ✓</h2>
            <p className="text-xs text-slate-500 mt-1">{assessment?.title || 'Agentic AI Level 1'}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted:</span>
              <span className="font-bold text-slate-800">{new Date(submittedSummary.submitted_at || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MCQ Score:</span>
              <span className="font-bold text-brand-600">{submittedSummary.mcq_score} Marks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Writing Score:</span>
              <span className="font-bold text-purple-600">Pending Evaluation</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-slate-500">Status:</span>
              <span className="font-extrabold text-emerald-600 uppercase">{submittedSummary.status}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Questions Found</h3>
          <p className="text-xs text-slate-600">This assessment currently has no questions assigned. Click below to reload baseline questions.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 shadow-md"
          >
            Reload Questions
          </button>
          <button
            onClick={() => navigate('/assessments')}
            className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
          >
            Back to Assessments List
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Header Bar matching §17 */}
      <header className="bg-slate-900 text-white px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
        <div>
          <h1 className="font-bold text-sm sm:text-lg">{assessment?.title}</h1>
          <p className="text-[11px] text-slate-400">Distraction-Free Evaluation Mode</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Tab Switch warning badge */}
          {tabSwitches > 0 && (
            <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] px-2.5 py-1 rounded-full font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Switches: {tabSwitches}</span>
            </div>
          )}

          {/* Timer Countdown matching §17 & §19 */}
          <div className="flex items-center space-x-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs sm:text-sm px-3 py-1 rounded-xl">
            <Clock className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span>Time: {formatTime(remainingSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Main Examination Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Question Card matching §17 & §18 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          
          {currentQ && (
            <div className="space-y-6">
              
              {/* Question Meta Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                    {currentQ.question_type}
                  </span>
                  <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                    {currentQ.marks} Marks
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQ.question_text}
              </h2>

              {/* MCQ Options matching §17 */}
              {currentQ.question_type === 'MCQ' && (
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'A', text: currentQ.option_a },
                    { key: 'B', text: currentQ.option_b },
                    { key: 'C', text: currentQ.option_c },
                    { key: 'D', text: currentQ.option_d },
                  ].map((opt) => {
                    const isSelected = answers[currentQ.id]?.selected_option === opt.key;
                    return (
                      <label
                        key={opt.key}
                        onClick={() => saveAnswerDraft(currentQ.id, { selected_option: opt.key })}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 text-brand-900 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-500'
                        }`}>
                          {opt.key}
                        </div>
                        <span className="text-sm font-medium">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Writing Answer Box matching §18 */}
              {currentQ.question_type === 'WRITING' && (
                <div className="space-y-2 pt-2">
                  <textarea
                    rows={8}
                    placeholder="Type your answer here..."
                    value={answers[currentQ.id]?.student_answer || ''}
                    onChange={(e) => saveAnswerDraft(currentQ.id, { student_answer: e.target.value })}
                    className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Answers are saved automatically periodically.</span>
                    <span>{(answers[currentQ.id]?.student_answer || '').length} characters</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Navigation Controls matching §17 */}
          <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {saving && <span className="text-xs text-brand-600 font-semibold flex items-center"><Save className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...</span>}

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitAssessment}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Submit Assessment
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md transition-colors"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Question Status Grid Palette matching §17 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4">Question Overview Palette</h3>
            
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans && (ans.selected_option || (ans.student_answer && ans.student_answer.trim().length > 0));
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'ring-2 ring-brand-600 bg-brand-600 text-white shadow-md'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1} {isAnswered ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <button
              onClick={handleSubmitAssessment}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Submit Assessment Now
            </button>
          </div>
        </div>

      </div>

      {/* Mandatory Fullscreen Warning Modal */}
      {!isFullscreen && !submittedSummary && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Mandatory Fullscreen Mode</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This assessment requires active full-screen mode for exam proctoring integrity. Exiting full-screen is logged as a proctoring alert.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
              Logged Tab Switch / Exit Count: {tabSwitches}
            </div>
            <button
              onClick={requestFullscreenMode}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Re-enter Full Screen Mode
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
