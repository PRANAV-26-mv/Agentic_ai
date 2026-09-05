import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, AlertTriangle, Eye, ShieldAlert, RefreshCw } from 'lucide-react';

export const AssessmentMonitoring: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMonitoring = () => {
    setLoading(true);
    api.get('/monitoring')
      .then(res => setMonitoringData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-purple-600" />
            <span>Real-Time Assessment & Tab-Switch Monitoring</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Live visibility & proctoring timeline during active student assessment attempts.</p>
        </div>

        <button
          onClick={fetchMonitoring}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Feeds</span>
        </button>
      </div>

      {/* Monitoring Content */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400 font-bold">Loading Live Proctoring Feeds...</span>
        </div>
      ) : monitoringData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Exam Attempts Currently Active</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When students take scheduled assessments, real-time tab switching, full-screen violations, and submit events will display here in real-time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Student</th>
                  <th className="p-4">Assessment Title</th>
                  <th className="p-4">Tab Switch Alerts</th>
                  <th className="p-4">Attempt Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {monitoringData.map((item) => (
                  <tr key={item.attempt_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{item.student_name}</td>
                    <td className="p-4 font-medium text-slate-700">{item.assessment_title}</td>
                    <td className="p-4 font-extrabold">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        item.tab_switches_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.tab_switches_count} Switches
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedAttempt(item)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proctoring Event Timeline Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Proctoring Event Timeline</span>
              </h3>
              <button onClick={() => setSelectedAttempt(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>Student: <span className="font-bold text-slate-900">{selectedAttempt.student_name}</span></div>
              <div>Assessment: <span className="font-bold text-slate-900">{selectedAttempt.assessment_title}</span></div>
              <div>Start Time: <span className="font-bold text-slate-900">{new Date(selectedAttempt.start_time).toLocaleString()}</span></div>
              <div>Submit Time: <span className="font-bold text-slate-900">{selectedAttempt.submit_time ? new Date(selectedAttempt.submit_time).toLocaleString() : 'N/A'}</span></div>
              <div>Total Tab Switches: <span className="font-bold text-amber-600">{selectedAttempt.tab_switches_count}</span></div>
            </div>

            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Tab Switch Log</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedAttempt.events && selectedAttempt.events.length > 0 ? (
                selectedAttempt.events.map((evt: any) => (
                  <div key={evt.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex justify-between items-center text-amber-900 font-mono">
                    <span>{evt.event_type}</span>
                    <span className="text-[10px] text-amber-700">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">No tab switches recorded during test attempt.</div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedAttempt(null)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
