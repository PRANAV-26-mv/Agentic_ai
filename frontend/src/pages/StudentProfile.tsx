import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../services/api';
import { User, Download, Save, CheckCircle2, Lock } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<string>(user?.profile || '');
  const [interest, setInterest] = useState<string>(user?.interest || '');
  const [skillLevel, setSkillLevel] = useState<string>(user?.skill_level || 'Intermediate');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setProfile(user.profile || '');
      setInterest(user.interest || '');
      setSkillLevel(user.skill_level || 'Intermediate');
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    api.put(`/students/${user.id}`, {
      profile,
      interest,
      skill_level: skillLevel
    }).then(() => {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }).finally(() => setSaving(false));
  };

  const handleDownloadReportCard = () => {
    if (!user) return;
    const token = localStorage.getItem('portal_auth_token');
    window.open(`${API_BASE_URL}/students/${user.id}/report-card?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <User className="w-6 h-6 text-brand-600" />
            <span>My Student Profile</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage your skills, interests, and download your official performance report card.</p>
        </div>

        {/* PDF Report Card Export matching §48 */}
        <button
          onClick={handleDownloadReportCard}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Report Card PDF</span>
        </button>
      </div>

      {/* Form matching §7 */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        
        {/* Readonly Fields Section */}
        <div className="border-b border-slate-100 pb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Academic Identification (Locked)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Student ID</label>
              <input type="text" value={user?.student_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">College Email</label>
              <input type="text" value={user?.email || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
              <input type="text" value={user?.name || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Department & Year</label>
              <input type="text" value={`${user?.department || 'CS'} • Year ${user?.year || 3}`} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Community</label>
              <input type="text" value={user?.community || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Suggested Role</label>
              <input type="text" value={user?.suggested_role || 'AI Developer'} disabled className="w-full p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-bold" />
            </div>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Editable Student Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Skill Level</label>
            <select
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specialized Interest / Focus Area</label>
            <input
              type="text"
              value={interest}
              onChange={e => setInterest(e.target.value)}
              placeholder="e.g. Agentic Workflows & Multi-Agent Frameworks"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Bio / Experience</label>
            <textarea
              rows={4}
              value={profile}
              onChange={e => setProfile(e.target.value)}
              placeholder="Brief summary of projects, tools (LangChain, CrewAI, PyTorch), and goals..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>

      </form>

    </div>
  );
};
