import React, { useState, useEffect } from 'react';
import { api, getFileUrl } from '../services/api';
import { StudyMaterial } from '../types';
import { BookOpen, Upload, Trash2, Plus, ExternalLink, Loader2, AlertCircle, CheckCircle2, FileText, Globe } from 'lucide-react';

const DEPARTMENTS = ['CS', 'AD', 'IT', 'ECE', 'EEE', 'MECH'];
const COMMUNITIES = [
  'Agentic AI & LLM Optimization',
  'Cloud Computing & DevOps',
  'Full Stack Development',
  'Cybersecurity & Networks',
  'Data Science & Analytics'
];

export const StudyMaterialManagement: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const initialFormData = {
    title: '',
    description: '',
    material_type: 'PDF' as 'PDF' | 'DOCX' | 'PPT' | 'URL',
    external_url: '',
    target_type: 'ALL' as 'ALL' | 'DEPARTMENT' | 'COMMUNITY',
    target_department: 'CS',
    target_community: 'Agentic AI & LLM Optimization'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [file, setFile] = useState<File | null>(null);

  const fetchMaterials = () => {
    setLoading(true);
    api.get('/materials')
      .then(res => setMaterials(res.data))
      .catch(err => console.error('Failed to load materials:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const openModal = () => {
    setFormData(initialFormData);
    setFile(null);
    setErrorMsg(null);
    setShowUploadModal(true);
  };

  const closeModal = () => {
    if (uploading) return;
    setShowUploadModal(false);
    setErrorMsg(null);
    setFile(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Please enter a material title.');
      return;
    }

    if (formData.material_type !== 'URL' && !file) {
      setErrorMsg('Please choose a file to upload.');
      return;
    }

    if (formData.material_type === 'URL' && !formData.external_url.trim()) {
      setErrorMsg('Please enter a valid external URL.');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('material_type', formData.material_type);
      data.append('target_type', formData.target_type);

      if (formData.target_type === 'DEPARTMENT') {
        data.append('target_department', formData.target_department);
      } else if (formData.target_type === 'COMMUNITY') {
        data.append('target_community', formData.target_community);
      }

      if (formData.material_type === 'URL') {
        data.append('external_url', formData.external_url.trim());
      } else if (file) {
        data.append('file', file);
      }

      await api.post('/materials', data);

      setShowUploadModal(false);
      setSuccessMsg('Study material published successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchMaterials();
    } catch (err: any) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload study material. Please try again.';
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    api.delete(`/materials/${id}`)
      .then(() => {
        setSuccessMsg('Study material deleted successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchMaterials();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to delete study material.');
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>Study Materials Publishing</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Upload PDFs, DOCX, PPT slides, or external study URLs for targeted student cohorts.
          </p>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-56 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-56 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-56 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No study materials published yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Upload Material" above to share lecture notes, slides, or references with students.
          </p>
          <button
            onClick={openModal}
            className="mt-4 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Material</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => {
            const resolvedUrl = getFileUrl(mat.file_url);
            return (
              <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      {mat.material_type === 'URL' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      <span>{mat.material_type}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(mat.id, mat.title)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{mat.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {mat.description || 'No description provided.'}
                  </p>
                  <div className="text-[10px] font-medium text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>
                      Target:{' '}
                      <span className="font-semibold text-slate-600">
                        {mat.target_type === 'ALL'
                          ? 'All Students'
                          : mat.target_type === 'DEPARTMENT'
                          ? `Dept: ${mat.target_department || 'All'}`
                          : `Community: ${mat.target_community || 'All'}`}
                      </span>
                    </span>
                    {mat.page_count && <span>{mat.page_count} pages</span>}
                  </div>
                </div>

                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors border border-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{mat.material_type === 'URL' ? 'Visit Link' : 'Open / Download File'}</span>
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <span>Upload Study Material</span>
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LLM Fine-Tuning & Quantization Handbook"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key topics, lecture modules, or instructions for students..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Material Type & Target Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Material Type</label>
                  <select
                    value={formData.material_type}
                    onChange={e => {
                      const val = e.target.value as any;
                      setFormData({ ...formData, material_type: val });
                      if (val === 'URL') setFile(null);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">DOCX Document</option>
                    <option value="PPT">PPT / Slides</option>
                    <option value="URL">External URL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.target_type}
                    onChange={e => setFormData({ ...formData, target_type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Students (Whole Portal)</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="COMMUNITY">Specific Community</option>
                  </select>
                </div>
              </div>

              {/* Conditional Target Department / Community Picker */}
              {formData.target_type === 'DEPARTMENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Department</label>
                  <select
                    value={formData.target_department}
                    onChange={e => setFormData({ ...formData, target_department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept} Department</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.target_type === 'COMMUNITY' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Community Cohort</label>
                  <select
                    value={formData.target_community}
                    onChange={e => setFormData({ ...formData, target_community: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    {COMMUNITIES.map(comm => (
                      <option key={comm} value={comm}>{comm}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Upload or External URL */}
              {formData.material_type !== 'URL' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Choose File <span className="text-rose-500">*</span> (Max 25MB)
                  </label>
                  <div className="border border-dashed border-purple-200 bg-purple-50/40 rounded-xl p-4 text-center hover:bg-purple-50 transition-colors">
                    <input
                      type="file"
                      required
                      accept={
                        formData.material_type === 'PDF'
                          ? '.pdf,application/pdf'
                          : formData.material_type === 'DOCX'
                          ? '.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                          : '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                      }
                      onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    {file && (
                      <p className="mt-2 text-[11px] font-semibold text-purple-700">
                        Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    External URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/lecture-notes"
                    value={formData.external_url}
                    onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Publish Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
