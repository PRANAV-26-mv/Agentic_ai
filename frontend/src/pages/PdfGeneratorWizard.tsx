import React, { useState } from 'react';
import { api } from '../services/api';
import { Question } from '../types';
import { Sparkles, Upload, CheckCircle2, RefreshCw, Trash2, Edit, AlertCircle, FileText } from 'lucide-react';

interface PdfGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PdfGeneratorWizard: React.FC<PdfGeneratorWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState<number>(5);
  const [writingCount, setWritingCount] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mcq_count', mcqCount.toString());
    formData.append('writing_count', writingCount.toString());
    formData.append('difficulty', difficulty);

    api.post('/pdf/generate-questions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>PDF → Automatic Assessment Generator</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 font-bold">✕</button>
        </div>

        {/* Step 1: Upload & Parameters matching §14 */}
        {step === 'upload' && (
          <form onSubmit={handleGenerate} className="space-y-4 flex-1 overflow-y-auto">
            <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-2xl p-6 text-center bg-purple-50/50 transition-colors">
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
                <p className="text-xs text-slate-500">Extract text & topics automatically for question generation</p>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Number of MCQs</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={mcqCount}
                  onChange={e => setMcqCount(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Number of Writing Questions</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={writingCount}
                  onChange={e => setWritingCount(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting text & generating questions via AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Admin Review Screen matching §15 */}
        {step === 'review' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
              <span className="font-bold text-purple-900">
                {generatedQuestions.length} Questions Generated ({mcqCount} MCQ / {writingCount} Writing)
              </span>
              <span className="text-purple-700">Status: Default DRAFT/REVIEW (Review before approval)</span>
            </div>

            <div className="space-y-3">
              {generatedQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      Question {idx + 1} ({q.question_type}) • {q.difficulty} • Topic: {q.topic}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      q.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-900">{q.question_text}</p>

                  {q.question_type === 'MCQ' && (
                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                      <div>A: {q.option_a}</div>
                      <div>B: {q.option_b}</div>
                      <div>C: {q.option_c}</div>
                      <div>D: {q.option_d}</div>
                      <div className="col-span-2 text-emerald-700 font-bold">Correct Answer: {q.correct_answer}</div>
                    </div>
                  )}

                  {/* Actions matching §15: Edit, Regenerate, Delete, Approve */}
                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => handleRegenerateQuestion(q.id)}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700 flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>

                    {q.status !== 'APPROVED' ? (
                      <button
                        onClick={() => handleApproveQuestion(q.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRejectQuestion(q.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
