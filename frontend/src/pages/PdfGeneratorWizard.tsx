import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Question } from '../types';
import { Sparkles, RefreshCw, AlertCircle, FileText, CheckCheck, Search, Info } from 'lucide-react';

interface PdfGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PdfGeneratorWizard: React.FC<PdfGeneratorWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState<number>(40);
  const [writingCount, setWritingCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [batchActionLoading, setBatchActionLoading] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review step filters & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'MCQ' | 'WRITING'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'REVIEW' | 'REJECTED'>('ALL');

  if (!isOpen) return null;

  const totalRequested = mcqCount + writingCount;

  const handleApplyPreset = (mcqs: number, writings: number) => {
    setMcqCount(mcqs);
    setWritingCount(writings);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (totalRequested < 1) {
      setErrorMsg('Please select at least 1 question to generate.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mcq_count', mcqCount.toString());
    formData.append('writing_count', writingCount.toString());
    formData.append('difficulty', difficulty);

    api.post('/pdf/generate-questions', formData)
      .then(res => {
        setGeneratedQuestions(res.data.questions || []);
        setStep('review');
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Unable to process PDF. Please upload a valid PDF.');
      })
      .finally(() => setLoading(false));
  };

  const handleApproveQuestion = (qId: string) => {
    api.post(`/questions/${qId}/approve`).then(() => {
      setGeneratedQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'APPROVED' } : q));
    });
  };

  const handleRejectQuestion = (qId: string) => {
    api.post(`/questions/${qId}/reject`).then(() => {
      setGeneratedQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'REJECTED' } : q));
    });
  };

  const handleRegenerateQuestion = (qId: string) => {
    api.post(`/questions/${qId}/regenerate`).then(res => {
      setGeneratedQuestions(prev => prev.map(q => q.id === qId ? res.data : q));
    });
  };

  // Bulk batch actions for high-capacity review
  const handleApproveAll = () => {
    const ids = generatedQuestions.map(q => q.id);
    if (ids.length === 0) return;

    setBatchActionLoading(true);
    api.post('/questions/batch-approve', { ids })
      .then(() => {
        setGeneratedQuestions(prev => prev.map(q => ({ ...q, status: 'APPROVED' })));
      })
      .catch(err => {
        console.error('Batch approve failed:', err);
      })
      .finally(() => setBatchActionLoading(false));
  };

  const handleRejectAll = () => {
    const ids = generatedQuestions.map(q => q.id);
    if (ids.length === 0) return;

    if (!window.confirm(`Are you sure you want to mark all ${ids.length} questions as REJECTED?`)) return;

    setBatchActionLoading(true);
    api.post('/questions/batch-reject', { ids })
      .then(() => {
        setGeneratedQuestions(prev => prev.map(q => ({ ...q, status: 'REJECTED' })));
      })
      .catch(err => {
        console.error('Batch reject failed:', err);
      })
      .finally(() => setBatchActionLoading(false));
  };

  // Filtered list for review
  const filteredQuestions = useMemo(() => {
    return generatedQuestions.filter(q => {
      if (filterType !== 'ALL' && q.question_type !== filterType) return false;
      if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = q.question_text.toLowerCase().includes(query);
        const matchesTopic = (q.topic || '').toLowerCase().includes(query);
        const matchesOptions = [q.option_a, q.option_b, q.option_c, q.option_d].some(opt => opt && opt.toLowerCase().includes(query));
        return matchesText || matchesTopic || matchesOptions;
      }
      return true;
    });
  }, [generatedQuestions, filterType, filterStatus, searchQuery]);

  const approvedCount = generatedQuestions.filter(q => q.status === 'APPROVED').length;
  const reviewCount = generatedQuestions.filter(q => q.status === 'REVIEW' || q.status === 'DRAFT').length;
  const rejectedCount = generatedQuestions.filter(q => q.status === 'REJECTED').length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                AI PDF Assessment & Question Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Extract curriculum, concepts, and generate 50+ questions automatically
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg">✕</button>
        </div>

        {/* Step 1: Upload & Parameters */}
        {step === 'upload' && (
          <form onSubmit={handleGenerate} className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-2xl p-6 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                id="pdf-upload-input"
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-2 block">
                <FileText className="w-10 h-10 text-purple-600 mx-auto" />
                <div className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to Upload Course Material PDF'}
                </div>
                <p className="text-xs text-slate-500">
                  Upload textbooks, syllabi, lecture notes, or research papers (up to 20MB)
                </p>
              </label>
            </div>

            {/* Quick Presets */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Quick Volume Presets:</span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Target: {totalRequested} Questions
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '10 Questions', mcq: 8, writing: 2 },
                  { label: '25 Questions', mcq: 20, writing: 5 },
                  { label: '50 Questions ⭐', mcq: 40, writing: 10 },
                  { label: '75 Questions', mcq: 60, writing: 15 },
                  { label: '100 Questions 🚀', mcq: 80, writing: 20 }
                ].map((preset) => {
                  const isSelected = mcqCount === preset.mcq && writingCount === preset.writing;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyPreset(preset.mcq, preset.writing)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-400 hover:text-purple-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input Counts */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Number of MCQs <span className="text-slate-400 font-normal">(0 - 150)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={150}
                  value={mcqCount}
                  onChange={e => setMcqCount(Math.max(0, Math.min(150, parseInt(e.target.value, 10) || 0)))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Number of Writing Questions <span className="text-slate-400 font-normal">(0 - 50)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={writingCount}
                  onChange={e => setWritingCount(Math.max(0, Math.min(50, parseInt(e.target.value, 10) || 0)))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Notice for 50+ questions */}
            {totalRequested >= 50 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start space-x-2.5 text-xs text-purple-900">
                <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">High-Capacity Question Generation Enabled ({totalRequested} Total Questions).</span>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    The engine will synthesize diverse topics, definitions, architectural mechanisms, and distributed options (A/B/C/D) across the entire document.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading || totalRequested < 1}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating {totalRequested} questions via AI engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {totalRequested} Questions from PDF</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Admin Review Screen for High-Capacity Batches */}
        {step === 'review' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 flex flex-col">
            {/* Top Summary Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3.5 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
              <div>
                <span className="font-bold text-purple-950 text-sm">
                  {generatedQuestions.length} Questions Generated
                </span>
                <div className="text-[11px] text-purple-700 flex items-center space-x-2 mt-0.5 font-medium">
                  <span>{generatedQuestions.filter(q => q.question_type === 'MCQ').length} MCQs</span>
                  <span>•</span>
                  <span>{generatedQuestions.filter(q => q.question_type === 'WRITING').length} Writing</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{approvedCount} Approved</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">{reviewCount} In Review</span>
                  {rejectedCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">{rejectedCount} Rejected</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={batchActionLoading}
                  onClick={handleApproveAll}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Approve All ({generatedQuestions.length})</span>
                </button>
                <button
                  type="button"
                  disabled={batchActionLoading}
                  onClick={handleRejectAll}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
                >
                  <span>Reject All</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'MCQ', 'WRITING'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      filterType === type ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type === 'ALL' ? 'All Types' : type}
                  </button>
                ))}
                <span className="text-slate-300">|</span>
                {(['ALL', 'APPROVED', 'REVIEW', 'REJECTED'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      filterStatus === st ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl text-slate-500 text-xs">
                  No questions match the current filter or search criteria.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          #{idx + 1} • {q.question_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                          {q.topic || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          {q.difficulty} • {q.marks} Marks
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        q.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.status}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 leading-relaxed">{q.question_text}</p>

                    {q.question_type === 'MCQ' && (
                      <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                        <div className={`p-2 rounded-lg border ${q.correct_answer === 'A' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200'}`}>
                          A: {q.option_a}
                        </div>
                        <div className={`p-2 rounded-lg border ${q.correct_answer === 'B' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200'}`}>
                          B: {q.option_b}
                        </div>
                        <div className={`p-2 rounded-lg border ${q.correct_answer === 'C' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200'}`}>
                          C: {q.option_c}
                        </div>
                        <div className={`p-2 rounded-lg border ${q.correct_answer === 'D' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200'}`}>
                          D: {q.option_d}
                        </div>
                        {q.explanation && (
                          <div className="col-span-2 text-[11px] text-slate-500 italic pt-0.5">
                            💡 Explanation: {q.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {q.question_type === 'WRITING' && (
                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                        {q.rubric && (
                          <div className="p-2 bg-purple-50/60 rounded-lg border border-purple-100 text-purple-900">
                            <span className="font-bold">Rubric:</span> {q.rubric}
                          </div>
                        )}
                        {q.expected_answer && (
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                            <span className="font-bold">Model Answer:</span> {q.expected_answer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleRegenerateQuestion(q.id)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700 flex items-center space-x-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>

                      {q.status !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveQuestion(q.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRejectQuestion(q.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Finalize Button */}
            <div className="pt-3 border-t flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-slate-500">
                Showing {filteredQuestions.length} of {generatedQuestions.length} questions
              </span>
              <button
                type="button"
                onClick={() => { onSuccess(); onClose(); }}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Save & Add to Question Bank
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
