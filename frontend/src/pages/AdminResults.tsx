import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Download, Search, Award } from 'lucide-react';

export const AdminResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/results')
      .then(res => setResults(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredResults = results.filter(r =>
    (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.assessment_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = 'Student ID,Student Name,Email,Department,Assessment,MCQ Score,Writing Score,Total Score,Percentage,Tab Switches,Status,Submitted At\n';
    const rows = filteredResults.map(r =>
      `"${r.student_id_code}","${r.student_name}","${r.student_email}","${r.department}","${r.assessment_title}",${r.mcq_score},${r.writing_score},${r.total_score},${r.percentage}%,${r.tab_switches_count},"${r.status}","${r.submitted_at || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assessment_Results_Export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 liquid-glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BarChart className="w-6 h-6 text-purple-600" />
            <span>Master Assessment Results</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Review student test scores, MCQ breakdown, tab switch statistics, and export CSV reports.</p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredResults.length === 0}
          className="px-5 py-2.5 liquid-btn-primary disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="liquid-glass-card p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, assessment title, or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 liquid-glass-input text-xs font-medium"
          />
        </div>
      </div>

      {/* Content / Empty State */}
      {loading ? (
        <div className="h-64 liquid-glass-card rounded-2xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400 font-bold">Loading Assessment Results...</span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="liquid-glass-card rounded-2xl p-12 text-center space-y-3">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Assessment Results Recorded</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No results match your search filter.' : 'Completed student exam submissions and auto-graded results will automatically populate here.'}
          </p>
        </div>
      ) : (
        <div className="liquid-glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 backdrop-blur-md text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-white/60">
                  <th className="p-4">Student</th>
                  <th className="p-4">Assessment Title</th>
                  <th className="p-4">MCQ Score</th>
                  <th className="p-4">Writing Score</th>
                  <th className="p-4">Total Score</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Tab Switches</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs text-slate-700">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{r.student_name}</div>
                      <div className="text-[11px] text-slate-400">{r.student_email} • {r.department}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{r.assessment_title}</td>
                    <td className="p-4 font-semibold text-sky-600">{r.mcq_score} pts</td>
                    <td className="p-4 font-semibold text-purple-600">{r.writing_score} pts</td>
                    <td className="p-4 font-extrabold text-slate-900">{r.total_score} pts</td>
                    <td className="p-4 font-bold text-emerald-600">{r.percentage}%</td>
                    <td className="p-4 font-mono font-bold text-amber-600">{r.tab_switches_count}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
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
