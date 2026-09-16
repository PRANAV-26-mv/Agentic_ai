import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmailLog } from '../types';
import { 
  Mail, 
  Send, 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Clock, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  X, 
  ChevronRight,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface RecipientStudent {
  id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
  year: number;
  community: string;
  status: string;
}

interface RecipientAdmin {
  id: string;
  name: string;
  email: string;
  department: string;
  is_super_admin: boolean;
}

export const EmailBroadcastPage: React.FC = () => {
  const { user } = useAuth();

  // Recipient lists fetched from server
  const [students, setStudents] = useState<RecipientStudent[]>([]);
  const [admins, setAdmins] = useState<RecipientAdmin[]>([]);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [history, setHistory] = useState<EmailLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Email Composer Form State
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [category, setCategory] = useState<'GENERAL' | 'ANNOUNCEMENT' | 'ASSESSMENT' | 'URGENT'>('GENERAL');

  // Selected Recipient Email Sets
  const [selectedStudentEmails, setSelectedStudentEmails] = useState<Set<string>>(new Set());
  const [selectedAdminEmails, setSelectedAdminEmails] = useState<Set<string>>(new Set());
  const [customEmailsInput, setCustomEmailsInput] = useState<string>('');

  // Active View Tabs
  const [activeMainTab, setActiveMainTab] = useState<'compose' | 'history'>('compose');
  const [recipientTab, setRecipientTab] = useState<'students' | 'admins' | 'custom'>('students');

  // Filters & Search
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentDeptFilter, setStudentDeptFilter] = useState<string>('');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('');
  const [adminSearch, setAdminSearch] = useState<string>('');

  // Modals & Messages
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewLogItem, setPreviewLogItem] = useState<EmailLog | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [recipRes, histRes] = await Promise.all([
        api.get('/email-broadcast/recipients'),
        api.get('/email-broadcast/history')
      ]);

      setStudents(recipRes.data?.students || []);
      setAdmins(recipRes.data?.admins || []);
      setSmtpStatus(recipRes.data?.smtp_status || null);
      setHistory(histRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load recipients or broadcast history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 6000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 6000);
    }
  };

  // Parse custom emails
  const parsedCustomEmails = useMemo(() => {
    if (!customEmailsInput.trim()) return [];
    return Array.from(new Set(
      customEmailsInput
        .split(/[,\n\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    ));
  }, [customEmailsInput]);

  // Combined total list of unique selected recipient emails
  const allSelectedEmails = useMemo(() => {
    const set = new Set<string>();
    selectedStudentEmails.forEach(e => set.add(e.toLowerCase()));
    selectedAdminEmails.forEach(e => set.add(e.toLowerCase()));
    parsedCustomEmails.forEach(e => set.add(e.toLowerCase()));
    return Array.from(set);
  }, [selectedStudentEmails, selectedAdminEmails, parsedCustomEmails]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (studentDeptFilter && s.department !== studentDeptFilter) return false;
      if (studentYearFilter && s.year !== Number(studentYearFilter)) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
               s.email.toLowerCase().includes(q) ||
               s.student_id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, studentDeptFilter, studentYearFilter, studentSearch]);

  // Filtered admins list
  const filteredAdmins = useMemo(() => {
    if (!adminSearch.trim()) return admins;
    const q = adminSearch.toLowerCase();
    return admins.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q)
    );
  }, [admins, adminSearch]);

  // Selection handlers
  const handleSelectAllStudents = () => {
    const set = new Set(selectedStudentEmails);
    filteredStudents.forEach(s => set.add(s.email.toLowerCase()));
    setSelectedStudentEmails(set);
  };

  const handleDeselectAllStudents = () => {
    const filteredEmailSet = new Set(filteredStudents.map(s => s.email.toLowerCase()));
    const nextSet = new Set(
      Array.from(selectedStudentEmails).filter(email => !filteredEmailSet.has(email))
    );
    setSelectedStudentEmails(nextSet);
  };

  const toggleStudentEmail = (email: string) => {
    const clean = email.toLowerCase();
    const next = new Set(selectedStudentEmails);
    if (next.has(clean)) {
      next.delete(clean);
    } else {
      next.add(clean);
    }
    setSelectedStudentEmails(next);
  };

  const handleSelectAllAdmins = () => {
    const set = new Set<string>();
    admins.forEach(a => set.add(a.email.toLowerCase()));
    setSelectedAdminEmails(set);
  };

  const handleDeselectAllAdmins = () => {
    setSelectedAdminEmails(new Set());
  };

  const toggleAdminEmail = (email: string) => {
    const clean = email.toLowerCase();
    const next = new Set(selectedAdminEmails);
    if (next.has(clean)) {
      next.delete(clean);
    } else {
      next.add(clean);
    }
    setSelectedAdminEmails(next);
  };

  const handleClearAllSelections = () => {
    setSelectedStudentEmails(new Set());
    setSelectedAdminEmails(new Set());
    setCustomEmailsInput('');
  };

  // Quick Preset Templates
  const handleApplyTemplate = (type: 'ASSESSMENT' | 'ANNOUNCEMENT' | 'MAINTENANCE') => {
    if (type === 'ASSESSMENT') {
      setCategory('ASSESSMENT');
      setSubject('Reminder: Upcoming Technical Assessment & Practice Modules');
      setMessage(
        `Dear Students,\n\nPlease be informed that your scheduled technical assessment is approaching. Ensure you have reviewed all study materials and completed the required preparatory modules on the Student Portal.\n\nKey Guidelines:\n1. Maintain stable internet connectivity.\n2. Do not switch tabs during the assessment to avoid proctoring flags.\n3. Complete submission before the allocated timer expires.\n\nBest regards,\nDepartment Faculty & Examination Cell`
      );
    } else if (type === 'ANNOUNCEMENT') {
      setCategory('ANNOUNCEMENT');
      setSubject('Official Campus Announcement: New Learning Modules & Communities');
      setMessage(
        `Dear Students & Faculty Members,\n\nWe are pleased to announce the release of new interactive curriculum materials and specialized community cohorts on the portal.\n\nAll registered students are encouraged to explore the Materials and Practice Quiz sections to boost their technical scores and rankings.\n\nWarm regards,\nPortal Academic Directorate`
      );
    } else if (type === 'MAINTENANCE') {
      setCategory('URGENT');
      setSubject('Notice: Scheduled Portal Maintenance Window');
      setMessage(
        `Attention All Portal Users,\n\nThe Student Assessment & Learning Portal will undergo scheduled technical maintenance tonight to upgrade system performance and database synchronization.\n\nDuring this window, assessment submissions may be momentarily paused. Please plan your sessions accordingly.\n\nThank you for your cooperation,\nPortal Systems & IT Administration`
      );
    }
  };

  // Send Email Broadcast
  const handleSendBroadcast = async () => {
    if (!subject.trim()) {
      showNotification('error', 'Please provide an Email Subject before sending.');
      return;
    }

    if (!message.trim()) {
      showNotification('error', 'Please enter an Email Message body.');
      return;
    }

    if (allSelectedEmails.length === 0) {
      showNotification('error', 'Please select at least one recipient email address (students, admins, or custom).');
      return;
    }

    const confirmMsg = `Are you sure you want to DISPATCH this email broadcast?\n\nSubject: "${subject}"\nTotal Recipients: ${allSelectedEmails.length}\n• Students: ${selectedStudentEmails.size}\n• Admins: ${selectedAdminEmails.size}\n• Custom: ${parsedCustomEmails.length}`;
    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    try {
      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        category,
        selected_emails: allSelectedEmails,
        recipient_breakdown: {
          students: selectedStudentEmails.size,
          admins: selectedAdminEmails.size,
          custom: parsedCustomEmails.length
        }
      };

      const res = await api.post('/email-broadcast/send', payload);
      showNotification('success', res.data?.message || 'Email broadcast successfully dispatched!');

      // Reset form
      setSubject('');
      setMessage('');
      handleClearAllSelections();
      setShowPreviewModal(false);

      // Refresh sent history
      fetchData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to dispatch email broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[11px] font-extrabold tracking-wide uppercase flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Communication Hub</span>
              </span>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-[11px] font-mono flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Admins & Super Admin</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Email Dispatcher & Student Broadcast
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Compose and send official emails to all students, filtered departments, faculty admins, or custom email lists.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Recipients and History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-800/30 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Registered Students</div>
            <div className="text-2xl font-black text-purple-300 mt-1">{students.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Eligible student emails</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Faculty / Admin Members</div>
            <div className="text-2xl font-black text-sky-300 mt-1">{admins.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Faculty emails</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Selected Recipients</div>
            <div className={`text-2xl font-black mt-1 ${allSelectedEmails.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {allSelectedEmails.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {selectedStudentEmails.size} std • {selectedAdminEmails.size} adm • {parsedCustomEmails.length} custom
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Delivery Engine</div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-2 truncate">
              {smtpStatus?.is_configured ? 'Live SMTP Active' : 'Persistent Storage Dispatch'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 inline" />
              <span>Ready to Send</span>
            </div>
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

      {/* Top Navigation Tabs (Compose vs Sent History) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('compose')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeMainTab === 'compose'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Compose & Dispatch ({allSelectedEmails.length} Selected)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('history')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeMainTab === 'history'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Broadcast History ({history.length})</span>
        </button>
      </div>

      {/* TAB 1: COMPOSE & SEND */}
      {activeMainTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Email Composer (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Email Composition</span>
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Write the email subject and message. You can also pick a preset template.
                </p>
              </div>

              {/* Template Presets */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('ASSESSMENT')}
                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-sky-200"
                >
                  Assessment
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('ANNOUNCEMENT')}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-purple-200"
                >
                  Announcement
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('MAINTENANCE')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-amber-200"
                >
                  Notice
                </button>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Notice Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['GENERAL', 'ANNOUNCEMENT', 'ASSESSMENT', 'URGENT'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                      category === cat
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'GENERAL' && '📌 General'}
                    {cat === 'ANNOUNCEMENT' && '📢 Announcement'}
                    {cat === 'ASSESSMENT' && '📝 Assessment'}
                    {cat === 'URGENT' && '🚨 Urgent'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Subject Line *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{subject.length} chars</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Guidelines: Upcoming Agentic AI Assessment"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Message Body Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Message Content (HTML Formatted upon send) *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{message.length} chars</span>
              </div>
              <textarea
                required
                rows={9}
                placeholder="Write your email message here... (Paragraphs are automatically formatted in the HTML template)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Sender Footnote */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Dispatching as:</span> {user?.name} ({user?.email})
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-md text-[10px]">
                {user?.role}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                disabled={!subject.trim() || !message.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-extrabold rounded-xl border border-slate-200 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Preview Email</span>
              </button>

              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={sending || allSelectedEmails.length === 0 || !subject.trim() || !message.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending Broadcast...' : `Send Email to ${allSelectedEmails.length} Recipients`}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Recipient Selector Matrix (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Select Recipients</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Pick students, admins, or enter custom emails.
                </p>
              </div>

              {allSelectedEmails.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelections}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Clear All ({allSelectedEmails.length})
                </button>
              )}
            </div>

            {/* Recipient Category Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setRecipientTab('students')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  recipientTab === 'students' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Students ({selectedStudentEmails.size})
              </button>

              <button
                type="button"
                onClick={() => setRecipientTab('admins')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  recipientTab === 'admins' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Admins ({selectedAdminEmails.size})
              </button>

              <button
                type="button"
                onClick={() => setRecipientTab('custom')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  recipientTab === 'custom' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Custom ({parsedCustomEmails.length})
              </button>
            </div>

            {/* TAB: STUDENTS RECIPIENTS */}
            {recipientTab === 'students' && (
              <div className="space-y-3">
                {/* Search & Filters */}
                <div className="space-y-2 text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student name, ID, or email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <select
                      value={studentDeptFilter}
                      onChange={(e) => setStudentDeptFilter(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                    >
                      <option value="">All Departments</option>
                      <option value="CS">Computer Science (CS)</option>
                      <option value="AD">AI & Data (AD)</option>
                      <option value="IT">Information Tech (IT)</option>
                      <option value="AL">AI & ML (AL)</option>
                    </select>

                    <select
                      value={studentYearFilter}
                      onChange={(e) => setStudentYearFilter(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                    >
                      <option value="">All Years</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                </div>

                {/* Quick Toggle Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-500">
                    Visible: {filteredStudents.length} Students
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllStudents}
                      className="text-purple-700 hover:text-purple-900 font-extrabold cursor-pointer"
                    >
                      Select All ({filteredStudents.length})
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllStudents}
                      className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                {/* Students Checkbox List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50 text-xs">
                  {filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-medium">
                      No students match current search or filter.
                    </div>
                  ) : (
                    filteredStudents.map((std) => {
                      const isSelected = selectedStudentEmails.has(std.email.toLowerCase());
                      return (
                        <div
                          key={std.id}
                          onClick={() => toggleStudentEmail(std.email)}
                          className={`p-3 flex items-start space-x-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50/80' : 'hover:bg-slate-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by container click
                            className="mt-1 w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate">{std.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                {std.department} (Yr {std.year})
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-purple-700 truncate mt-0.5">
                              {std.email}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {std.student_id}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: FACULTY / ADMINS RECIPIENTS */}
            {recipientTab === 'admins' && (
              <div className="space-y-3">
                <div className="relative text-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search admin member..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-500">
                    Total Admins: {filteredAdmins.length}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllAdmins}
                      className="text-purple-700 hover:text-purple-900 font-extrabold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllAdmins}
                      className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50 text-xs">
                  {filteredAdmins.map((adm) => {
                    const isSelected = selectedAdminEmails.has(adm.email.toLowerCase());
                    const isSuper = adm.is_super_admin || adm.email.toLowerCase() === 'pranavannur9659@gmail.com';
                    return (
                      <div
                        key={adm.id}
                        onClick={() => toggleAdminEmail(adm.email)}
                        className={`p-3 flex items-start space-x-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/80' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900 truncate">{adm.name}</span>
                            {isSuper && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded flex items-center space-x-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-600" />
                                <span>Super Admin</span>
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-purple-700 truncate mt-0.5">
                            {adm.email}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {adm.department}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: CUSTOM EMAILS */}
            {recipientTab === 'custom' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 text-xs">
                  Enter extra email addresses (separated by commas or new lines):
                </p>
                <textarea
                  rows={6}
                  placeholder="e.g. dean@college.edu, external.mentor@gmail.com"
                  value={customEmailsInput}
                  onChange={(e) => setCustomEmailsInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Detected valid addresses:</span>
                  <span className="font-mono font-bold text-purple-700">{parsedCustomEmails.length}</span>
                </div>
                {parsedCustomEmails.length > 0 && (
                  <div className="max-h-24 overflow-y-auto p-2 bg-slate-100 rounded-xl space-y-1 font-mono text-[10px] text-slate-700">
                    {parsedCustomEmails.map((e, idx) => (
                      <div key={idx} className="truncate">• {e}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary Box */}
            <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between font-extrabold text-purple-950">
                <span>Total Recipients Selected:</span>
                <span>{allSelectedEmails.length} Email{allSelectedEmails.length === 1 ? '' : 's'}</span>
              </div>
              <p className="text-[11px] text-purple-700">
                {selectedStudentEmails.size} student{selectedStudentEmails.size === 1 ? '' : 's'}, {selectedAdminEmails.size} admin{selectedAdminEmails.size === 1 ? '' : 's'}
                {parsedCustomEmails.length > 0 ? `, ${parsedCustomEmails.length} custom` : ''}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST HISTORY */}
      {activeMainTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Sent Email Broadcast Logs ({history.length})</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Record of all email dispatches sent to students and admins.
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Broadcasts Dispatched Yet</h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Use the "Compose & Dispatch" tab above to send your first student announcement or faculty email.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Recipients Count</th>
                    <th className="p-4">Sent By</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4 text-right">View Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900 max-w-xs truncate">
                        {log.subject}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[11px]">
                          {log.recipients_count} recipient{log.recipients_count === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800">{log.sent_by_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.sent_by_email}</div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 w-fit ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SIMULATED'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 inline" />
                          <span>{log.status === 'SENT' ? 'SMTP Delivered' : 'Simulated Delivery'}</span>
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 text-[11px]">
                        {new Date(log.sent_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewLogItem(log)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PREVIEW BEFORE SENDING */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Live Email Template Preview</span>
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mocked Email Envelope */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-5">
                <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {category} NOTICE
                </span>
                <h4 className="text-base font-extrabold mt-2 tracking-tight">{subject}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">Student Assessment & Learning Portal</p>
              </div>

              <div className="p-5 bg-white space-y-4">
                <div className="text-slate-700 whitespace-pre-line leading-relaxed text-xs">
                  {message}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-800">Sender:</span> {user?.name} ({user?.email})
                </div>
              </div>

              <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Official automated dispatch to {allSelectedEmails.length} recipients.
              </div>
            </div>

            {/* Recipient summary in modal */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex justify-between items-center text-purple-900">
              <span className="font-bold">Total Target Recipients:</span>
              <span className="font-mono font-extrabold">{allSelectedEmails.length} Addresses</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={sending}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : `Confirm & Send (${allSelectedEmails.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PREVIOUS LOG DETAILS */}
      {previewLogItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Broadcast Log: {previewLogItem.subject}
              </h3>
              <button
                onClick={() => setPreviewLogItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-[11px]">
                <div><span className="font-bold text-slate-600">Sent By:</span> {previewLogItem.sent_by_name}</div>
                <div><span className="font-bold text-slate-600">Timestamp:</span> {new Date(previewLogItem.sent_at).toLocaleString()}</div>
                <div><span className="font-bold text-slate-600">Recipients:</span> {previewLogItem.recipients_count} Total</div>
                <div><span className="font-bold text-slate-600">Delivery Mode:</span> {previewLogItem.status}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                  {previewLogItem.message}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipients List ({previewLogItem.recipients?.length || 0})</label>
                <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 space-y-0.5">
                  {(previewLogItem.recipients || []).map((email, idx) => (
                    <div key={idx}>• {email}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewLogItem(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmailBroadcastPage;
