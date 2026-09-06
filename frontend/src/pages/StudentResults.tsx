import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const StudentResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchResults = () => {
    setLoading(true);
    api.get('/results')
      .then(async (res) => {
        const serverResults: any[] = res.data;
        try {
          const localSubmitted = JSON.parse(localStorage.getItem('portal_submitted_attempts') || '[]');
          const missing = localSubmitted.filter((sub: any) => 
            !serverResults.some((sr: any) => sr.attempt_id === sub.attempt_id || sr.id === sub.attempt_id)
          );

          if (missing.length > 0) {
            console.log('Auto-restoring student exam submissions after Render disk reload:', missing);
            for (const item of missing) {
              try {
                if (item.answers) {
                  for (const [qid, ans] of Object.entries(item.answers as Record<string, any>)) {
                    await api.post(`/assessments/${item.assessment_id}/answer`, {
                      attempt_id: item.attempt_id,
                      question_id: qid,
                      ...ans
                    });
                  }
                }
                await api.post(`/assessments/${item.assessment_id}/submit`, { attempt_id: item.attempt_id });
              } catch (e) {
                console.error('Failed to auto-heal student submission:', item.attempt_id, e);
              }
            }
            const refreshed = await api.get('/results');
            setResults(refreshed.data);
          } else {
            setResults(serverResults);
          }
        } catch (e) {
          setResults(serverResults);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BarChart2 className="w-6 h-6 text-brand-600" />
            <span>My Assessment Results</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Review your score history, MCQ breakdown, and writing evaluation feedback.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Assessment</th>
                <th className="p-4">MCQ Score</th>
                <th className="p-4">Writing Score</th>
                <th className="p-4">Total Score</th>
                <th className="p-4">Percentage</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{r.assessment_title}</td>
                  <td className="p-4 font-semibold text-brand-600">{r.mcq_score} pts</td>
                  <td className="p-4 font-semibold text-purple-600">{r.writing_score} pts</td>
                  <td className="p-4 font-extrabold text-slate-900">{r.total_score} pts</td>
                  <td className="p-4 font-bold text-emerald-600">{r.percentage}%</td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(r.submitted_at || r.started_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
