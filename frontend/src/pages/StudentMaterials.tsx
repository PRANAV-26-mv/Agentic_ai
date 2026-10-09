import React, { useState, useEffect } from 'react';
import { api, getFileUrl } from '../services/api';
import { StudyMaterial } from '../types';
import { BookOpen, FileText, Download, ExternalLink, MessageSquare, Search, Filter, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/materials')
      .then(res => setMaterials(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || m.material_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAskDoubt = (matId: string) => {
    navigate('/ask-doubt', { state: { materialId: matId } });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 apple-glass-card p-6 rounded-[26px]">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Study Materials & Courseware</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Access curated lecture notes, research papers, and interactive AI study guides.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 liquid-glass-input text-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 liquid-glass-input text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="PPT">PPT</option>
            <option value="URL">External URL</option>
          </select>
        </div>
      </div>

      {/* Material Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-48 apple-glass-card rounded-2xl animate-pulse"></div>
          <div className="h-48 apple-glass-card rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => {
            const isUrl = mat.material_type === 'URL';
            const resolvedUrl = getFileUrl(mat.file_url);

            return (
              <div key={mat.id} className="apple-glass-card rounded-[24px] p-5.5 flex flex-col justify-between transition-all">
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-indigo-50/80 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs border border-indigo-100 shadow-sm">
                      {isUrl ? <Globe className="w-5 h-5 text-indigo-600" /> : mat.material_type}
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-700 apple-glass-pill px-2.5 py-1 rounded-full flex items-center space-x-1">
                      {isUrl ? (
                        <>
                          <Globe className="w-3 h-3 inline mr-1" />
                          <span>Website</span>
                        </>
                      ) : mat.page_count ? (
                        `${mat.page_count} pages`
                      ) : (
                        'Document'
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2">{mat.title}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-3">{mat.description || 'No description provided.'}</p>
                </div>

                {/* Action Buttons */}
                <div className={`pt-4 border-t border-white/60 ${isUrl ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2'}`}>
                  {isUrl ? (
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 apple-btn-primary text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit Site</span>
                    </a>
                  ) : (
                    <>
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 apple-btn-glass text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>

                      <a
                        href={resolvedUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 apple-btn-glass text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => handleAskDoubt(mat.id)}
                    className={`px-3 py-2 ${isUrl ? 'apple-btn-glass text-slate-700' : 'apple-btn-primary'} text-xs font-bold rounded-xl flex items-center justify-center space-x-1`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
