import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { QuizSession, QuizSessionParticipant, Question, Assessment } from '../types';
import { 
  Zap, 
  Plus, 
  Users, 
  Clock, 
  Calendar, 
  Copy, 
  Check, 
  Play, 
  Square, 
  Trash2, 
  Trophy, 
  BarChart2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Filter,
  X,
  Radio,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Flame,
  Layers,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Hash,
  Award,
  FileDown,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';

const DEPARTMENTS = ['CS', 'AD', 'IT', 'ECE', 'EEE', 'MECH'];
const COMMUNITIES = [
  'Agentic AI & LLM Optimization',
  'Cloud Computing & DevOps',
  'Full Stack Development',
  'Cybersecurity & Networks',
  'Data Science & Analytics'
];

export const AdminQuizSessions: React.FC = () => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [sessionSearch, setSessionSearch] = useState<string>('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<QuizSession | null>(null);
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [sessionDetails, setSessionDetails] = useState<QuizSession | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [publishingSessionId, setPublishingSessionId] = useState<string | null>(null);

  // Delete modal state
  const [sessionToDelete, setSessionToDelete] = useState<QuizSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<boolean>(false);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);

  // Available questions and assessments for creation
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<Assessment[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Creation form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pin: '',
    duration_minutes: 15,
    target_type: 'ALL' as 'ALL' | 'DEPARTMENT' | 'COMMUNITY',
    target_department: 'CS',
    target_community: 'Agentic AI & LLM Optimization',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
    source_type: 'QUESTIONS' as 'QUESTIONS' | 'ASSESSMENT',
    assessment_id: ''
  });

  const [creating, setCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const fetchSessions = () => {
    setLoading(true);
    api.get('/quiz-sessions')
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load quiz sessions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const loadCreationDependencies = () => {
    api.get('/questions?type=MCQ')
      .then(res => setAvailableQuestions(res.data || []))
      .catch(err => console.error(err));
    api.get('/assessments')
      .then(res => setAvailableAssessments(res.data || []))
      .catch(err => console.error(err));
  };

  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const openCreateModal = () => {
    loadCreationDependencies();
    setFormData({
      title: '',
      description: '',
      pin: generateRandomPin(),
      duration_minutes: 15,
      target_type: 'ALL',
      target_department: 'CS',
      target_community: 'Agentic AI & LLM Optimization',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
      source_type: 'QUESTIONS',
      assessment_id: ''
    });
    setSelectedQuestionIds([]);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleSelectRandomQuestions = (count: number) => {
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map(q => q.id);
    setSelectedQuestionIds(selected);
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a session title.');
      return;
    }

    if (formData.source_type === 'QUESTIONS' && selectedQuestionIds.length === 0) {
      setErrorMsg('Please select at least one question for the quiz session.');
      return;
    }

    if (formData.source_type === 'ASSESSMENT' && !formData.assessment_id) {
      setErrorMsg('Please select an assessment.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/quiz-sessions', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        pin: formData.pin.trim(),
        duration_minutes: formData.duration_minutes,
        target_type: formData.target_type,
        target_department: formData.target_type === 'DEPARTMENT' ? formData.target_department : undefined,
        target_community: formData.target_type === 'COMMUNITY' ? formData.target_community : undefined,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        question_ids: formData.source_type === 'QUESTIONS' ? selectedQuestionIds : undefined,
        assessment_id: formData.source_type === 'ASSESSMENT' ? formData.assessment_id : undefined,
        status: 'ACTIVE'
      });

      setShowCreateModal(false);
      setSuccessMsg('Quiz session created and activated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchSessions();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create quiz session.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  const handleStatusChange = async (sessionId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await api.put(`/quiz-sessions/${sessionId}/status`, { status: newStatus });
      setSuccessMsg(`Session status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchSessions();
      if (selectedSessionForRoster && selectedSessionForRoster.id === sessionId) {
        openRoster(sessionId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update session status.');
    }
  };

  const handlePublishResults = async (sessionId: string) => {
    if (!window.confirm('Are you ready to calculate final ranks and reveal official results to all students? This will lock in cohort standings and broadcast final ranks to all waiting participants.')) return;
    setPublishingSessionId(sessionId);
    try {
      const res = await api.put(`/quiz-sessions/${sessionId}/publish-results`);
      setSuccessMsg(res.data.message || 'Results published and cohort ranks calculated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchSessions();
      if (selectedSessionForRoster && selectedSessionForRoster.id === sessionId) {
        openRoster(sessionId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish results and calculate ranks.');
    } finally {
      setPublishingSessionId(null);
    }
  };

  // Trigger Safe Delete Modal
  const handlePromptDelete = (session: QuizSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessionToDelete(session);
  };

  // Execute single session deletion
  const handleExecuteDelete = async () => {
    if (!sessionToDelete) return;
    setDeletingSession(true);
    try {
      await api.delete(`/quiz-sessions/${sessionToDelete.id}`);
      setSuccessMsg(`Quiz session "${sessionToDelete.title}" was successfully deleted.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      
      // If roster modal is currently showing this session, close it
      if (selectedSessionForRoster?.id === sessionToDelete.id) {
        setSelectedSessionForRoster(null);
        setSessionDetails(null);
      }
      setSessionToDelete(null);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete quiz session.');
    } finally {
      setDeletingSession(false);
    }
  };

  // Bulk delete completed sessions
  const handleBulkDeleteCompleted = async () => {
    const completed = sessions.filter(s => s.status === 'COMPLETED');
    if (completed.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${completed.length} completed quiz sessions? This action cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      const res = await api.post('/quiz-sessions/bulk-delete', {
        session_ids: completed.map(s => s.id)
      });
      setSuccessMsg(res.data.message || `Deleted ${completed.length} completed quiz sessions.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete completed sessions.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDownloadPdfReport = async (sessionId: string, title?: string) => {
    try {
      setDownloadingReportId(`${sessionId}-pdf`);
      const res = await api.get(`/quiz-sessions/${sessionId}/report-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (title || 'quiz-session').replace(/[^a-zA-Z0-9-_]/g, '_');
      link.setAttribute('download', `Quiz_Report_${safeTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download PDF report:', err);
      alert('Failed to download quiz PDF report. Please ensure quiz session data is available.');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleDownloadCsvReport = async (sessionId: string, title?: string) => {
    try {
      setDownloadingReportId(`${sessionId}-csv`);
      const res = await api.get(`/quiz-sessions/${sessionId}/report-csv`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (title || 'quiz-session').replace(/[^a-zA-Z0-9-_]/g, '_');
      link.setAttribute('download', `Quiz_Roster_${safeTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download CSV report:', err);
      alert('Failed to download quiz CSV export.');
    } finally {
      setDownloadingReportId(null);
    }
  };

    const openRoster = (sessionId: string) => {
    setRosterLoading(true);
    const session = sessions.find(s => s.id === sessionId) || null;
    setSelectedSessionForRoster(session);
    api.get(`/quiz-sessions/${sessionId}`)
      .then(res => {
        setSessionDetails(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setRosterLoading(false));
  };

  // Filtered sessions with search
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (filterTab !== 'ALL' && s.status !== filterTab) return false;
      if (sessionSearch.trim()) {
        const q = sessionSearch.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchPin = s.pin.includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchDept = (s.target_department || '').toLowerCase().includes(q);
        const matchComm = (s.target_community || '').toLowerCase().includes(q);
        return matchTitle || matchPin || matchDesc || matchDept || matchComm;
      }
      return true;
    });
  }, [sessions, filterTab, sessionSearch]);

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const scheduledCount = sessions.filter(s => s.status === 'SCHEDULED').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalParticipants = sessions.reduce((acc, s) => acc + (s.participant_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner - Rich Dark Aesthetic matching Email Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-extrabold tracking-wide uppercase flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Live Quiz Session Arena</span>
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[11px] font-mono flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Synchronized Timed Competitions</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Interactive Quiz Sessions & Leaderboards
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Host real-time speed tests and peer competitions. Students enter via 6-digit Join PINs into the live lobby, submit timed answers simultaneously, and rank on live leaderboards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quiz Session</span>
            </button>

            <button
              onClick={fetchSessions}
              disabled={loading}
              className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Quiz Sessions"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-amber-800/30 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Total Quiz Sessions</div>
            <div className="text-2xl font-black text-amber-300 mt-1">{sessions.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Created across departments</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Active Live Rooms</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center space-x-2">
              <span>{activeCount}</span>
              {activeCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Accepting student entries</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Completed Sessions</div>
            <div className="text-2xl font-black text-purple-300 mt-1">{completedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{scheduledCount} scheduled upcoming</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Total Students Competed</div>
            <div className="text-2xl font-black text-sky-300 mt-1">{totalParticipants}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Submissions recorded</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-5 py-4 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                filterTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab === 'ALL' ? 'All Quizzes' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterTab === tab ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab === 'ALL' ? sessions.length :
                 tab === 'ACTIVE' ? activeCount :
                 tab === 'SCHEDULED' ? scheduledCount : completedCount}
              </span>
            </button>
          ))}
        </div>

        {/* Right Tools: Live Search & Bulk Delete */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, PIN, department..."
              value={sessionSearch}
              onChange={e => setSessionSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
            />
            {sessionSearch && (
              <button
                onClick={() => setSessionSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bulk delete completed quizzes button */}
          {completedCount > 0 && (
            <button
              onClick={handleBulkDeleteCompleted}
              disabled={bulkDeleting}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Delete all finished quiz sessions"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Clean Completed ({completedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quiz Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse border border-slate-200" />
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse border border-slate-200" />
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse border border-slate-200" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Zap className="w-8 h-8 fill-amber-400" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            {sessionSearch ? 'No matching quiz sessions found' : 'No quiz sessions created yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {sessionSearch
              ? `No quiz matches "${sessionSearch}". Try adjusting your keyword or reset filters.`
              : 'Create your first live quiz session to conduct synchronized speed tests or competitions among students.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {sessionSearch && (
              <button
                onClick={() => setSessionSearch('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Quiz Session</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const isActive = session.status === 'ACTIVE';
            const isScheduled = session.status === 'SCHEDULED';
            const isCompleted = session.status === 'COMPLETED';

            return (
              <div 
                key={session.id} 
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:border-amber-400/50 group"
              >
                <div>
                  {/* Top Bar: Status Badge & Interactive PIN Pill */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5 ${
                      isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      isScheduled ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-0.5" />}
                      <span>{session.status}</span>
                    </span>

                    {/* Join PIN Pill with Click-To-Copy */}
                    <button 
                      type="button"
                      onClick={() => handleCopyPin(session.pin)}
                      className="bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200 border border-amber-300 text-amber-950 font-mono font-black text-xs px-3 py-1 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all transform active:scale-95"
                      title="Click to copy 6-digit Join PIN"
                    >
                      <span className="text-[10px] text-amber-700 font-sans font-extrabold uppercase tracking-wide">PIN:</span>
                      <span className="tracking-wider">{session.pin}</span>
                      {copiedPin === session.pin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-amber-700" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-base break-words line-clamp-1 group-hover:text-amber-800 transition-colors">
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 break-words line-clamp-2 leading-relaxed">
                    {session.description || 'No specific instructions provided.'}
                  </p>

                  {/* Metadata Chips Grid */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: <strong>{session.duration_minutes} mins</strong></span>
                      </span>
                      <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-lg">
                        {session.question_ids?.length || 0} Questions
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Audience:</span>
                      <span className="font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 truncate max-w-[180px]">
                        {session.target_type === 'ALL'
                          ? 'All Students'
                          : session.target_type === 'DEPARTMENT'
                          ? `Dept: ${session.target_department}`
                          : session.target_community}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Participants Progress:</span>
                        </span>
                        <span className="font-black text-slate-900">
                          {session.submitted_count || 0} / {session.participant_count || 0} Finished
                        </span>
                      </div>
                      {(session.participant_count || 0) > 0 && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              session.all_students_finished 
                                ? 'bg-emerald-500' 
                                : 'bg-gradient-to-r from-amber-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round(((session.submitted_count || 0) / (session.participant_count || 1)) * 100))}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {session.all_students_finished && isActive && (
                      <div className="bg-emerald-50 border border-emerald-300/80 rounded-xl p-2.5 flex items-center space-x-2 text-[11px] text-emerald-900 font-extrabold animate-pulse">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All students finished! Ready to publish final ranks.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Row with Live Roster and Controls */}
                <div className="pt-3.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openRoster(session.id)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Roster ({session.participant_count || 0})</span>
                    </button>

                    {isActive ? (
                      <button
                        onClick={() => handleStatusChange(session.id, 'COMPLETED')}
                        className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        title="End Active Quiz Session"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : isScheduled ? (
                      <button
                        onClick={() => handleStatusChange(session.id, 'ACTIVE')}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        title="Activate / Start Session Now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}

                    {/* PROMINENT DELETE BUTTON */}
                    <button
                      onClick={(e) => handlePromptDelete(session, e)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title={`Delete Quiz: "${session.title}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Publish Results Action for Active Sessions */}
                  {isActive && (
                    <button
                      onClick={() => handlePublishResults(session.id)}
                      disabled={publishingSessionId === session.id}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md transform active:scale-98 ${
                        session.all_students_finished
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white animate-pulse shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-amber-500/20'
                      }`}
                      title="Calculate cohort ranks and publish results to all students"
                    >
                      {publishingSessionId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Award className="w-4 h-4 text-amber-200" />
                      )}
                      <span>{publishingSessionId === session.id ? 'Publishing Ranks...' : 'Publish Results & Calculate Final Ranks'}</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl py-2 px-3 flex items-center justify-center space-x-2 text-[11px] font-black text-purple-800">
                      <CheckCheck className="w-4 h-4 text-purple-600" />
                      <span>Cohort Ranks Analyzed & Published</span>
                    </div>
                  )}

                  {/* Report Download Shortcuts */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPdfReport(session.id, session.title)}
                      disabled={downloadingReportId === `${session.id}-pdf`}
                      className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Download full analytics PDF report"
                    >
                      {downloadingReportId === `${session.id}-pdf` ? (
                        <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                      ) : (
                        <FileDown className="w-3 h-3 text-sky-600" />
                      )}
                      <span>PDF Report</span>
                    </button>

                    <button
                      onClick={() => handleDownloadCsvReport(session.id, session.title)}
                      disabled={downloadingReportId === `${session.id}-csv`}
                      className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Export roster and results as CSV spreadsheet"
                    >
                      {downloadingReportId === `${session.id}-csv` ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                      ) : (
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>CSV Export</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEDICATED DELETE CONFIRMATION MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 border border-rose-100">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base tracking-tight">
                  Delete Quiz Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent removal from portal database
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-xs text-rose-950">
              <div>
                <span className="font-bold text-slate-600 text-[11px] block">Quiz Session Title:</span>
                <span className="font-black text-sm text-slate-900">{sessionToDelete.title}</span>
              </div>
              
              <div className="flex items-center space-x-2 font-mono text-xs pt-1">
                <span className="px-2.5 py-0.5 bg-white border border-rose-200 rounded-lg font-bold text-rose-800">
                  PIN: {sessionToDelete.pin}
                </span>
                <span className="text-slate-600">
                  • {sessionToDelete.participant_count || 0} participants recorded
                </span>
              </div>

              <p className="text-[11px] text-rose-800 pt-1 leading-relaxed">
                ⚠️ All participant responses, MCQ submissions, accuracy metrics, and leaderboard records for this quiz will be <strong>permanently deleted</strong>.
              </p>
            </div>

            <div className="flex justify-end items-center space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={deletingSession}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingSession}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingSession ? 'Deleting Quiz...' : 'Yes, Delete Quiz Session'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                  <Zap className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base tracking-tight">
                    Create Live Quiz Session
                  </h3>
                  <p className="text-xs text-slate-500">Configure quiz parameters, question pool, and 6-digit Join PIN</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              
              {/* Title & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 2 Multi-Agent Speed Quiz"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (mins) *</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 15 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Rules</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Synchronized timed session. Fastest correct answers receive rank advantage."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                />
              </div>

              {/* 6-Digit PIN & Target Cohort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-extrabold text-amber-950">6-Digit Join PIN *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pin: generateRandomPin() })}
                      className="text-[10px] text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      Generate New
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-mono text-center font-black text-xl tracking-widest text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-amber-950 mb-1">Target Audience</label>
                  <select
                    value={formData.target_type}
                    onChange={e => setFormData({ ...formData, target_type: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="ALL">All Students (Whole Portal)</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="COMMUNITY">Specific Community</option>
                  </select>
                </div>
              </div>

              {/* Department / Community Sub-selectors */}
              {formData.target_type === 'DEPARTMENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.target_department}
                    onChange={e => setFormData({ ...formData, target_department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d} Department</option>)}
                  </select>
                </div>
              )}

              {formData.target_type === 'COMMUNITY' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Community Cohort</label>
                  <select
                    value={formData.target_community}
                    onChange={e => setFormData({ ...formData, target_community: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Question Selection Mode */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-extrabold text-slate-800">Quiz Questions Source</label>
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="source_type"
                        checked={formData.source_type === 'QUESTIONS'}
                        onChange={() => setFormData({ ...formData, source_type: 'QUESTIONS' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>Question Bank ({selectedQuestionIds.length} chosen)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="source_type"
                        checked={formData.source_type === 'ASSESSMENT'}
                        onChange={() => setFormData({ ...formData, source_type: 'ASSESSMENT' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>From Assessment</span>
                    </label>
                  </div>
                </div>

                {formData.source_type === 'ASSESSMENT' ? (
                  <div>
                    <select
                      value={formData.assessment_id}
                      onChange={e => setFormData({ ...formData, assessment_id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="">-- Choose an Assessment --</option>
                      {availableAssessments.map(a => (
                        <option key={a.id} value={a.id}>{a.title} ({a.question_ids?.length || 0} questions)</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                      <span>Select questions ({selectedQuestionIds.length} of {availableQuestions.length} selected):</span>
                      <a 
                        href="/admin/question-bank" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Add Questions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search questions by topic or keyword..."
                          value={questionSearch}
                          onChange={e => setQuestionSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectRandomQuestions(5)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Random 5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectRandomQuestions(10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Random 10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectRandomQuestions(25)}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Random 25
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionIds(availableQuestions.map(q => q.id))}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Select All
                        </button>
                        {selectedQuestionIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedQuestionIds([])}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {availableQuestions
                        .filter(q => !questionSearch || q.question_text.toLowerCase().includes(questionSearch.toLowerCase()) || q.topic?.toLowerCase().includes(questionSearch.toLowerCase()))
                        .map(q => {
                          const isSelected = selectedQuestionIds.includes(q.id);
                          return (
                            <div 
                              key={q.id} 
                              onClick={() => toggleQuestionSelection(q.id)}
                              className={`p-2.5 flex items-start space-x-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-amber-50/70' : ''
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => {}} 
                                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 line-clamp-1">{q.question_text}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-bold text-purple-700">{q.topic || 'General'}</span>
                                  <span>•</span>
                                  <span>Diff: {q.difficulty}</span>
                                  <span>•</span>
                                  <span>Marks: {q.marks}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Creating Session...' : 'Activate & Launch Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE ROSTER & LEADERBOARD MODAL (WITH DIRECT DELETE OPTION) */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 my-8">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    selectedSessionForRoster.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                    selectedSessionForRoster.status === 'SCHEDULED' ? 'bg-sky-100 text-sky-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedSessionForRoster.status}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedSessionForRoster.title}</h3>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    PIN: {selectedSessionForRoster.pin}
                  </span>
                  <span>Duration: {selectedSessionForRoster.duration_minutes} mins</span>
                  <span>Questions: {selectedSessionForRoster.question_ids?.length || 0}</span>
                </div>
              </div>

              {/* Header Actions: Download PDF, Export CSV, Refresh, Delete, Close */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdfReport(selectedSessionForRoster.id, selectedSessionForRoster.title)}
                  disabled={downloadingReportId === `${selectedSessionForRoster.id}-pdf`}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Download Complete PDF Session Report"
                >
                  {downloadingReportId === `${selectedSessionForRoster.id}-pdf` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-sky-600" />
                  )}
                  <span className="hidden sm:inline">PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCsvReport(selectedSessionForRoster.id, selectedSessionForRoster.title)}
                  disabled={downloadingReportId === `${selectedSessionForRoster.id}-csv`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Export Roster CSV"
                >
                  {downloadingReportId === `${selectedSessionForRoster.id}-csv` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => openRoster(selectedSessionForRoster.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                {/* DIRECT DELETE OPTION INSIDE ROSTER MODAL */}
                <button
                  type="button"
                  onClick={() => handlePromptDelete(selectedSessionForRoster)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                  title="Delete this quiz session"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSessionForRoster(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Progress & Final Publish Action Banner */}
            <div className={`p-4 rounded-2xl border transition-all ${
              selectedSessionForRoster.status === 'COMPLETED'
                ? 'bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border-purple-200'
                : selectedSessionForRoster.all_students_finished || (sessionDetails?.participants?.length && sessionDetails?.participants?.every(p => p.status === 'SUBMITTED' || p.status === 'TIMED_OUT'))
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 shadow-sm'
                : 'bg-gradient-to-r from-amber-50/70 via-slate-50 to-purple-50/50 border-amber-200/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {selectedSessionForRoster.status === 'COMPLETED' ? (
                      <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                        <Award className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg animate-pulse">
                        <Sparkles className="w-4 h-4" />
                      </span>
                    )}
                    <h4 className="font-black text-slate-900 text-sm">
                      {selectedSessionForRoster.status === 'COMPLETED'
                        ? 'Official Cohort Ranks Locked & Published'
                        : selectedSessionForRoster.all_students_finished || (sessionDetails?.participants?.length && sessionDetails?.participants?.every(p => p.status === 'SUBMITTED' || p.status === 'TIMED_OUT'))
                        ? 'All Students Finished! Ready to Reveal Ranks'
                        : 'Cohort Live Progress & Waiting Room'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {selectedSessionForRoster.status === 'COMPLETED'
                      ? 'Students have been granted access to their official cohort ranks, tie-breaker results, and answer explanations.'
                      : 'Students who submit their test wait in the lobby until you trigger the final rank calculation option.'}
                  </p>
                </div>

                {selectedSessionForRoster.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handlePublishResults(selectedSessionForRoster.id)}
                    disabled={publishingSessionId === selectedSessionForRoster.id}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer transition-all transform active:scale-95 shrink-0"
                  >
                    {publishingSessionId === selectedSessionForRoster.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Award className="w-4 h-4 text-emerald-200" />
                    )}
                    <span>Publish Results & Calculate Final Ranks</span>
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-800">
                    {sessionDetails?.participants?.filter(p => p.status === 'SUBMITTED' || p.status === 'TIMED_OUT').length || selectedSessionForRoster.submitted_count || 0}
                  </span>
                  <span>of</span>
                  <span className="font-extrabold text-slate-800">
                    {sessionDetails?.participants?.length || selectedSessionForRoster.participant_count || 0} Students Submitted
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800">
                  {Math.round((((sessionDetails?.participants?.filter(p => p.status === 'SUBMITTED' || p.status === 'TIMED_OUT').length || selectedSessionForRoster.submitted_count || 0) / Math.max(1, (sessionDetails?.participants?.length || selectedSessionForRoster.participant_count || 1)))) * 100)}% Complete
                </span>
              </div>
            </div>

            {/* Roster / Leaderboard Content */}
            {rosterLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-bold flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span>Loading live session roster & leaderboard...</span>
              </div>
            ) : !sessionDetails || (sessionDetails.participants?.length === 0) ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-800 text-base">No students joined this session yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Share the 6-digit Join PIN <strong className="text-amber-800 font-mono text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{selectedSessionForRoster.pin}</strong> with your students to enter the live room.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-5 pr-1 text-xs">
                
                {/* Leaderboard Table */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Live Leaderboard & Submissions ({sessionDetails.leaderboard?.length || 0})</span>
                    </h4>
                  </div>
                  
                  {sessionDetails.leaderboard && sessionDetails.leaderboard.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-extrabold text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Reg Number</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Accuracy</th>
                            <th className="p-3">Time</th>
                            <th className="p-3 text-center">Tab Switches</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sessionDetails.leaderboard.map((lb) => (
                            <tr key={lb.student_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-black">
                                {selectedSessionForRoster.status === 'COMPLETED' ? (
                                  lb.rank === 1 ? '🥇 1st' : lb.rank === 2 ? '🥈 2nd' : lb.rank === 3 ? '🥉 3rd' : `#${lb.rank}`
                                ) : lb.rank ? (
                                  lb.rank === 1 ? '🥇 1st' : lb.rank === 2 ? '🥈 2nd' : lb.rank === 3 ? '🥉 3rd' : `#${lb.rank}`
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    Pending Publish
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-extrabold text-slate-800 max-w-[160px] truncate">{lb.student_name}</td>
                              <td className="p-3 font-mono text-slate-500 font-medium">{lb.student_reg}</td>
                              <td className="p-3 font-black text-emerald-700">{lb.score} / {lb.max_score}</td>
                              <td className="p-3 font-bold text-purple-700">{lb.percentage}%</td>
                              <td className="p-3 text-slate-500 font-mono">{lb.time_taken_seconds}s</td>
                              <td className="p-3 text-center">
                                {(lb.tab_switches_count || 0) > 0 ? (
                                  <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs">
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span>{lb.tab_switches_count} switch{(lb.tab_switches_count || 0) > 1 ? 'es' : ''}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>0 (Clean)</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      Students are currently in the lobby or taking the quiz. Submissions will populate here live upon completion.
                    </p>
                  )}
                </div>

                {/* All Joined Participants List */}
                <div>
                  <h4 className="font-extrabold text-slate-900 mb-2.5 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Lobby Participants ({sessionDetails.participants?.length || 0})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {sessionDetails.participants?.map((p: QuizSessionParticipant) => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between min-w-0">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="font-extrabold text-slate-800 truncate">{p.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{p.student_reg} • {p.student_department}</p>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {(p.tab_switches_count || 0) > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{p.tab_switches_count} exit{(p.tab_switches_count || 0) > 1 ? 's' : ''}</span>
                            </span>
                          )}
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            p.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                            'bg-sky-100 text-sky-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer with Close, Delete, and Download actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePromptDelete(selectedSessionForRoster)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdfReport(selectedSessionForRoster.id, selectedSessionForRoster.title)}
                  disabled={downloadingReportId === `${selectedSessionForRoster.id}-pdf`}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadingReportId === `${selectedSessionForRoster.id}-pdf` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCsvReport(selectedSessionForRoster.id, selectedSessionForRoster.title)}
                  disabled={downloadingReportId === `${selectedSessionForRoster.id}-csv`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadingReportId === `${selectedSessionForRoster.id}-csv` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Export CSV</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSessionForRoster(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuizSessions;
