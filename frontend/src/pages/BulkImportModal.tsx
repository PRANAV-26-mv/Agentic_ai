import React, { useState } from 'react';
import { api } from '../services/api';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setErrorMsg(null);
    }
  };

  const handleDryRun = () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'dry-run');

    api.post('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => setPreviewData(res.data))
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Unable to process file. Upload a valid CSV or XLSX file.');
      })
      .finally(() => setLoading(false));
  };

  const handleCommit = () => {
    if (!file || !previewData || !previewData.canCommit) return;
    setCommitting(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'commit');

    api.post('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Bulk import commit failed.');
      })
      .finally(() => setCommitting(false));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <span>Bulk Student Import (CSV / XLSX)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        {/* Upload Dropzone */}
        <div className="space-y-4 flex-shrink-0">
          <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="bulk-import-input"
            />
            <label htmlFor="bulk-import-input" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-purple-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">
                {file ? file.name : 'Click to select CSV or XLSX file'}
              </div>
              <p className="text-[11px] text-slate-400">Supported columns: Student ID, Name, Email, Department, Year, Community</p>
            </label>
          </div>

          {file && !previewData && (
            <button
              onClick={handleDryRun}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {loading ? 'Validating CSV Rows...' : 'Run Preview (Dry Run)'}
            </button>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Dry-run Preview Table matching §44 */}
        {previewData && (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 border-t pt-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Import Preview Results</span>
              <div className="space-x-3">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">Valid: {previewData.validCount}</span>
                <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded-md">Errors: {previewData.errorCount}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Student ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.rows.map((r: any) => (
                    <tr key={r.rowNumber} className={r.status === 'ERROR' ? 'bg-rose-50/50' : ''}>
                      <td className="p-2.5 text-slate-400">{r.rowNumber}</td>
                      <td className="p-2.5 font-bold font-mono">{r.studentId}</td>
                      <td className="p-2.5 font-medium">{r.name}</td>
                      <td className="p-2.5 text-slate-500">{r.email}</td>
                      <td className="p-2.5">
                        {r.status === 'VALID' ? (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center space-x-1" title={r.errorReason}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">{r.errorReason}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t flex justify-end space-x-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200">
            Cancel
          </button>

          {previewData && (
            <button
              onClick={handleCommit}
              disabled={!previewData.canCommit || committing}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {committing ? 'Committing Students...' : 'Commit Import'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
