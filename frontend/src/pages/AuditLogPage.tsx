import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { ShieldAlert, Search, Lock, Activity, RefreshCw } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/audit-logs')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.actor_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.actor_role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            <span>Immutable System Audit Log</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Append-only security event trail tracking authentication, admin operations, and exam attempts.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchLogs}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-Only & Protected</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action (LOGIN, CREATE), actor ID, role, or entity type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400 font-bold">Loading Audit Trail...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Activity className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Audit Events Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No security events match your search query.' : 'System security logs will automatically record login activities, student CRUD, and evaluation actions.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor ID</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-900">{l.actor_id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.actor_role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {l.actor_role}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-sky-600">{l.action}</td>
                    <td className="p-4 font-semibold text-slate-800">{l.entity_type}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{l.metadata || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
