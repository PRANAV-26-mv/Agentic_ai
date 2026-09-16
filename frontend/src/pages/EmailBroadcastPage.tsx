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
  AlertTriangle,
  Settings,
  Key,
  ExternalLink,
  Lock,
  Check,
  Info
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

  // SMTP Configuration State
  const [showSmtpModal, setShowSmtpModal] = useState<boolean>(false);
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: user?.email || 'pranavannur9659@gmail.com',
    pass: '',
    from: user?.email || 'pranavannur9659@gmail.com'
  });
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [savingSmtp, setSavingSmtp] = useState<boolean>(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Test Email to Inbox State
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>(user?.email || 'pranavannur9659@gmail.com');
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync user info and existing smtp config into form
  useEffect(() => {
    if (user?.email) {
      setTestEmailRecipient(user.email);
      setSmtpForm(prev => ({
        ...prev,
        user: prev.user || user.email,
        from: prev.from || user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    if (smtpStatus?.host) {
      setSmtpForm(prev => ({
        ...prev,
        host: smtpStatus.host || 'smtp.gmail.com',
        port: smtpStatus.port || 465,
        secure: smtpStatus.secure !== undefined ? smtpStatus.secure : true,
        user: smtpStatus.user || prev.user
      }));
    }
  }, [smtpStatus]);

  // SMTP Actions
  const handleApplyGmailPreset = () => {
    setSmtpForm(prev => ({
      ...prev,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: prev.user || user?.email || 'pranavannur9659@gmail.com',
      from: prev.from || user?.email || 'pranavannur9659@gmail.com'
    }));
    setSmtpFeedback({
      type: 'success',
      message: 'Gmail preset applied (Host: smtp.gmail.com, Port: 465 SSL). Enter your 16-character App Password to complete.'
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setSmtpFeedback(null);
    try {
      if (smtpForm.host && smtpForm.user && smtpForm.pass) {
        const res = await api.post('/email-broadcast/smtp-config', smtpForm);
        setSmtpStatus(res.data.smtp_status);
        setSmtpFeedback({ type: 'success', message: 'SMTP connection verified successfully! Email credentials are valid.' });
        fetchData();
      } else {
        const res = await api.post('/email-broadcast/test-connection');
        setSmtpFeedback({ type: 'success', message: res.data.message || 'SMTP connection verified!' });
      }
    } catch (err: any) {
      setSmtpFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Connection failed. Please check host, port, email, and app password.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.host || !smtpForm.user || !smtpForm.pass) {
      setSmtpFeedback({ type: 'error', message: 'SMTP Host, Username/Email, and App Password are required.' });
      return;
    }
    setSavingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await api.post('/email-broadcast/smtp-config', smtpForm);
      setSmtpStatus(res.data.smtp_status);
      setSmtpFeedback({ type: 'success', message: 'SMTP credentials successfully validated and saved to backend!' });
      showNotification('success', 'SMTP settings saved! Live email dispatching is now active.');
      fetchData();
    } catch (err: any) {
      setSmtpFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to save SMTP credentials.'
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setTestEmailFeedback({ type: 'error', message: 'Please enter a valid recipient email address.' });
      return;
    }
    setSendingTestEmail(true);
    setTestEmailFeedback(null);
    try {
      const res = await api.post('/email-broadcast/send-test-email', {
        test_email: testEmailRecipient.trim()
      });
      setTestEmailFeedback({
        type: 'success',
        message: res.data.message || `Test email dispatched to ${testEmailRecipient}!`
      });
      fetchData();
    } catch (err: any) {
      setTestEmailFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to send test email. Ensure SMTP is configured.'
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

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

    const isLive = smtpStatus?.is_configured;
    const confirmMsg = isLive
      ? `Are you sure you want to DISPATCH this live email broadcast?\n\nSubject: "${subject}"\nDelivery Engine: LIVE INBOX DELIVERY (via ${smtpStatus.host})\nTotal Recipients: ${allSelectedEmails.length}\n• Students: ${selectedStudentEmails.size}\n• Admins: ${selectedAdminEmails.size}\n• Custom: ${parsedCustomEmails.length}`
      : `⚠️ NOTICE: SMTP is not configured yet. This broadcast will be recorded in SIMULATED mode (saved to portal database, but not delivered to real inboxes).\n\nTo send to real inboxes, click 'Connect Gmail / SMTP' first.\n\nDo you want to proceed with simulated dispatch?\nSubject: "${subject}"\nTotal Recipients: ${allSelectedEmails.length}`;
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
              onClick={() => setShowSmtpModal(true)}
              className="px-4 py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold rounded-xl border border-purple-400/40 flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
              title="Configure Live Email Delivery (SMTP / Gmail)"
            >
              <Settings className="w-4 h-4" />
              <span>{smtpStatus?.is_configured ? 'SMTP Active' : 'Setup Live Email'}</span>
            </button>
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

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-[11px] font-semibold">Delivery Engine</div>
              <div className={`text-xs font-mono font-bold mt-1 truncate ${smtpStatus?.is_configured ? 'text-emerald-400' : 'text-amber-300'}`}>
                {smtpStatus?.is_configured ? 'Live SMTP Active' : 'Simulated (No SMTP)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSmtpModal(true)}
              className="mt-2 text-[10px] text-purple-300 hover:text-purple-200 underline font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>{smtpStatus?.is_configured ? 'Configure SMTP' : 'Setup Gmail SMTP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Mode Status Banner */}
      {!smtpStatus?.is_configured ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-amber-950 text-sm">Real Email Delivery Is In Simulated Mode</h3>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-md uppercase tracking-wider">No SMTP Connected</span>
              </div>
              <p className="text-xs text-amber-900/85 leading-relaxed max-w-3xl">
                Emails are currently safely recorded in the database, but <strong>cannot reach real inboxes</strong> until an SMTP mail server is configured. Connect your <strong>Gmail account</strong> using a 16-character Google App Password to deliver live emails directly to student and faculty inboxes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowSmtpModal(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Connect Gmail / SMTP</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-emerald-950 text-sm">Live Email Delivery Active</h3>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-black rounded-md uppercase tracking-wider">Connected</span>
              </div>
              <p className="text-xs text-emerald-900/85 leading-relaxed">
                Direct inbox delivery is active via <strong>{smtpStatus.host}</strong> ({smtpStatus.user || 'authenticated'}). Broadcasts land directly in recipients' email inboxes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowSmtpModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SMTP Settings</span>
            </button>
            <button
              onClick={() => {
                setTestEmailRecipient(user?.email || 'pranavannur9659@gmail.com');
                setShowSmtpModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Email</span>
            </button>
          </div>
        </div>
      )}

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

      {/* MODAL 3: SMTP MAIL SERVER CONFIGURATION */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">
                    Live Email Delivery Setup (SMTP / Gmail)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect your email account so broadcasts land directly in real email inboxes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSmtpModal(false);
                  setSmtpFeedback(null);
                  setTestEmailFeedback(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Gmail Guidance Box */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-black text-purple-950">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>How To Send Real Emails Using Gmail (60 Seconds):</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyGmailPreset}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer transition-all flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Fill Gmail Presets</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-700 space-y-2 leading-relaxed">
                <p>
                  Google requires a 16-character <strong>App Password</strong> instead of your regular account password:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 font-medium text-slate-600">
                  <li>
                    Visit Google Account Security:&nbsp;
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 font-bold underline inline-flex items-center space-x-0.5 hover:text-purple-900"
                    >
                      <span>myaccount.google.com/apppasswords</span>
                      <ExternalLink className="w-3 h-3 inline ml-0.5" />
                    </a>
                  </li>
                  <li>Ensure <strong>2-Step Verification</strong> is ON for your Google account.</li>
                  <li>Under App Name, enter <span className="font-bold text-slate-800">"StudentPortal"</span> and click <strong>Create</strong>.</li>
                  <li>Copy the <strong>16-character password</strong> (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200 font-mono text-purple-700 font-bold">abcd efgh ijkl mnop</code>).</li>
                  <li>Paste it into the <strong>Google App Password</strong> field below and click <strong>Save & Verify Credentials</strong>.</li>
                </ol>
              </div>
            </div>

            {/* SMTP Form */}
            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SMTP Host <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="e.g. smtp.gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Port & SSL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      required
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                      placeholder="465"
                      className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                    />
                    <label className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={smtpForm.secure}
                        onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <span>SSL</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address / Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value, from: e.target.value })}
                    placeholder="e.g. pranavannur9659@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google 16-Char App Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      placeholder="e.g. abcd efgh ijkl mnop"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sender From Header (Optional)
                </label>
                <input
                  type="text"
                  value={smtpForm.from}
                  onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                  placeholder='e.g. "Student Assessment Portal" <pranavannur9659@gmail.com>'
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                />
              </div>

              {/* Feedback Alert */}
              {smtpFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    smtpFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {smtpFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{smtpFeedback.message}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || savingSmtp}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSmtpModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSmtp || testingConnection}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{savingSmtp ? 'Saving...' : 'Save & Activate Credentials'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Real Test Email Delivery Box */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black text-slate-800">
                <Send className="w-4 h-4 text-purple-600" />
                <span>Send A Real Test Email To Verify Inbox Delivery</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Want to confirm immediately that emails reach your personal inbox? Type your email below and send a test message right now.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enter your email to receive test message"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail || !testEmailRecipient}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                  <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </div>

              {testEmailFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    testEmailFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {testEmailFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testEmailFeedback.message}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EmailBroadcastPage;
