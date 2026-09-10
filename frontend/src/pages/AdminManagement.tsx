import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Admin } from '../types';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Crown, 
  Mail, 
  Building, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Download,
  Upload,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminManagement: React.FC = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    department: 'Computer Science & Engineering',
    password: '9488529035'
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  const getLocalAdminBackup = (): Array<{ email: string; name: string; department: string; password?: string }> => {
    try {
      return JSON.parse(localStorage.getItem('portal_admins_backup') || '[]');
    } catch {
      return [];
    }
  };

  const saveLocalAdminBackup = (list: Admin[]) => {
    try {
      const customAdmins = list
        .filter(a => a.email.toLowerCase() !== 'pranavannur9659@gmail.com' && a.email.toLowerCase() !== 'admin@college.edu')
        .map(a => ({
          email: a.email,
          name: a.name,
          department: a.department,
          password: a.password || '9488529035'
        }));
      localStorage.setItem('portal_admins_backup', JSON.stringify(customAdmins));
    } catch (e) {
      console.error('Failed to update local backup:', e);
    }
  };

  const fetchAdmins = () => {
    setLoading(true);
    api.get('/admins')
      .then(async (res) => {
        const serverAdmins: Admin[] = res.data;
        const localBackup = getLocalAdminBackup();

        // Auto-heal: Check if any added admin members disappeared due to Render disk restart
        const missingAdmins = localBackup.filter(local => 
          !serverAdmins.some(server => server.email.toLowerCase() === local.email.toLowerCase())
        );

        if (missingAdmins.length > 0) {
          console.log('Detected missing admin members after Render reload. Auto-restoring:', missingAdmins);
          for (const missing of missingAdmins) {
            try {
              await api.post('/admins', missing);
            } catch (err) {
              console.error('Auto-restoration error for:', missing.email, err);
            }
          }
          const refreshed = await api.get('/admins');
          setAdmins(refreshed.data);
          saveLocalAdminBackup(refreshed.data);
        } else {
          setAdmins(serverAdmins);
          saveLocalAdminBackup(serverAdmins);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    api.post('/admins', formData)
      .then((res) => {
        setSuccessMsg(`Admin member '${res.data.email}' registered successfully!`);
        
        // Update local backup cache
        const currentBackup = getLocalAdminBackup();
        const updatedBackup = [...currentBackup.filter(a => a.email.toLowerCase() !== res.data.email.toLowerCase()), {
          email: res.data.email,
          name: res.data.name,
          department: res.data.department,
          password: formData.password || '9488529035'
        }];
        localStorage.setItem('portal_admins_backup', JSON.stringify(updatedBackup));

        setFormData({
          email: '',
          name: '',
          department: 'Computer Science & Engineering',
          password: '9488529035'
        });
        fetchAdmins();
        setTimeout(() => setSuccessMsg(null), 4000);
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to add admin member.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (id: string, email: string) => {
    if (email.toLowerCase() === 'pranavannur9659@gmail.com') {
      alert('Super Admin / Portal Owner cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove admin access for ${email}?`)) return;

    api.delete(`/admins/${id}`)
      .then(() => {
        setSuccessMsg(`Admin member '${email}' removed successfully.`);

        // Remove from local backup cache
        const currentBackup = getLocalAdminBackup();
        const updatedBackup = currentBackup.filter(a => a.email.toLowerCase() !== email.toLowerCase());
        localStorage.setItem('portal_admins_backup', JSON.stringify(updatedBackup));

        fetchAdmins();
        setTimeout(() => setSuccessMsg(null), 3000);
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to delete admin member.');
      });
  };

  const [storageStatus, setStorageStatus] = useState<{
    mode: string;
    is_ephemeral: boolean;
    has_database_url: boolean;
    has_cloud_sync: boolean;
    has_persistent_disk: boolean;
    last_saved: string;
    db_path: string;
    counts: {
      admins: number;
      students: number;
      assessments: number;
      questions: number;
      materials: number;
      attempts: number;
      attendance_sessions: number;
      notifications: number;
      audit_logs: number;
    };
  } | null>(null);
  const [restoringReset, setRestoringReset] = useState<boolean>(false);
  const [detectedServerReset, setDetectedServerReset] = useState<boolean>(false);

  const fetchStorageStatus = () => {
    api.get('/admins/database/status')
      .then(res => {
        setStorageStatus(res.data);

        // Check if server was reset to empty/seed while browser has a fuller local backup
        try {
          const cached = localStorage.getItem('portal_full_backup_snapshot');
          if (cached) {
            const parsed = JSON.parse(cached);
            const serverStudents = res.data?.counts?.students || 0;
            const cachedStudents = parsed?.students?.length || 0;
            const serverAssessments = res.data?.counts?.assessments || 0;
            const cachedAssessments = parsed?.assessments?.length || 0;

            if (res.data?.is_ephemeral && (cachedStudents > serverStudents || cachedAssessments > serverAssessments)) {
              setDetectedServerReset(true);
            } else {
              setDetectedServerReset(false);
            }
          }
        } catch (e) {
          console.error('Error checking local snapshot:', e);
        }
      })
      .catch(err => console.error('Failed to fetch storage status:', err));
  };

  const handleDownloadBackup = () => {
    api.get('/admins/database/backup', { responseType: 'blob' })
      .then((res) => {
        // Also cache latest in localStorage
        res.data.text().then((text: string) => {
          try {
            localStorage.setItem('portal_full_backup_snapshot', text);
          } catch {}
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `portal_database_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to download backup'));
  };

  const handleAutoRestoreFromCache = async () => {
    try {
      const cached = localStorage.getItem('portal_full_backup_snapshot');
      if (!cached) {
        alert('No browser backup snapshot found.');
        return;
      }
      setRestoringReset(true);
      const payload = JSON.parse(cached);
      await api.post('/admins/database/restore', payload);
      alert('✅ Database successfully restored from your browser snapshot! All data reloaded.');
      setDetectedServerReset(false);
      window.location.reload();
    } catch (err: any) {
      alert('Failed to restore from browser snapshot: ' + (err.message || 'Unknown error'));
    } finally {
      setRestoringReset(false);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Are you sure you want to restore the database from this backup JSON file? This will merge and rehydrate all portal data.')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        api.post('/admins/database/restore', payload)
          .then(() => {
            try {
              localStorage.setItem('portal_full_backup_snapshot', JSON.stringify(payload));
            } catch {}
            alert('✅ Database successfully restored! All assessments, students, results, doubts, and audit logs are rehydrated.');
            window.location.reload();
          })
          .catch(err => alert(err.response?.data?.message || 'Failed to restore database. Invalid backup file format.'));
      } catch (err) {
        alert('Failed to parse JSON backup file. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchStorageStatus();
    // Cache latest state quietly in background for emergency recovery
    api.get('/admins/database/backup').then(res => {
      try {
        localStorage.setItem('portal_full_backup_snapshot', JSON.stringify(res.data));
      } catch {}
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Super Admin Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Crown className="w-64 h-64 text-purple-400" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 backdrop-blur-sm">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-400 text-slate-950 tracking-wider">
                  Portal Owner & Super Admin
                </span>
                <span className="text-xs text-purple-300 font-mono">pranavannur9659@gmail.com</span>
              </div>
              <h2 className="text-2xl font-black mt-1">Admin Member & Database Control</h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Manage portal administrators, monitor real-time database persistence, and safeguard data against Render reloads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Server Reset Alert Banner */}
      {detectedServerReset && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-amber-900 text-sm">Server Reset Detected (Render Ephemeral Reload)</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Your Render container reloaded with baseline seed data, but your browser saved your previous custom portal state! You can immediately restore all your students, assessments, and results.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoRestoreFromCache}
            disabled={restoringReset}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${restoringReset ? 'animate-spin' : ''}`} />
            <span>{restoringReset ? 'Restoring...' : '1-Click Auto-Restore'}</span>
          </button>
        </div>
      )}

      {/* Form: Add New Admin Member */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5 text-xs">
        <div className="border-b pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-purple-600" />
            <span>Add New Admin Member by Email</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Full administrative permissions granted upon creation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Email Address *</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. faculty.cse@bitsathy.ac.in"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Rajesh Kumar"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-purple-600" />
              <span>Department</span>
            </label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Granting Access...' : 'Register Admin Member'}</span>
          </button>
        </div>
      </form>

      {/* Roster of Registered Admins */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Registered Admin Members ({admins.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Total authorized portal controllers</span>
        </div>

        {loading ? (
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400 font-bold">Loading admin roster...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map((adm) => {
              const isSuper = adm.email.toLowerCase() === 'pranavannur9659@gmail.com' || adm.is_super_admin;
              return (
                <div key={adm.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-all">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl font-bold ${isSuper ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                      {isSuper ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{adm.name}</h4>
                        {isSuper ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                            Super Admin (Portal Owner)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                            Admin Member
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-purple-700 font-semibold">{adm.email}</span>
                        <span>•</span>
                        <span>{adm.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    {!isSuper ? (
                      <button
                        onClick={() => handleDelete(adm.id, adm.email)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors"
                        title="Remove Admin Access"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove Admin</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        Protected Super Admin
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Database Backup, Persistence & Restore Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Database Persistence & Zero Data-Loss Engine</h3>
              <p className="text-xs text-slate-400">Real-time status, automatic cloud backup, and emergency restore across Render reloads.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {storageStatus?.mode === 'postgres' ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-700 px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL Cloud DB Connected (Zero Loss)</span>
              </span>
            ) : storageStatus?.has_persistent_disk ? (
              <span className="text-xs font-bold text-blue-400 bg-blue-950 border border-blue-700 px-3 py-1 rounded-full flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>Render Persistent Disk Connected</span>
              </span>
            ) : storageStatus?.has_cloud_sync ? (
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-700 px-3 py-1 rounded-full flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloud Storage Sync Connected</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-700 px-3 py-1 rounded-full flex items-center space-x-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Ephemeral Local (Connect PostgreSQL)</span>
              </span>
            )}
            <button
              onClick={fetchStorageStatus}
              title="Refresh Storage Status"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Database Inventory Counter */}
        {storageStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">Total Students</span>
              <span className="text-lg font-black text-purple-400">{storageStatus.counts.students}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">Assessments</span>
              <span className="text-lg font-black text-amber-400">{storageStatus.counts.assessments}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">Question Bank</span>
              <span className="text-lg font-black text-emerald-400">{storageStatus.counts.questions}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">Test Submissions</span>
              <span className="text-lg font-black text-cyan-400">{storageStatus.counts.attempts}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Backup Action Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>1-Click Database Export Backup</span>
            </div>
            <p className="text-xs text-slate-400">
              Download the entire portal dataset (Students, Admins, Assessments, Test Attempts, Results, Attendance, and Audit Logs) as a JSON snapshot file.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          {/* Restore Action Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Upload className="w-4 h-4" />
              <span>Restore Database from JSON Snapshot</span>
            </div>
            <p className="text-xs text-slate-400">
              Instantly rehydrate and restore all assessments, student accounts, and test results from a previously saved JSON backup file.
            </p>
            <label className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Backup JSON & Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* How to enable permanent PostgreSQL persistence on Render */}
        <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-800/40 text-xs text-slate-300 space-y-2.5">
          <h4 className="font-bold text-purple-300 flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>How to Guarantee 100% Zero Data-Loss on Render.com</span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            By default, Render free Web Services use an <strong>ephemeral filesystem</strong> that resets whenever the server sleeps or restarts. To make all data permanent 24/7 without losing anything:
          </p>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-purple-900/60 font-mono text-[11px] space-y-1.5 text-purple-200">
            <p className="font-bold text-amber-300">Method 1 (Automatic via Blueprint - Included):</p>
            <p className="text-slate-300">Your <span className="text-emerald-400 font-bold">render.yaml</span> file is now configured with <span className="text-amber-300 font-bold">student-portal-db</span> (managed PostgreSQL). When deployed via Blueprint, Render sets up PostgreSQL automatically!</p>
            
            <p className="font-bold text-amber-300 pt-2">Method 2 (Manual in Render Dashboard in 1 minute):</p>
            <p className="text-slate-300">1. In Render Dashboard, click <strong className="text-white">New +</strong> &rarr; <strong className="text-white">PostgreSQL</strong>.</p>
            <p className="text-slate-300">2. Name it <strong className="text-white">student-portal-db</strong> and click <strong className="text-white">Create Database</strong> (Free tier).</p>
            <p className="text-slate-300">3. Copy the <strong className="text-emerald-400">Internal Database URL</strong>.</p>
            <p className="text-slate-300">4. Go to your Web Service &rarr; <strong className="text-white">Environment</strong> &rarr; Add key: <strong className="text-amber-300">DATABASE_URL</strong> with the URL value &rarr; Save!</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Once connected, the backend automatically stores and syncs all portal data directly into PostgreSQL so nothing is ever lost!
          </p>
        </div>

      </div>

    </div>
  );
};

