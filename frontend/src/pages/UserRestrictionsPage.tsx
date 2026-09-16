import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { RestrictedEmail, Student, Admin } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  UserX, 
  Search, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Crown, 
  RefreshCw, 
  Unlock, 
  Lock, 
  Users,
  Info
} from 'lucide-react';

export const UserRestrictionsPage: React.FC = () => {
  const { user } = useAuth();
  const [restrictedEmails, setRestrictedEmails] = useState<RestrictedEmail[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Manual Add Form State
  const [manualEmail, setManualEmail] = useState<string>('');
  const [manualReason, setManualReason] = useState<string>('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userDirectorySearch, setUserDirectorySearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'restricted' | 'directory'>('restricted');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restrRes, stdRes, admRes] = await Promise.all([
        api.get('/restrictions').catch(() => ({ data: [] })),
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/admins').catch(() => ({ data: [] }))
      ]);

      setRestrictedEmails(restrRes.data || []);
      setStudents(stdRes.data || []);
      setAdmins(admRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load restriction records.');
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
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 6000);
    }
  };

  const handleRestrictEmail = async (emailToRestrict: string, reason?: string) => {
    const cleanEmail = emailToRestrict.trim().toLowerCase();
    if (!cleanEmail) {
      showNotification('error', 'Please provide a valid email address.');
      return;
    }

    if (cleanEmail === 'pranavannur9659@gmail.com') {
      showNotification('error', 'The Super Admin account (pranavannur9659@gmail.com) cannot be restricted.');
      return;
    }

    const confirmAction = window.confirm(
      `Are you sure you want to RESTRICT access for:\n\n${cleanEmail}\n\nOnce restricted, this user CANNOT log in or enter the website.`
    );
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      const res = await api.post('/restrictions', {
        email: cleanEmail,
        reason: reason || manualReason || 'Restricted by Super Admin'
      });

      showNotification('success', res.data.message || `Access restricted for ${cleanEmail}.`);
      setManualEmail('');
      setManualReason('');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to apply restriction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnrestrictEmail = async (idOrEmail: string, emailDisplay: string) => {
    const confirmAction = window.confirm(
      `Are you sure you want to RESTORE ACCESS for:\n\n${emailDisplay}\n\nThis user will immediately be allowed to log in and use the portal.`
    );
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      const res = await api.delete(`/restrictions/${encodeURIComponent(idOrEmail)}`);
      showNotification('success', res.data.message || `Access restored for ${emailDisplay}.`);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to lift restriction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Map of restricted emails for quick lookup
  const restrictedSet = useMemo(() => {
    const set = new Set<string>();
    restrictedEmails.forEach(r => set.add(r.email.toLowerCase()));
    return set;
  }, [restrictedEmails]);

  // Filtered restricted emails list
  const filteredRestricted = useMemo(() => {
    if (!searchQuery.trim()) return restrictedEmails;
    const q = searchQuery.toLowerCase();
    return restrictedEmails.filter(r => 
      r.email.toLowerCase().includes(q) || 
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  }, [restrictedEmails, searchQuery]);

  // Combined User Directory for 1-Click "Press Email to Restrict"
  const directoryUsers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email: string;
      role: 'STUDENT' | 'ADMIN';
      identifier: string;
      department?: string;
    }> = [];

    admins.forEach(a => {
      list.push({
        id: a.id,
        name: a.name,
        email: a.email,
        role: 'ADMIN',
        identifier: 'ADMIN',
        department: a.department
      });
    });

    students.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        email: s.email,
        role: 'STUDENT',
        identifier: s.student_id,
        department: s.department
      });
    });

    if (!userDirectorySearch.trim()) return list;
    const q = userDirectorySearch.toLowerCase();
    return list.filter(u => 
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.identifier.toLowerCase().includes(q)
    );
  }, [students, admins, userDirectorySearch]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-rose-900">Access Denied</h2>
        <p className="text-rose-700 text-xs mt-2">
          Only the Super Admin (<span className="font-mono font-bold">pranavannur9659@gmail.com</span>) is authorized to manage user restrictions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[11px] font-extrabold tracking-wide uppercase flex items-center space-x-1.5">
                <Ban className="w-3.5 h-3.5" />
                <span>Access Restriction System</span>
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[11px] font-mono flex items-center space-x-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Exclusive</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              User Email Restrictions & Access Control
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Restrict any user by email address. When restricted, the user is completely blocked from logging in or entering this website.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-800/30 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Restricted Emails</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{restrictedEmails.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Blocked from site</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Registered Students</div>
            <div className="text-2xl font-black text-purple-300 mt-1">{students.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active rosters</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Admin Accounts</div>
            <div className="text-2xl font-black text-sky-300 mt-1">{admins.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">System faculty</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-semibold">Super Admin Master</div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-2 truncate">
              pranavannur9659@gmail.com
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 inline" />
              <span>Protected Permanently</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-5 py-4 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Restrict New Email (Manual Entry) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Restrict Access for an Email Address
            </h2>
            <p className="text-slate-500 text-xs">
              Enter any student or admin email to immediately block them from signing into this website.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRestrictEmail(manualEmail, manualReason);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 text-xs"
        >
          <div className="sm:col-span-5 relative">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Email Address to Restrict
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="e.g. user@college.edu or gmail.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Reason for Restriction (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Policy violation, assessment misconduct, fee due..."
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={actionLoading || !manualEmail.trim()}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span>{actionLoading ? 'Restricting...' : 'Restrict User'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('restricted')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'restricted'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Active Restricted Emails ({restrictedEmails.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'directory'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory (Click Email to Restrict)</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE RESTRICTIONS LIST */}
      {activeTab === 'restricted' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>Currently Restricted Users ({filteredRestricted.length})</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                These email IDs are blocked. When they attempt to sign in, they receive an Access Denied message.
              </p>
            </div>

            <div className="relative w-full sm:w-72 text-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search restricted email or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold animate-pulse">
              Loading restricted emails...
            </div>
          ) : filteredRestricted.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Restrictions</h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {searchQuery
                  ? `No restricted emails match "${searchQuery}".`
                  : 'All registered users currently have full access to enter the website.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Restricted Email ID</th>
                    <th className="p-4">Reason / Notes</th>
                    <th className="p-4">Restricted By</th>
                    <th className="p-4">Date Restricted</th>
                    <th className="p-4 text-right">Access Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRestricted.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <span className="font-mono font-bold text-slate-900 select-all">
                            {item.email}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="bg-rose-50 border border-rose-100 text-rose-800 font-medium px-2.5 py-1 rounded-lg text-[11px]">
                          {item.reason || 'Restricted by Super Admin'}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-mono text-[11px]">
                        {item.restricted_by || 'pranavannur9659@gmail.com'}
                      </td>

                      <td className="p-4 text-slate-500 font-medium text-[11px]">
                        {new Date(item.restricted_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleUnrestrictEmail(item.id || item.email, item.email)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                          title="Restore portal access for this email"
                        >
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Unblock / Restore Access</span>
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

      {/* TAB 2: USER DIRECTORY (PRESS EMAIL TO RESTRICT) */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>User Directory ({directoryUsers.length})</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Press any user's email ID or click "Restrict Access" to instantly ban or unban them.
              </p>
            </div>

            <div className="relative w-full sm:w-72 text-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name, email, register no..."
                value={userDirectorySearch}
                onChange={(e) => setUserDirectorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email ID (Click to Toggle)</th>
                  <th className="p-4">Role & ID</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {directoryUsers.map((u) => {
                  const isRestricted = restrictedSet.has(u.email.toLowerCase());
                  const isSuper = u.email.toLowerCase() === 'pranavannur9659@gmail.com';

                  return (
                    <tr 
                      key={`${u.role}-${u.id}`} 
                      className={`transition-colors ${isRestricted ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="p-4 font-bold text-slate-900">
                        {u.name}
                        {isSuper && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-md font-bold">
                            Super Admin
                          </span>
                        )}
                      </td>

                      {/* Clickable Email Cell */}
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={isSuper || actionLoading}
                          onClick={() => {
                            if (isSuper) return;
                            if (isRestricted) {
                              handleUnrestrictEmail(u.email, u.email);
                            } else {
                              handleRestrictEmail(u.email, `Restricted from User Directory: ${u.name}`);
                            }
                          }}
                          className={`font-mono text-xs font-bold text-left px-2.5 py-1 rounded-lg transition-all ${
                            isSuper
                              ? 'text-amber-700 bg-amber-50 cursor-default'
                              : isRestricted
                              ? 'text-rose-700 bg-rose-100 hover:bg-rose-200 line-through cursor-pointer'
                              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 cursor-pointer underline decoration-purple-300 underline-offset-2'
                          }`}
                          title={
                            isSuper
                              ? 'Super Admin Account cannot be restricted'
                              : isRestricted
                              ? 'Click email to unrestrict / restore access'
                              : 'Click email to restrict this user'
                          }
                        >
                          {u.email}
                        </button>
                      </td>

                      <td className="p-4 font-medium">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-slate-500">{u.identifier}</span>
                      </td>

                      <td className="p-4 text-slate-500">{u.department || '—'}</td>

                      <td className="p-4">
                        {isSuper ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center w-fit space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        ) : isRestricted ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold flex items-center w-fit space-x-1">
                            <Ban className="w-3 h-3" />
                            <span>Restricted</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-slate-400 font-bold italic">Master Account</span>
                        ) : isRestricted ? (
                          <button
                            onClick={() => handleUnrestrictEmail(u.email, u.email)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1 ml-auto"
                            title="Restore access for this user"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unrestrict</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestrictEmail(u.email, `Restricted from User Directory: ${u.name}`)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1 ml-auto"
                            title="Restrict this user by their email address"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>Restrict Email</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Super Admin Security Note:</span> Restricting an email prevents any login attempt via Registration Number, Email credentials, or Google Single Sign-On. If the restricted user is currently logged in, their active session is instantly terminated on their next request. Only <span className="font-mono font-bold text-purple-800">pranavannur9659@gmail.com</span> has the authority to view or modify restrictions.
        </div>
      </div>

    </div>
  );
};

export default UserRestrictionsPage;
