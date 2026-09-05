import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarCheck, Plus, KeyRound, Clock, CheckCircle2 } from 'lucide-react';

export const AttendanceManagement: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<any>({
    community: 'Agentic AI & LLM Optimization',
    department: 'ALL',
    duration_minutes: 60
  });

  const fetchSessions = () => {
    setLoading(true);
    api.get('/attendance')
      .then(res => {
        setSessions(res.data.sessions || []);
        if (res.data.sessions?.length > 0) {
          setActiveSession(res.data.sessions[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/attendance/sessions', formData)
      .then(res => {
        setActiveSession(res.data);
        setShowCreateModal(false);
        fetchSessions();
      });
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-purple-600" />
            <span>Attendance Session Generator (§22)</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Generate dynamic 6-character attendance codes with expiration timers.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Session Code</span>
        </button>
      </div>

      {/* Active Code Box matching §22 */}
      {activeSession && (
        <div className="bg-gradient-to-r from-purple-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl text-center space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-300">Live Active Session Code</div>
          <div className="text-5xl font-extrabold font-mono tracking-widest text-amber-300 bg-white/10 inline-block px-8 py-3 rounded-2xl border border-white/20">
            {activeSession.code}
          </div>
          <div className="text-xs text-slate-300">
            Community: <span className="font-bold text-white">{activeSession.community}</span> • Expires: <span className="font-bold text-white">{new Date(activeSession.expires_at).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Session Code</th>
                <th className="p-4">Community / Dept</th>
                <th className="p-4">Date</th>
                <th className="p-4">Expiration Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-extrabold text-purple-700 text-sm">{sess.code}</td>
                  <td className="p-4 font-medium">{sess.community} ({sess.department})</td>
                  <td className="p-4">{sess.date}</td>
                  <td className="p-4 text-slate-500">{new Date(sess.expires_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Generate Attendance Session</h3>
            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Community</label>
                <select value={formData.community} onChange={e => setFormData({ ...formData, community: e.target.value })} className="w-full p-2.5 border rounded-xl font-bold">
                  <option value="Agentic AI & LLM Optimization">Agentic AI & LLM Optimization</option>
                  <option value="NLP & Computer Vision">NLP & Computer Vision</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input type="number" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) })} className="w-full p-2.5 border rounded-xl font-bold" />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 bg-slate-100 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">Generate Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
