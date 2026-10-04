import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assessment, QuestionPool } from '../types';
import { FileCheck, Plus, Copy, Trash2, Clock, CheckCircle2, Shuffle, Search, Sparkles, Dices } from 'lucide-react';

export const AssessmentManagement: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [randomCountInput, setRandomCountInput] = useState<number>(40);
  const [questionSearch, setQuestionSearch] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    type: 'HYBRID',
    question_selection_mode: 'FIXED',
    pool_id: '',
    draw_count: 40,
    question_ids: [],
    target_type: 'ALL',
    community: 'Agentic AI & LLM Optimization',
    department: 'CS',
    duration_minutes: 30,
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    passing_percentage: 60,
    max_marks: 20
  });

  const handleSelectRandom = (count: number) => {
    const approved = allQuestions.filter(q => q.status === 'APPROVED');
    const shuffled = [...approved].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(count, approved.length)).map(q => q.id);
    setFormData((prev: any) => ({ ...prev, question_ids: picked }));
  };

  const fetchAssessments = () => {
    setLoading(true);
    Promise.all([
      api.get('/assessments'),
      api.get('/questions/pools'),
      api.get('/questions')
    ]).then(([assRes, poolRes, qRes]) => {
      setAssessments(assRes.data);
      setPools(poolRes.data);
      setAllQuestions(qRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/assessments', formData)
      .then(() => {
        setShowCreateModal(false);
        fetchAssessments();
      });
  };

  const handleDuplicate = (id: string) => {
    api.post(`/assessments/${id}/duplicate`).then(() => fetchAssessments());
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this assessment?')) return;
    api.delete(`/assessments/${id}`).then(() => fetchAssessments());
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0" />
            <span>Assessment Management & Duplication</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Create fixed question or randomized pool assessments with timer constraints.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Assessment Table matching §11 & §49 */}
      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Title</th>
                <th className="p-4">Mode / Type</th>
                <th className="p-4">Target Audience</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {assessments.map((ass) => (
                <tr key={ass.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{ass.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1">{ass.description}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full text-[10px] mr-1">
                      {ass.type}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      {ass.question_selection_mode === 'RANDOMIZED_POOL' ? 'Random Pool' : 'Fixed Set'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-800 font-medium">{ass.target_type} ({ass.community || ass.department || 'All'})</td>
                  <td className="p-4 font-mono">{ass.duration_minutes} Mins</td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase">
                      {ass.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleDuplicate(ass.id)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Duplicate Assessment Template (§49)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ass.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal matching §11 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create New Assessment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agentic AI & Tool Calling Evaluation"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of topics..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="MCQ">MCQ Only</option>
                    <option value="WRITING">Writing Only</option>
                    <option value="HYBRID">MCQ + Writing (Hybrid)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Question Selection Mode (§45)</label>
                  <select
                    value={formData.question_selection_mode}
                    onChange={e => setFormData({ ...formData, question_selection_mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-purple-700"
                  >
                    <option value="FIXED">Fixed Set (Same questions for everyone)</option>
                    <option value="RANDOMIZED_POOL">Randomized Pool Draw per student</option>
                  </select>
                </div>
              </div>

              {formData.question_selection_mode === 'RANDOMIZED_POOL' && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-purple-900 font-bold">
                    <Dices className="w-4 h-4 text-purple-600" />
                    <span>Randomized Pool Configuration</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Question Pool Source (Optional)</label>
                    <select
                      value={formData.pool_id}
                      onChange={e => setFormData({ ...formData, pool_id: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- All Approved Questions / Selected Questions ({allQuestions.filter(q => q.status === 'APPROVED').length} available) --</option>
                      {pools.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.question_ids?.length || 0} questions)</option>
                      ))}
                    </select>
                  </div>

                  {/* Draw Count Selector */}
                  <div className="bg-white p-3 rounded-xl border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-purple-900 text-xs flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Random Questions Assigned per Student (Draw Count)</span>
                      </label>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800">
                        {formData.draw_count || 40} Questions
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[10, 20, 30, 40, 50, 60].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setFormData({ ...formData, draw_count: cnt })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            formData.draw_count === cnt
                              ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                              : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {cnt === 40 ? '40 ⭐' : cnt}
                        </button>
                      ))}
                      <div className="flex items-center space-x-1 ml-auto">
                        <span className="text-slate-500 text-[11px] font-bold">Custom:</span>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={formData.draw_count || 40}
                          onChange={e => setFormData({ ...formData, draw_count: parseInt(e.target.value, 10) || 1 })}
                          className="w-16 p-1 bg-purple-50 border border-purple-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      When a student starts the test, the system will randomly draw and assign {formData.draw_count || 40} questions from the pool.
                    </p>
                  </div>
                </div>
              )}

              {formData.question_selection_mode === 'FIXED' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block font-bold text-slate-800">
                      Select Questions ({formData.question_ids?.length || 0} of {allQuestions.filter(q => q.status === 'APPROVED').length} selected)
                    </label>
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter questions..."
                        value={questionSearch}
                        onChange={e => setQuestionSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Random Selection Toolbar */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center space-x-1">
                        <Dices className="w-3.5 h-3.5 text-purple-600" />
                        <span>Quick Random Picker:</span>
                      </span>
                      <div className="flex items-center space-x-1 text-xs">
                        <input
                          type="number"
                          min={1}
                          max={allQuestions.length}
                          value={randomCountInput}
                          onChange={e => setRandomCountInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-14 p-1 bg-slate-50 border border-slate-300 rounded-md text-center font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSelectRandom(randomCountInput)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md text-xs cursor-pointer shadow-xs"
                        >
                          Pick Random
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectRandom(10)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Random 10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectRandom(20)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Random 20
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectRandom(40)}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-xs cursor-pointer border border-purple-300 shadow-2xs"
                      >
                        Random 40 ⭐
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectRandom(50)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Random 50
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, question_ids: allQuestions.filter(q => q.status === 'APPROVED').map(q => q.id) })}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs cursor-pointer ml-auto"
                      >
                        Select All
                      </button>
                      {formData.question_ids?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, question_ids: [] })}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {allQuestions.filter(q => q.status === 'APPROVED').length === 0 ? (
                    <div className="text-slate-500 text-xs italic">
                      No approved questions found. Baseline standard questions will be automatically assigned.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {allQuestions
                        .filter(q => q.status === 'APPROVED')
                        .filter(q => !questionSearch || q.question_text.toLowerCase().includes(questionSearch.toLowerCase()) || (q.topic || '').toLowerCase().includes(questionSearch.toLowerCase()))
                        .map(q => {
                          const selected = formData.question_ids?.includes(q.id);
                          return (
                            <label key={q.id} className={`flex items-center space-x-2 text-xs p-2 rounded-lg border cursor-pointer transition-colors ${
                              selected ? 'bg-purple-50/80 border-purple-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}>
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={e => {
                                  const current = formData.question_ids || [];
                                  const updated = e.target.checked
                                    ? [...current, q.id]
                                    : current.filter((qid: string) => qid !== q.id);
                                  setFormData({ ...formData, question_ids: updated });
                                }}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <div className="flex-1 truncate">
                                <span className="font-bold text-purple-700 mr-1.5">[{q.question_type}]</span>
                                <span className="text-slate-800 font-medium">{q.question_text}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">{q.difficulty} • {q.marks}m</span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Passing %</label>
                  <input
                    type="number"
                    value={formData.passing_percentage}
                    onChange={e => setFormData({ ...formData, passing_percentage: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={e => setFormData({ ...formData, max_marks: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Publish Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
