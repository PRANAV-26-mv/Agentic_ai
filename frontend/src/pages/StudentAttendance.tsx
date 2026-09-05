import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState<any>({ total: 0, present: 0, percentage: 100, records: [] });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAttendance = () => {
    api.get('/attendance')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setMessage(null);

    api.post('/attendance/mark', { code: code.trim().toUpperCase() })
      .then(res => {
        setMessage({ type: 'success', text: '✓ Attendance Marked Successfully!' });
        setCode('');
        fetchAttendance();
      })
      .catch(err => {
        const text = err.response?.data?.message || 'Invalid or expired attendance code.';
        setMessage({ type: 'error', text });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            <span>Mark Attendance</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Enter the 6-character code displayed by your faculty/admin.</p>
        </div>
      </div>

      {/* Code Input Card matching §22 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        
        <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
          <KeyRound className="w-8 h-8" />
        </div>

        <form onSubmit={handleMarkAttendance} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Enter Attendance Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 8K4P7Q"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full tracking-widest text-center text-2xl font-mono font-extrabold uppercase py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {loading ? 'Validating Code...' : 'Mark Attendance'}
          </button>
        </form>
      </div>

      {/* Attendance Stats & Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">My Attendance Log</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-extrabold text-slate-900">{stats.total || 0}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Sessions</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-extrabold text-emerald-700">{stats.present || 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium">Sessions Attended</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-extrabold text-purple-700">{stats.percentage || 100}%</div>
            <div className="text-[11px] text-purple-600 font-medium">Overall Attendance</div>
          </div>
        </div>
      </div>

    </div>
  );
};
