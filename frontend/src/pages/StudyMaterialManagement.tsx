import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StudyMaterial } from '../types';
import { BookOpen, Upload, Trash2, Plus, ExternalLink } from 'lucide-react';

export const StudyMaterialManagement: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    material_type: 'PDF',
    external_url: '',
    target_type: 'ALL',
    target_department: 'CS',
    target_community: 'Agentic AI & LLM Optimization'
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchMaterials = () => {
    setLoading(true);
    api.get('/materials')
      .then(res => setMaterials(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('material_type', formData.material_type);
    data.append('external_url', formData.external_url);
    data.append('target_type', formData.target_type);
    data.append('target_department', formData.target_department);
    data.append('target_community', formData.target_community);
    if (file) data.append('file', file);

    api.post('/materials', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setShowUploadModal(false);
        fetchMaterials();
      });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete study material?')) return;
    api.delete(`/materials/${id}`).then(() => fetchMaterials());
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>Study Materials Publishing</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Upload PDFs, DOCX, PPT slides, or external URLs for target student cohorts.</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{mat.material_type}</span>
                  <button onClick={() => handleDelete(mat.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{mat.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mat.description}</p>
                <div className="text-[10px] text-slate-400 mt-2">Target: {mat.target_type} ({mat.target_community || mat.target_department || 'All'})</div>
              </div>

              <a href={mat.file_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open File</span>
              </a>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Upload Study Material</h3>
            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2.5 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select value={formData.material_type} onChange={e => setFormData({ ...formData, material_type: e.target.value })} className="w-full p-2.5 border rounded-xl font-bold">
                  <option value="PDF">PDF Document</option>
                  <option value="DOCX">DOCX</option>
                  <option value="PPT">PPT / Slides</option>
                  <option value="URL">External URL</option>
                </select>
              </div>

              {formData.material_type !== 'URL' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Choose File</label>
                  <input type="file" required onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full p-2 border rounded-xl" />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">External URL</label>
                  <input type="url" required placeholder="https://..." value={formData.external_url} onChange={e => setFormData({ ...formData, external_url: e.target.value })} className="w-full p-2.5 border rounded-xl" />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-3 py-1.5 bg-slate-100 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
