import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Sparkles, CheckCircle2, Save, User, Award } from 'lucide-react';

export const WritingEvaluation: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);
  
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestedScore: number; rationale: string }>>({});
  const [awardedMarks, setAwardedMarks] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/results')
      .then(res => {
        setAttempts(res.data);
        if (res.data.length > 0) {
          setSelectedAttemptId(res.data[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAttemptId) return;

    api.get(`/results/${selectedAttemptId}`)
      .then(res => {
        setAttemptDetail(res.data);
        
        // Populate existing scores
        const marksMap: Record<string, number> = {};
        const feedbackMap: Record<string, string> = {};
        if (res.data.answers) {
          res.data.answers.forEach((a: any) => {
            if (a.awarded_marks !== undefined && a.awarded_marks !== null) {
              marksMap[a.question_id] = a.awarded_marks;
            }
            if (a.evaluator_feedback) {
              feedbackMap[a.question_id] = a.evaluator_feedback;
            }
          });
        }
        setAwardedMarks(marksMap);
        setFeedbacks(feedbackMap);
      })
      .catch(err => console.error(err));
  }, [selectedAttemptId]);

  const handleFetchAiSuggestion = (qid: string) => {
    if (!selectedAttemptId) return;
    setLoadingAi(prev => ({ ...prev, [qid]: true }));

    api.post(`/results/${selectedAttemptId}/suggest-writing-score`, { question_id: qid })
      .then(res => {
        setAiSuggestions(prev => ({ ...prev, [qid]: res.data }));
        // Pre-fill awarded marks with AI suggestion for convenience (admin can override!)
        if (awardedMarks[qid] === undefined) {
          setAwardedMarks(prev => ({ ...prev, [qid]: res.data.suggestedScore }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingAi(prev => ({ ...prev, [qid]: false })));
  };

  const handleSaveEvaluation = (qid: string) => {
    if (!selectedAttemptId) return;
    const score = awardedMarks[qid] !== undefined ? awardedMarks[qid] : 0;
    const feedback = feedbacks[qid] || '';

    setSaving(prev => ({ ...prev, [qid]: true }));

    api.post(`/results/${selectedAttemptId}/evaluate-writing`, {
      question_id: qid,
      awarded_marks: score,
      feedback
    })
      .then(() => {
        alert('Evaluation saved successfully! Final grade updated.');
      })
      .catch(err => console.error(err))
      .finally(() => setSaving(prev => ({ ...prev, [qid]: false })));
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  const writingQuestions = attemptDetail ? attemptDetail.questions.filter((q: any) => q.question_type === 'WRITING') : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <span>AI-Assisted Writing Evaluation (§13 & §26)</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Review student written responses, view AI score suggestions, and award final grades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Attempt Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Pending Submissions</h3>
          {attempts.map((att) => (
            <div
              key={att.id}
              onClick={() => setSelectedAttemptId(att.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                selectedAttemptId === att.id
                  ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{att.student_name}</div>
              <div className="text-[11px] text-slate-500 line-clamp-1">{att.assessment_title}</div>
            </div>
          ))}
        </div>

        {/* Right Column: Writing Evaluation Form matching §26 */}
        <div className="lg:col-span-3 space-y-6">
          {attemptDetail && writingQuestions.map((q: any) => {
            const ans = attemptDetail.answers.find((a: any) => a.question_id === q.id);
            const studentAnsText = ans ? (ans.student_answer || 'No answer submitted.') : 'No answer submitted.';
            const aiSugg = aiSuggestions[q.id];

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                
                {/* Meta Header */}
                <div className="border-b pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase">Student: {attemptDetail.student.name} ({attemptDetail.student.student_id})</span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">{q.question_text}</h3>
                  </div>
                  <span className="bg-slate-100 text-slate-800 font-extrabold text-xs px-3 py-1 rounded-full">Max Marks: {q.marks}</span>
                </div>

                {/* Student Answer Box matching §26 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Answer:</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-mono">
                    {studentAnsText}
                  </div>
                </div>

                {/* Rubric Box */}
                {q.rubric && (
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-900">
                    <span className="font-bold">Evaluation Rubric:</span> {q.rubric}
                  </div>
                )}

                {/* AI Advisory Suggestion Box matching §26 & §46 */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-brand-50 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>AI-Suggested Score & Rationale (Advisory Only)</span>
                    </span>
                    
                    <button
                      onClick={() => handleFetchAiSuggestion(q.id)}
                      disabled={loadingAi[q.id]}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      {loadingAi[q.id] ? 'Evaluating...' : 'Get AI Suggestion'}
                    </button>
                  </div>

                  {aiSugg ? (
                    <div className="text-xs space-y-1 pt-1">
                      <div className="font-extrabold text-purple-900 text-sm">Suggested Score: {aiSugg.suggestedScore} / {q.marks}</div>
                      <p className="text-purple-800 text-xs italic">{aiSugg.rationale}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Click button to generate AI rubric evaluation advice.</p>
                  )}
                </div>

                {/* Evaluation Controls matching §26 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Marks</label>
                    <input
                      type="number"
                      max={q.marks}
                      min={0}
                      value={awardedMarks[q.id] !== undefined ? awardedMarks[q.id] : 0}
                      onChange={e => setAwardedMarks({ ...awardedMarks, [q.id]: parseFloat(e.target.value) })}
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl font-extrabold text-sm text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Evaluator Feedback</label>
                    <input
                      type="text"
                      placeholder="Good explanation of central concepts..."
                      value={feedbacks[q.id] || ''}
                      onChange={e => setFeedbacks({ ...feedbacks, [q.id]: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSaveEvaluation(q.id)}
                    disabled={saving[q.id]}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving[q.id] ? 'Saving...' : 'Save Evaluation'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
