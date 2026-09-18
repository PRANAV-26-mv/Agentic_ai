import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Question } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  CheckCheck, 
  Search, 
  Info, 
  CheckCircle2, 
  UploadCloud, 
  Type, 
  FileDown, 
  ShieldCheck, 
  X,
  FileCheck2,
  FileInput
} from 'lucide-react';

interface PdfGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'GENERATE' | 'EXTRACT';
}

export const PdfGeneratorWizard: React.FC<PdfGeneratorWizardProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialMode = 'GENERATE'
}) => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // Wizard session mode: 'GENERATE' (synthesize from notes) or 'EXTRACT' (parse existing question paper PDF with options)
  const [sessionMode, setSessionMode] = useState<'GENERATE' | 'EXTRACT'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setSessionMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const [file, setFile] = useState<File | null>(null);
  const [directText, setDirectText] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // PDF Export Session Modal state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'ALL' | 'APPROVED'>('APPROVED');
  const [paperTitle, setPaperTitle] = useState<string>('AI Generated Examination Question Paper');
  const [institutionName, setInstitutionName] = useState<string>('STUDENT ASSESSMENT & LEARNING PORTAL');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const totalRequested = mcqCount + writingCount;

  const handleApplyPreset = (mcqs: number, writings: number) => {
    setMcqCount(mcqs);
    setWritingCount(writings);
  };

  // Submit Handler: branches based on sessionMode
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'file' && !file) {
      setErrorMsg('Please select a PDF file first.');
      return;
    }
    if (inputMode === 'text' && (!directText || directText.trim().length < 20)) {
      setErrorMsg('Please provide at least 20 characters of study notes or question paper text.');
      return;
    }

    if (sessionMode === 'EXTRACT' && !isAdmin) {
      setErrorMsg('Access Denied: Only Administrators can extract and import existing question papers.');
      return;
    }

    if (sessionMode === 'GENERATE' && totalRequested < 1) {
      setErrorMsg('Please select at least 1 question to generate.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (inputMode === 'file' && file) {
      formData.append('file', file);
    } else if (inputMode === 'text' && directText) {
      formData.append('text', directText.trim());
    }

    if (sessionMode === 'GENERATE') {
      formData.append('mcq_count', mcqCount.toString());
      formData.append('writing_count', writingCount.toString());
      formData.append('difficulty', difficulty);

      api.post('/pdf/generate-questions', formData)
        .then(res => {
          const qs = res.data.questions || [];
          setGeneratedQuestions(qs);
          setStep('review');
          const detectedTopic = qs[0]?.topic || (file ? file.name.replace(/\.pdf$/i, '') : 'Curriculum Assessment');
          setPaperTitle(`${detectedTopic} - Question Paper`);
        })
        .catch(err => {
          setErrorMsg(err.response?.data?.message || 'Unable to process PDF. Please upload a valid PDF.');
        })
        .finally(() => setLoading(false));
    } else {
      // EXTRACT session mode: parses already created question paper PDF with options
      api.post('/pdf/extract-questions', formData)
        .then(res => {
          const qs = res.data.questions || [];
          setGeneratedQuestions(qs);
          setStep('review');
          const detectedTopic = qs[0]?.topic || (file ? file.name.replace(/\.pdf$/i, '') : 'Imported Question Paper');
          setPaperTitle(`${detectedTopic} - Master Paper`);
        })
        .catch(err => {
          setErrorMsg(err.response?.data?.message || 'Unable to extract questions from the provided PDF.');
        })
        .finally(() => setLoading(false));
    }
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

  // PDF Export & Download Handler (Admin Only)
  const handleDownloadPdf = async () => {
    if (!isAdmin) {
      setExportError('Access Denied: Only Administrators are authorized to export and download question paper PDFs.');
      return;
    }

    const targetQuestions = exportScope === 'APPROVED'
      ? generatedQuestions.filter(q => q.status === 'APPROVED')
      : generatedQuestions;

    if (targetQuestions.length === 0) {
      setExportError(
        exportScope === 'APPROVED'
          ? 'No approved questions found. Please approve questions or switch the scope to "All Questions".'
          : 'No questions available to export.'
      );
      return;
    }

    setExportingPdf(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const res = await api.post(
        '/pdf/export-questions-pdf',
        {
          questions: targetQuestions,
          title: paperTitle.trim() || 'AI Generated Question Paper',
          institution: institutionName.trim() || 'STUDENT ASSESSMENT & LEARNING PORTAL',
          duration_minutes: durationMinutes,
          include_answers: includeAnswers
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (paperTitle.trim() || 'Question_Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `${safeTitle}_${includeAnswers ? 'Master_With_Answers' : 'Student_Question_Paper'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess('Official PDF question paper generated and downloaded successfully!');
      setTimeout(() => {
        setShowExportModal(false);
        setExportSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setExportError(
        err.response?.data?.message || 'Failed to export PDF. Please ensure you are logged in with Admin privileges.'
      );
    } finally {
      setExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 rounded-xl">
              {sessionMode === 'EXTRACT' ? (
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight flex items-center space-x-2">
                <span>{sessionMode === 'EXTRACT' ? 'Extract Questions from Existing PDF Paper' : 'AI PDF Assessment & Question Generator'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Admin Authorized
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {sessionMode === 'EXTRACT'
                  ? 'Upload an already created question paper PDF (with options A, B, C, D) to automatically extract questions'
                  : 'Extract curriculum, concepts, and generate new questions automatically with Admin PDF export'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Upload / Session Switcher */}
        {step === 'upload' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            
            {/* Top Session Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => { setSessionMode('GENERATE'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  sessionMode === 'GENERATE'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Session 1: AI Question Generator</span>
              </button>
              <button
                type="button"
                onClick={() => { setSessionMode('EXTRACT'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  sessionMode === 'EXTRACT'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Session 2: Extract Existing Question Paper PDF</span>
              </button>
            </div>

            {/* Session Mode Explanatory Banner */}
            {sessionMode === 'EXTRACT' ? (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start space-x-2.5 text-xs text-indigo-900">
                <FileInput className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Existing Question Paper Auto-Extraction Mode (Admin Only)</span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Upload an already prepared exam paper, mock test, or quiz sheet containing questions with multiple-choice options (A, B, C, D). The parser will automatically extract each question, its choices, detected answers, and marks for review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start space-x-2.5 text-xs text-purple-900">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">AI Synthesis Mode</span>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Upload syllabus notes, textbook chapters, or reference material to synthesize brand new questions according to your selected volume and difficulty.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Mode Selector */}
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    inputMode === 'file'
                      ? (sessionMode === 'EXTRACT' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs')
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{sessionMode === 'EXTRACT' ? 'Upload Question Paper PDF' : 'Upload PDF Document'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    inputMode === 'text'
                      ? (sessionMode === 'EXTRACT' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs')
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>{sessionMode === 'EXTRACT' ? 'Paste Question Paper Text' : 'Paste Notes / Curriculum Text'}</span>
                </button>
              </div>

              {/* File Upload Zone */}
              {inputMode === 'file' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped && dropped.type === 'application/pdf') {
                      setFile(dropped);
                    } else {
                      setErrorMsg('Please upload a valid PDF document.');
                    }
                  }}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : file
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={e => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />

                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                      <div>
                        <div className="text-sm font-bold text-slate-800">{file.name}</div>
                        <div className="text-xs text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {sessionMode === 'EXTRACT' ? 'Question Paper PDF Ready for Extraction' : 'PDF Ready for AI Assessment'}
                        </div>
                      </div>
                      <div className="pt-2 flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setFile(null); }}
                          className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className={`w-10 h-10 mx-auto ${sessionMode === 'EXTRACT' ? 'text-indigo-600' : 'text-purple-600'}`} />
                      <div className="text-sm font-bold text-slate-800">
                        {sessionMode === 'EXTRACT'
                          ? 'Click anywhere or Drag & Drop Question Paper PDF here'
                          : 'Click anywhere or Drag & Drop Course PDF here'}
                      </div>
                      <p className="text-xs text-slate-500">
                        {sessionMode === 'EXTRACT'
                          ? 'Supports examination papers, mock tests, and question sheets with options A/B/C/D (.pdf up to 20MB)'
                          : 'Supports textbooks, lecture notes, and curriculum syllabus (.pdf up to 20MB)'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {sessionMode === 'EXTRACT' ? 'Question Paper Text Content (with options A, B, C, D)' : 'Course Notes or Lecture Text'}
                  </label>
                  <textarea
                    rows={6}
                    placeholder={sessionMode === 'EXTRACT'
                      ? 'Paste question paper text here (e.g. 1. What is AI? (A) ... (B) ... (C) ... (D) ... Answer: A)...'
                      : 'Paste curriculum topics, textbook excerpts, lecture transcripts, or notes here (min 20 characters)...'}
                    value={directText}
                    onChange={e => setDirectText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-400 text-right">
                    {directText.length} characters
                  </div>
                </div>
              )}

              {/* Session-Specific Parameters */}
              {sessionMode === 'GENERATE' ? (
                <>
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                </>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <span className="font-bold text-slate-800">Automatic Question & Option Parser:</span>
                  <p className="text-[11px] text-slate-600">
                    The engine automatically discovers all numbered questions, isolates option A, B, C, D text, captures marks indicated in brackets (e.g. [2 Marks]), and assigns detected or indicated correct answers into the system.
                  </p>
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
                disabled={(!file && inputMode === 'file') || loading || (sessionMode === 'GENERATE' && totalRequested < 1)}
                className={`w-full py-3.5 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  sessionMode === 'EXTRACT'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {sessionMode === 'EXTRACT'
                        ? 'Parsing question paper & extracting questions with options...'
                        : `Generating ${totalRequested} questions via AI engine...`}
                    </span>
                  </>
                ) : (
                  <>
                    {sessionMode === 'EXTRACT' ? (
                      <>
                        <FileCheck2 className="w-4 h-4" />
                        <span>Extract Questions & Options from Paper (Admin Only)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract & Generate {totalRequested} Questions</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Review Screen */}
        {step === 'review' && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            
            {/* Top Stats & Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0">
              <div className="flex items-center space-x-3 text-xs">
                <span className="font-bold text-slate-800">
                  Total: {generatedQuestions.length} Questions
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                  {approvedCount} Approved
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  {reviewCount} In Review
                </span>
                {rejectedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                    {rejectedCount} Rejected
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleApproveAll}
                  disabled={batchActionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Approve All</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  disabled={batchActionLoading}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reject All
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 flex-shrink-0">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'MCQ', 'WRITING'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
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
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>

                      {q.status !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveQuestion(q.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRejectQuestion(q.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Finalize & PDF Export Session Toolbar */}
            <div className="pt-3 border-t flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredQuestions.length} of {generatedQuestions.length} questions ({approvedCount} Approved)
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-indigo-600" />
                    Admin Session Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                    Admin Access Required
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Export to PDF Button (Admin Only) */}
                <button
                  type="button"
                  onClick={() => {
                    setExportError(null);
                    setExportSuccess(null);
                    setShowExportModal(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  title={isAdmin ? "Export and download as official PDF question paper" : "Admin privileges required"}
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export to PDF (Admin Only)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onSuccess(); onClose(); }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save & Add to Question Bank
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PDF Export Session Modal (Admin Only) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-200">
            <div className="flex justify-between items-start border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Admin PDF Question Paper Session
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Convert questions into an official formatted printable PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin verification indicator */}
            {isAdmin ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Admin Privileges Verified</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 rounded text-emerald-800 font-bold">
                  ROLE: ADMIN
                </span>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold">
                  Access Denied: Only administrators can export and download question paper PDFs.
                </span>
              </div>
            )}

            {/* Export Options Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Examination Paper Title</label>
                <input
                  type="text"
                  value={paperTitle}
                  onChange={e => setPaperTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Examination Paper"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institution Header / Subtitle</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  placeholder="e.g. STUDENT ASSESSMENT & LEARNING PORTAL"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Allowed (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Math.max(15, parseInt(e.target.value, 10) || 60))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Question Selection</label>
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setExportScope('APPROVED')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        exportScope === 'APPROVED' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Approved ({approvedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportScope('ALL')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        exportScope === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({generatedQuestions.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Master / Student Format Mode */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswers}
                    onChange={e => setIncludeAnswers(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Include Evaluator Answer Key & Rubrics
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {includeAnswers
                        ? "Master Document: Generates student question paper followed by the confidential answers matrix, explanations, and model answers."
                        : "Student Paper: Generates clean question paper with roll number block and candidate instructions (No answers shown)."}
                    </p>
                  </div>
                </label>
              </div>

              {/* Status Alerts */}
              {exportError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportSuccess}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!isAdmin || exportingPdf}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                {exportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{includeAnswers ? 'Download Master Paper with Key' : 'Download Student Paper PDF'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
