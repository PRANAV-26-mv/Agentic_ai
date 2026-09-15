import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AttendanceSession, AttendanceAttendee } from '../types';
import { 
  CalendarCheck, 
  Plus, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  Download, 
  Users, 
  Search, 
  X, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AttendanceManagement: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Attendee Roster Modal State
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<AttendanceSession | null>(null);
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [attendees, setAttendees] = useState<AttendanceAttendee[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState<string>('');

  // Creation form state
  const [formData, setFormData] = useState({
    community: 'Agentic AI & LLM Optimization',
    department: 'ALL',
    duration_minutes: 60
  });

  const [creating, setCreating] = useState<boolean>(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingMaster, setExportingMaster] = useState<boolean>(false);

  const fetchSessions = () => {
    setLoading(true);
    api.get('/attendance')
      .then(res => {
        const list: AttendanceSession[] = res.data.sessions || [];
        setSessions(list);
        if (list.length > 0) {
          // Default to the first session or active session
          setActiveSession(prev => {
            if (prev) {
              const updated = list.find(s => s.id === prev.id);
              if (updated) return updated;
            }
            return list[0];
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/attendance/sessions', formData);
      setActiveSession(res.data);
      setShowCreateModal(false);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate attendance OTP.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRoster = async (session: AttendanceSession) => {
    setSelectedSessionForRoster(session);
    setRosterLoading(true);
    setAttendeeSearch('');
    try {
      const res = await api.get(`/attendance/sessions/${session.id}/attendees`);
      setAttendees(res.data.attendees || []);
      if (res.data.session) {
        setSelectedSessionForRoster(res.data.session);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load attendee roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  const downloadCsvString = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSessionReport = async (sessionId: string, sessionCode: string, sessionDate: string) => {
    setExportingId(sessionId);
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${sessionCode}_${sessionDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: fetch attendees JSON and build CSV locally
      try {
        const res = await api.get(`/attendance/sessions/${sessionId}/attendees`);
        const list: AttendanceAttendee[] = res.data.attendees || [];
        const headers = ['S.No', 'Student Name', 'Register Number', 'Department', 'Community', 'Email', 'Session Date', 'OTP Code', 'Marked At', 'Status'];
        const rows = list.map((a, idx) => [
          idx + 1,
          `"${(a.student_name || '').replace(/"/g, '""')}"`,
          `"${(a.student_reg || '').replace(/"/g, '""')}"`,
          `"${(a.student_department || '').replace(/"/g, '""')}"`,
          `"${(a.student_community || '').replace(/"/g, '""')}"`,
          `"${(a.student_email || '').replace(/"/g, '""')}"`,
          `"${a.session_date || ''}"`,
          `"${a.session_code || ''}"`,
          `"${new Date(a.marked_at).toLocaleString()}"`,
          `"${a.status || 'PRESENT'}"`
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\r\n');
        downloadCsvString(csv, `attendance_${sessionCode}_${sessionDate}.csv`);
      } catch (innerErr: any) {
        alert(innerErr.message || 'Error downloading report.');
      }
    } finally {
      setExportingId(null);
    }
  };

  const handleDownloadMasterReport = async () => {
    setExportingMaster(true);
    try {
      const res = await api.get('/attendance/export-all', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `master_attendance_report_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download master attendance report.');
    } finally {
      setExportingMaster(false);
    }
  };

  const filteredAttendees = attendees.filter(a => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      a.student_name?.toLowerCase().includes(q) ||
      a.student_reg?.toLowerCase().includes(q) ||
      a.student_department?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-purple-600" />
            <span>Attendance OTP Generator & Reporting</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Generate strictly 6-digit numeric attendance OTPs, track who put the OTP in real time, and download attendance reports.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadMasterReport}
            disabled={exportingMaster || sessions.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            title="Download complete attendance history across all sessions"
          >
            {exportingMaster ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            <span>Master Report (CSV)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Numeric OTP</span>
          </button>
        </div>
      </div>

      {/* Live Active Numeric OTP Hero Banner */}
      {activeSession && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-purple-300">
              Live Active 6-Digit Numeric OTP
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-widest text-amber-300 bg-white/10 px-8 py-3.5 rounded-2xl border border-white/20 select-all">
              {activeSession.code}
            </div>

            <button
              onClick={() => handleCopyCode(activeSession.code)}
              className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center space-x-2"
              title="Copy OTP to clipboard"
            >
              {copiedCode === activeSession.code ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-purple-200" />
                  <span className="text-xs font-bold text-purple-200">Copy OTP</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-300 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
            <span>Target: <strong className="text-white">{activeSession.community}</strong> ({activeSession.department})</span>
            <span>•</span>
            <span>Expires: <strong className="text-white">{new Date(activeSession.expires_at).toLocaleTimeString()}</strong></span>
            <span>•</span>
            <span className="inline-flex items-center space-x-1 text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <Users className="w-3.5 h-3.5" />
              <span>{activeSession.attendee_count || 0} Students Marked</span>
            </span>
          </div>

          {/* Action buttons inside live active card */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenRoster(activeSession)}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-white/20"
            >
              <Users className="w-4 h-4 text-purple-200" />
              <span>View Attendees ({activeSession.attendee_count || 0})</span>
            </button>

            <button
              onClick={() => handleDownloadSessionReport(activeSession.id, activeSession.code, activeSession.date)}
              disabled={exportingId === activeSession.id}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {exportingId === activeSession.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download Report (CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* Sessions History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Generated Attendance OTP Sessions ({sessions.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Each session allows students to mark attendance using its 6-digit numeric OTP.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-48 bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 text-xs">
            Loading attendance sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <KeyRound className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No attendance sessions generated yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
            >
              Generate First Numeric OTP
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Numeric OTP</th>
                  <th className="p-4">Target Community / Dept</th>
                  <th className="p-4">Session Date</th>
                  <th className="p-4">Expiration Time</th>
                  <th className="p-4">Attendees Who Put OTP</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {sessions.map((sess) => {
                  const isExpired = new Date(sess.expires_at).getTime() < Date.now();
                  const count = sess.attendee_count || 0;

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl text-base tracking-wider">
                            {sess.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(sess.code)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === sess.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {sess.community}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({sess.department})</span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{sess.date}</td>
                      <td className="p-4">
                        <span className={`text-[11px] font-medium flex items-center space-x-1 ${
                          isExpired ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'
                        }`}>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(sess.expires_at).toLocaleTimeString()}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenRoster(sess)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                          title="Click to view students who submitted this OTP"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{count} {count === 1 ? 'Student' : 'Students'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenRoster(sess)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                            title="View roster of who put the OTP"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleDownloadSessionReport(sess.id, sess.code, sess.date)}
                            disabled={exportingId === sess.id}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Download CSV report of attendees"
                          >
                            {exportingId === sess.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>CSV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ATTENDEE ROSTER MODAL (WHO PUT THE OTP & DOWNLOAD REPORT) */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-1.5">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Attendance Roster: OTP</span>
                  </h3>
                  <span className="font-mono font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg text-sm border border-amber-300">
                    {selectedSessionForRoster.code}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                  <span>Target: <strong className="text-slate-700">{selectedSessionForRoster.community}</strong></span>
                  <span>•</span>
                  <span>Date: <strong className="text-slate-700">{selectedSessionForRoster.date}</strong></span>
                  <span>•</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {attendees.length} Students Submitted OTP
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadSessionReport(selectedSessionForRoster.id, selectedSessionForRoster.code, selectedSessionForRoster.date)}
                  disabled={exportingId === selectedSessionForRoster.id || attendees.length === 0}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download attendee list as CSV"
                >
                  {exportingId === selectedSessionForRoster.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download Report (CSV)</span>
                </button>

                <button
                  onClick={() => setSelectedSessionForRoster(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Filter Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search attendee by student name, registration number, or department..."
                value={attendeeSearch}
                onChange={e => setAttendeeSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {attendeeSearch && (
                <button
                  onClick={() => setAttendeeSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Attendee Roster Content */}
            {rosterLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold animate-pulse flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Loading attendees who submitted OTP...</span>
              </div>
            ) : attendees.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No students have submitted this OTP yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Provide the 6-digit numeric OTP <strong className="text-purple-700 font-mono">{selectedSessionForRoster.code}</strong> to students. As they submit, their names and timestamps will appear here in real time.
                </p>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No students match your search "{attendeeSearch}".
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Reg Number</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Community</th>
                      <th className="p-3">OTP Submitted Time</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendees.map((att, idx) => (
                      <tr key={att.record_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{att.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal font-mono">{att.student_email}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-purple-700">{att.student_reg}</td>
                        <td className="p-3 text-slate-600">{att.student_department}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[150px]">{att.student_community}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {new Date(att.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PRESENT</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
              <span>Showing {filteredAttendees.length} of {attendees.length} attendees</span>
              <button
                type="button"
                onClick={() => setSelectedSessionForRoster(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close Roster
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <span>Generate Numeric Attendance OTP</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Generates a strictly 6-digit numeric OTP (e.g. 748291). Students must enter this number to mark themselves present.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Community *</label>
                <select 
                  value={formData.community} 
                  onChange={e => setFormData({ ...formData, community: e.target.value })} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="Agentic AI & LLM Optimization">Agentic AI & LLM Optimization</option>
                  <option value="Cloud Computing & DevOps">Cloud Computing & DevOps</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="Cybersecurity & Networks">Cybersecurity & Networks</option>
                  <option value="Data Science & Analytics">Data Science & Analytics</option>
                  <option value="ALL">All Communities</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department</label>
                <select 
                  value={formData.department} 
                  onChange={e => setFormData({ ...formData, department: e.target.value })} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CS">Computer Science (CS)</option>
                  <option value="AD">Artificial Intelligence & Data Science (AD)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics & Communication (ECE)</option>
                  <option value="EEE">Electrical & Electronics (EEE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input 
                  type="number" 
                  min={5} 
                  max={480} 
                  value={formData.duration_minutes} 
                  onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 60 })} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" 
                />
              </div>

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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Generate 6-Digit OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
