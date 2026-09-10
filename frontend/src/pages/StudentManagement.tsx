import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Student } from '../types';
import { Users, UserPlus, FileSpreadsheet, Search, Filter, Edit, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [commFilter, setCommFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBulkImport, setShowBulkImport] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    student_id: '',
    name: '',
    email: '',
    department: 'CS',
    year: 3,
    community: 'Agentic AI & LLM Optimization',
    skill_level: 'Intermediate',
    interest: '',
    profile: '',
    suggested_role: 'AI Developer'
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStudents = () => {
    setLoading(true);
    api.get('/students', {
      params: {
        search: searchTerm,
        department: deptFilter || undefined,
        year: yearFilter || undefined,
        community: commFilter || undefined
      }
    })
      .then(res => setStudents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, deptFilter, yearFilter, commFilter]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    api.post('/students', formData)
      .then(() => {
        setShowAddModal(false);
        fetchStudents();
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to add student.');
      });
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete student "${name}"? This action cannot be undone.`)) return;
    api.delete(`/students/${id}`)
      .then(() => {
        setStudents(prev => prev.filter(s => s.id !== id));
        fetchStudents();
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Failed to delete student.');
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Student Roster Management</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage college student accounts, roles, and cohort assignments.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student ID, name, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
          <option value="">All Departments</option>
          <option value="CS">Computer Science (CS)</option>
          <option value="AD">Artificial Intelligence & Data (AD)</option>
          <option value="IT">Information Tech (IT)</option>
          <option value="AL">AI & ML (AL)</option>
        </select>

        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
          <option value="">All Academic Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>

        <select value={commFilter} onChange={e => setCommFilter(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
          <option value="">All Communities</option>
          <option value="Agentic AI & LLM Optimization">Agentic AI & LLM Optimization</option>
          <option value="NLP & Computer Vision">NLP & Computer Vision</option>
          <option value="Cloud & DevOps">Cloud & DevOps</option>
        </select>
      </div>

      {/* Student Directory Table */}
      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Student ID</th>
                <th className="p-4">Name & Email</th>
                <th className="p-4">Dept / Year</th>
                <th className="p-4">Community</th>
                <th className="p-4">Skill Level</th>
                <th className="p-4">Suggested Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {students.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold font-mono text-purple-700">{std.student_id}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{std.name}</div>
                    <div className="text-slate-500 text-[11px]">{std.email}</div>
                  </td>
                  <td className="p-4 font-medium">{std.department} (Yr {std.year})</td>
                  <td className="p-4 text-slate-800 font-medium">{std.community}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      {std.skill_level}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-purple-700">{std.suggested_role || 'AI Developer'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleDeleteStudent(std.id, std.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title="Delete Student Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student ID (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7376251AD108"
                  value={formData.student_id}
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Student Full Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">College Email (Unique)</label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="CS">CS</option>
                    <option value="AD">AD</option>
                    <option value="IT">IT</option>
                    <option value="AL">AL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Community</label>
                <select
                  value={formData.community}
                  onChange={e => setFormData({ ...formData, community: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Agentic AI & LLM Optimization">Agentic AI & LLM Optimization</option>
                  <option value="NLP & Computer Vision">NLP & Computer Vision</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Suggested Role</label>
                <input
                  type="text"
                  placeholder="e.g. AI Systems Engineer"
                  value={formData.suggested_role}
                  onChange={e => setFormData({ ...formData, suggested_role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 font-bold rounded-xl text-slate-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => fetchStudents()}
      />

    </div>
  );
};
