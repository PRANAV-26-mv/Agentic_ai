import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Question, QuestionPool } from '../types';
import { HelpCircle, Sparkles, Plus, CheckCircle2, XCircle, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { PdfGeneratorWizard } from './PdfGeneratorWizard';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showPdfWizard, setShowPdfWizard] = useState<boolean>(false);
  const [showPoolModal, setShowPoolModal] = useState<boolean>(false);
  const [poolName, setPoolName] = useState<string>('');

  const fetchQuestions = () => {
    setLoading(true);
    Promise.all([
      api.get('/questions', { params: { type: typeFilter, difficulty: difficultyFilter, status: statusFilter } }),
      api.get('/questions/pools')
    ]).then(([qRes, pRes]) => {
      setQuestions(qRes.data);
      setPools(pRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, [typeFilter, difficultyFilter, statusFilter]);

  const handleApprove = (id: string) => {
    api.post(`/questions/${id}/approve`).then(() => fetchQuestions());
  };

  const handleReject = (id: string) => {
    api.post(`/questions/${id}/reject`).then(() => fetchQuestions());
  };

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    api.delete(`/questions/${id}`).then(() => fetchQuestions());
  };

  const handleDeleteAllQuestions = () => {
    if (!window.confirm('Are you sure you want to DELETE ALL QUESTIONS from the Question Bank? This action cannot be undone.')) return;
    api.delete('/questions/all').then(() => fetchQuestions());
  };

  const handleDeletePool = (poolId: string, poolName: string) => {
    if (!window.confirm(`Are you sure you want to delete question pool "${poolName}"?`)) return;
    api.delete(`/questions/pools/${poolId}`).then(() => fetchQuestions());
  };

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim()) return;
    api.post('/questions/pools', { name: poolName, description: 'Created from Question Bank' })
      .then(() => {
        setPoolName('');
        fetchQuestions();
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <span>Question Repository & Pools</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage MCQ & Writing questions, approve AI-generated items, and build pools.</p>
        </div>

        <div className="flex items-center space-x-3">
          {questions.length > 0 && (
            <button
              onClick={handleDeleteAllQuestions}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors border border-rose-200"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete All Questions ({questions.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowPoolModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors border border-slate-200"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Manage Pools ({pools.length})</span>
          </button>

          <button
            onClick={() => setShowPdfWizard(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>PDF AI Question Generator</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar matching §16 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
          <option value="">All Question Types</option>
          <option value="MCQ">MCQ</option>
          <option value="WRITING">Writing</option>
        </select>

        <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
          <option value="">All Approval Statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REVIEW">REVIEW / DRAFT</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Questions Found</h3>
              <p className="text-slate-500 text-xs">Your question repository is currently empty. Use the PDF AI Question Generator to create questions.</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="space-x-2">
                    <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">{q.question_type}</span>
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">{q.difficulty}</span>
                    <span className="text-slate-500 font-medium">Topic: {q.topic || 'General'}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{q.question_text}</h3>

                {q.question_type === 'MCQ' && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className={q.correct_answer === 'A' ? 'font-bold text-emerald-600' : ''}>A: {q.option_a}</div>
                    <div className={q.correct_answer === 'B' ? 'font-bold text-emerald-600' : ''}>B: {q.option_b}</div>
                    <div className={q.correct_answer === 'C' ? 'font-bold text-emerald-600' : ''}>C: {q.option_c}</div>
                    <div className={q.correct_answer === 'D' ? 'font-bold text-emerald-600' : ''}>D: {q.option_d}</div>
                  </div>
                )}

                {q.question_type === 'WRITING' && q.rubric && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Rubric:</span> {q.rubric}
                  </div>
                )}

                <div className="pt-2 border-t flex justify-end items-center space-x-2 text-xs">
                  {q.status !== 'APPROVED' && (
                    <button onClick={() => handleApprove(q.id)} className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                      Approve
                    </button>
                  )}
                  {q.status !== 'REJECTED' && (
                    <button onClick={() => handleReject(q.id)} className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700">
                      Reject
                    </button>
                  )}
                  <button onClick={() => handleDeleteQuestion(q.id)} className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PDF Generator Wizard */}
      <PdfGeneratorWizard
        isOpen={showPdfWizard}
        onClose={() => setShowPdfWizard(false)}
        onSuccess={() => fetchQuestions()}
      />

      {/* Pool Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>Question Pool Management</span>
              </h3>
              <button onClick={() => setShowPoolModal(false)} className="text-slate-400 font-bold hover:text-slate-600 text-lg">✕</button>
            </div>

            {/* Create Pool Form */}
            <form onSubmit={handleCreatePool} className="space-y-3 text-xs border-b pb-4">
              <label className="block font-bold text-slate-700">Create New Question Pool</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Pool Name (e.g. Agentic AI Master Pool)"
                  value={poolName}
                  onChange={e => setPoolName(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium"
                />
                <button type="submit" className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            </form>

            {/* Existing Pools List */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Existing Question Pools ({pools.length})</h4>
              {pools.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-center font-medium">No question pools created yet.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {pools.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-slate-500 text-[11px]">{p.question_ids?.length || 0} questions included</div>
                      </div>
                      <button
                        onClick={() => handleDeletePool(p.id, p.name)}
                        className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors flex items-center space-x-1"
                        title="Delete Question Pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
