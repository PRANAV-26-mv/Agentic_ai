import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../services/api';
import { User, Download, Save, CheckCircle2, Lock, Loader2, AlertCircle, FileText } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<string>(user?.profile || '');
  const [interest, setInterest] = useState<string>(user?.interest || '');
  const [skillLevel, setSkillLevel] = useState<string>(user?.skill_level || 'Intermediate');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const handleDownloadReportCard = async () => {
    if (!user) return;
    setDownloadingReport(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      // 1. Preferred modern method: authenticated Axios blob download
      const res = await api.get(`/students/${user.id}/report-card`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = (user.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Official_Report_Card_${cleanName}_${user.student_id || ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.warn('Axios blob download failed, falling back to direct URL navigation:', err);
      try {
        const token = localStorage.getItem('portal_auth_token') || '';
        const url = `${API_BASE_URL}/students/${user.id}/report-card?token=${encodeURIComponent(token)}`;
        window.open(url, '_blank');
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } catch (fallbackErr: any) {
        setDownloadError('Failed to generate report card. Please try again or re-login.');
      }
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <User className="w-6 h-6 text-indigo-600" />
            <span>My Student Profile</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Manage your skills, interests, and download your official performance report card.</p>
        </div>

        {/* PDF Report Card Export */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={handleDownloadReportCard}
            disabled={downloadingReport}
            className="px-5 py-2.5 liquid-btn-gradient disabled:opacity-60 text-white font-bold text-xs rounded-full shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            {downloadingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Report Card...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Download Report Card PDF</span>
              </>
            )}
          </button>
          
          {downloadSuccess && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Report Card downloaded successfully!</span>
            </span>
          )}
          {downloadError && (
            <span className="text-[11px] font-bold text-red-600 flex items-center space-x-1 animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{downloadError}</span>
            </span>
          )}
        </div>
      </div>

      {/* Form matching §7 */}
      <form onSubmit={handleSaveProfile} className="liquid-glass-card rounded-3xl p-8 space-y-6">
        
        {/* Readonly Fields Section */}
        <div className="border-b border-white/80 pb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Academic Identification (Locked)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Student ID</label>
              <input type="text" value={user?.student_id || ''} disabled className="w-full p-3 bg-white/40 border border-white/80 rounded-xl font-mono text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">College Email</label>
              <input type="text" value={user?.email || ''} disabled className="w-full p-3 bg-white/40 border border-white/80 rounded-xl font-mono text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
              <input type="text" value={user?.name || ''} disabled className="w-full p-3 bg-white/40 border border-white/80 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Department & Year</label>
              <input type="text" value={`${user?.department || 'CS'} • Year ${user?.year || 3}`} disabled className="w-full p-3 bg-white/40 border border-white/80 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Community</label>
              <input type="text" value={user?.community || ''} disabled className="w-full p-3 bg-white/40 border border-white/80 rounded-xl text-slate-700 font-bold" />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Suggested Role</label>
              <input type="text" value={user?.suggested_role || 'AI Developer'} disabled className="w-full p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-indigo-900 font-bold" />
            </div>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Editable Student Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Skill Level</label>
            <select
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value)}
              className="w-full p-3 liquid-glass-input rounded-xl text-xs font-bold text-slate-800"
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
              className="w-full p-3 liquid-glass-input rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Bio / Experience</label>
            <textarea
              rows={4}
              value={profile}
              onChange={e => setProfile(e.target.value)}
              placeholder="Brief summary of projects, tools (LangChain, CrewAI, PyTorch), and goals..."
              className="w-full p-3 liquid-glass-input rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 liquid-btn-primary font-bold text-xs rounded-full shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>

      </form>

    </div>
  );
};
