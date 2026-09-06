import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Lock, 
  Activity, 
  RefreshCw, 
  Crown, 
  User, 
  UserCheck, 
  Download,
  Filter,
  CheckCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/audit-logs')
      .then(res => setLogs(res.data))
      .catch(err => console.error('Failed to fetch activity logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesRole = roleFilter === 'ALL' || l.actor_role === roleFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (l.actor_name || '').toLowerCase().includes(searchLower) ||
      (l.actor_email || '').toLowerCase().includes(searchLower) ||
      (l.action || '').toLowerCase().includes(searchLower) ||
      (l.actor_id || '').toLowerCase().includes(searchLower) ||
      (l.entity_type || '').toLowerCase().includes(searchLower) ||
      (l.metadata || '').toLowerCase().includes(searchLower);

    return matchesRole && matchesSearch;
  });

  // Calculate statistics
  const totalEvents = logs.length;
  const studentEvents = logs.filter(l => l.actor_role === 'STUDENT').length;
  const adminEvents = logs.filter(l => l.actor_role === 'ADMIN').length;
  const loginEvents = logs.filter(l => l.action === 'LOGIN').length;

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Timestamp', 'Name', 'Email', 'Role', 'Actor ID', 'Action', 'Entity Type', 'Metadata'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${(l.actor_name || 'Unknown').replace(/"/g, '""')}"`,
      `"${(l.actor_email || l.actor_id).replace(/"/g, '""')}"`,
      `"${l.actor_role}"`,
      `"${l.actor_id}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${(l.metadata || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMetadata = (metaStr?: string) => {
    if (!metaStr) return '-';
    try {
      const parsed = JSON.parse(metaStr);
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
      }
    } catch (e) {
      return metaStr;
    }
    return metaStr;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-purple-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin Exclusive</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Protected Audit Trail</span>
              </span>
            </div>

            <h1 className="text-2xl font-black mt-3 tracking-tight flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-purple-400" />
              <span>User & Admin Activity Logs</span>
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Complete, real-time security activity stream tracking all user (student) actions and admin operations across the portal with full identity details.
            </p>

            <div className="mt-3 text-xs text-purple-300 font-mono flex items-center space-x-2">
              <span>Authorized Super Admin:</span>
              <span className="font-bold text-amber-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                {user?.email || 'pranavannur9659@gmail.com'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-stretch md:self-auto justify-end">
            <button 
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={fetchLogs}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Activity Log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Actions</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalEvents}</p>
          <span className="text-[11px] text-slate-400 font-medium">Logged system events</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Student Activities</span>
            <User className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-sky-950 mt-2">{studentEvents}</p>
          <span className="text-[11px] text-slate-400 font-medium">Exams, attendance, logins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Admin Operations</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 mt-2">{adminEvents}</p>
          <span className="text-[11px] text-slate-400 font-medium">CRUD & management tasks</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Logins Tracked</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2">{loginEvents}</p>
          <span className="text-[11px] text-slate-400 font-medium">Authentication events</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Role Segment Filters */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              roleFilter === 'ALL'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Roles ({logs.length})
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              roleFilter === 'STUDENT'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Students ({studentEvents})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              roleFilter === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admins ({adminEvents})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Email, Action, Entity..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Activity Table */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-500 font-bold">Loading System Activity Trail...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Activity className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Activity Events Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL' 
              ? 'No activity logs match your filter criteria.' 
              : 'System activity will automatically populate when students and admins perform actions.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User / Admin Name</th>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Performed</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((l) => {
                  const isStudent = l.actor_role === 'STUDENT';
                  const isLogin = l.action === 'LOGIN';
                  const isCreate = l.action.startsWith('CREATE') || l.action.startsWith('SUBMIT');
                  const isDelete = l.action.startsWith('DELETE');

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>

                      <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {l.actor_name || 'Unknown User'}
                      </td>

                      <td className="p-4 text-purple-700 font-mono text-[11px] whitespace-nowrap">
                        {l.actor_email || l.actor_id}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isStudent 
                            ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {l.actor_role}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                          isLogin
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDelete
                            ? 'bg-rose-100 text-rose-800'
                            : isCreate
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {l.action}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">
                        {l.entity_type}
                      </td>

                      <td className="p-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {formatMetadata(l.metadata)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
