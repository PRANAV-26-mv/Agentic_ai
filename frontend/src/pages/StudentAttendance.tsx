import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, CheckCircle2, AlertCircle, KeyRound, Loader2, Clock } from 'lucide-react';

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
    const cleanCode = code.trim();
    if (!cleanCode) return;

    if (!/^\d{6}$/.test(cleanCode)) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit numeric OTP (numbers only).' });
      return;
    }

    setLoading(true);
    setMessage(null);

    api.post('/attendance/mark', { code: cleanCode })
      .then(res => {
        setMessage({ type: 'success', text: '✓ Attendance Marked Successfully!' });
        setCode('');
        fetchAttendance();
      })
      .catch(err => {
        const text = err.response?.data?.message || 'Invalid or expired attendance OTP.';
        setMessage({ type: 'error', text });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <span>Mark Attendance</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Enter the 6-digit numeric OTP (numbers only) displayed by your faculty or administrator.
          </p>
        </div>
      </div>

      {/* Numeric OTP Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <KeyRound className="w-8 h-8" />
        </div>

        <form onSubmit={handleMarkAttendance} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Enter 6-Digit Numeric Attendance OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="e.g. 748291"
              value={code}
              onChange={e => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(numericOnly);
                setMessage(null);
              }}
              className="w-full tracking-widest text-center text-3xl font-mono font-extrabold py-3.5 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-600 focus:outline-none transition-all placeholder:text-slate-300"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Only numbers are accepted. No characters or symbols.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 animate-in fade-in ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validating Numeric OTP...</span>
              </>
            ) : (
              <span>Submit Attendance OTP</span>
            )}
          </button>
        </form>
      </div>

      {/* Attendance Stats & Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">My Attendance Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
            <div className="text-2xl font-black text-slate-900">{stats.total || 0}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Total Sessions</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
            <div className="text-2xl font-black text-emerald-700">{stats.present || 0}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Sessions Attended</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
            <div className="text-2xl font-black text-purple-700">{stats.percentage || 100}%</div>
            <div className="text-[11px] text-purple-600 font-semibold">Overall Attendance</div>
          </div>
        </div>

        {/* Attendance Records List */}
        {stats.records && stats.records.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Attended Sessions Log</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {stats.records.map((r: any) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">Session Attendance Verified</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(r.marked_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
