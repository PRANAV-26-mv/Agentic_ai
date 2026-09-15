import React, { useState, useEffect } from 'react';
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
  ExternalLink
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
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<QuizSession | null>(null);
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [sessionDetails, setSessionDetails] = useState<QuizSession | null>(null);

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

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete quiz session "${title}"? All participant responses will be erased.`)) return;
    try {
      await api.delete(`/quiz-sessions/${sessionId}`);
      setSuccessMsg('Quiz session deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchSessions();
      if (selectedSessionForRoster?.id === sessionId) {
        setSelectedSessionForRoster(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete session.');
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

  // Filtered sessions
  const filteredSessions = sessions.filter(s => {
    if (filterTab === 'ALL') return true;
    return s.status === filterTab;
  });

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const scheduledCount = sessions.filter(s => s.status === 'SCHEDULED').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalParticipants = sessions.reduce((acc, s) => acc + (s.participant_count || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Dedicated Live Quiz Sessions</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Conduct synchronized timed quiz competitions among students with instant Join PINs, live participant lobby, and real-time leaderboards.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quiz Session</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Live Active Now</p>
            <p className="text-xl font-black text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Scheduled</p>
            <p className="text-xl font-black text-slate-900">{scheduledCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Joined</p>
            <p className="text-xl font-black text-slate-900">{totalParticipants}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Completed</p>
            <p className="text-xl font-black text-slate-900">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        {(['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab === 'ALL' ? 'All Sessions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No quiz sessions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create a live quiz session to conduct synchronized speed tests or competitions among students.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Quiz Session</span>
          </button>
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
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Status & PIN */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                      isActive ? 'bg-emerald-100 text-emerald-800' :
                      isScheduled ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />}
                      <span>{session.status}</span>
                    </span>

                    {/* Join PIN Pill */}
                    <div 
                      onClick={() => handleCopyPin(session.pin)}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-mono font-black text-xs px-2.5 py-1 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                      title="Click to copy 6-digit Join PIN"
                    >
                      <span className="text-[10px] text-amber-700 font-sans font-bold">PIN:</span>
                      <span>{session.pin}</span>
                      {copiedPin === session.pin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{session.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {session.description || 'No instructions provided.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: <strong>{session.duration_minutes} mins</strong></span>
                      </span>
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {session.question_ids?.length || 0} Questions
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span className="font-bold text-slate-700">
                        {session.target_type === 'ALL'
                          ? 'All Cohorts'
                          : session.target_type === 'DEPARTMENT'
                          ? `Dept: ${session.target_department}`
                          : session.target_community}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lobby Joined:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {session.participant_count || 0} students ({session.submitted_count || 0} submitted)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openRoster(session.id)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Live Roster ({session.participant_count || 0})</span>
                  </button>

                  {isActive ? (
                    <button
                      onClick={() => handleStatusChange(session.id, 'COMPLETED')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      title="End Session"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : isScheduled ? (
                    <button
                      onClick={() => handleStatusChange(session.id, 'ACTIVE')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      title="Start Session Now"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleDeleteSession(session.id, session.title)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Create Live Quiz Session</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none font-medium"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Rules</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 10 MCQs. Synchronized timed session. Fastest answers receive rank advantage."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* 6-Digit PIN & Target Cohort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-amber-900">6-Digit Join PIN *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pin: generateRandomPin() })}
                      className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-mono text-center font-black text-lg tracking-widest text-amber-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Target Audience</label>
                  <select
                    value={formData.target_type}
                    onChange={e => setFormData({ ...formData, target_type: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-700 focus:outline-none"
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
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Quiz Content Source</label>
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="flex items-center space-x-1 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="source_type"
                        checked={formData.source_type === 'QUESTIONS'}
                        onChange={() => setFormData({ ...formData, source_type: 'QUESTIONS' })}
                      />
                      <span>Question Bank ({selectedQuestionIds.length} chosen)</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="source_type"
                        checked={formData.source_type === 'ASSESSMENT'}
                        onChange={() => setFormData({ ...formData, source_type: 'ASSESSMENT' })}
                      />
                      <span>Use Existing Assessment</span>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                      <span>Select questions below ({selectedQuestionIds.length} of {availableQuestions.length} chosen):</span>
                      <a 
                        href="/admin/question-bank" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Add / Generate Questions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search questions by topic or text..."
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
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Random 25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectRandomQuestions(50)}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Random 50
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

                    <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                      {availableQuestions
                        .filter(q => !questionSearch || q.question_text.toLowerCase().includes(questionSearch.toLowerCase()) || q.topic?.toLowerCase().includes(questionSearch.toLowerCase()))
                        .map(q => {
                          const isSelected = selectedQuestionIds.includes(q.id);
                          return (
                            <div 
                              key={q.id} 
                              onClick={() => toggleQuestionSelection(q.id)}
                              className={`p-2.5 flex items-start space-x-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-amber-50/60' : ''
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

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Session...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Launch Session Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE ROSTER & LEADERBOARD DRAWER */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedSessionForRoster.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedSessionForRoster.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedSessionForRoster.status}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    PIN: {selectedSessionForRoster.pin}
                  </span>
                  <span>Duration: {selectedSessionForRoster.duration_minutes} mins</span>
                  <span>Questions: {selectedSessionForRoster.question_ids?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openRoster(selectedSessionForRoster.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setSelectedSessionForRoster(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Roster / Leaderboard Content */}
            {rosterLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
                Loading live session roster & leaderboard...
              </div>
            ) : !sessionDetails || (sessionDetails.participants?.length === 0) ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No students joined this session yet</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Share the 6-digit Join PIN <strong className="text-amber-600 font-mono text-sm">{selectedSessionForRoster.pin}</strong> with your students to enter the lobby.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                
                {/* Leaderboard Table */}
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center space-x-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Live Leaderboard & Submissions ({sessionDetails.leaderboard?.length || 0})</span>
                  </h4>
                  
                  {sessionDetails.leaderboard && sessionDetails.leaderboard.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Rank</th>
                            <th className="p-2.5">Student</th>
                            <th className="p-2.5">Reg No.</th>
                            <th className="p-2.5">Score</th>
                            <th className="p-2.5">Accuracy</th>
                            <th className="p-2.5">Time Taken</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sessionDetails.leaderboard.map((lb) => (
                            <tr key={lb.student_id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-black">
                                {lb.rank === 1 ? '🥇 1' : lb.rank === 2 ? '🥈 2' : lb.rank === 3 ? '🥉 3' : lb.rank}
                              </td>
                              <td className="p-2.5 font-bold text-slate-800">{lb.student_name}</td>
                              <td className="p-2.5 font-mono text-slate-500">{lb.student_reg}</td>
                              <td className="p-2.5 font-black text-emerald-700">{lb.score} / {lb.max_score}</td>
                              <td className="p-2.5 font-bold text-purple-700">{lb.percentage}%</td>
                              <td className="p-2.5 text-slate-500">{lb.time_taken_seconds}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                      Students are currently in the lobby or taking the quiz. Submissions will appear here live.
                    </p>
                  )}
                </div>

                {/* All Joined Participants List */}
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Lobby Participants ({sessionDetails.participants?.length || 0})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {sessionDetails.participants?.map((p: QuizSessionParticipant) => (
                      <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{p.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.student_reg} • {p.student_department}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
