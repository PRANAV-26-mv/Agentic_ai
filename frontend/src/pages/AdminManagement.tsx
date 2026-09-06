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

  const handleDownloadBackup = () => {
    api.get('/admins/database/backup', { responseType: 'blob' })
      .then((res) => {
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

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Are you sure you want to restore the database from this backup JSON file? This will merge and overwrite portal collections.')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        api.post('/admins/database/restore', payload)
          .then(() => {
            alert('Database successfully restored! All assessments, students, results, and audit logs have been rehydrated.');
            window.location.reload();
          })
          .catch(err => alert(err.response?.data?.message || 'Failed to restore database. Invalid backup file format.'));
      } catch (err) {
        alert('Failed to parse JSON backup file. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

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
                Manage portal administrators, view system security, and backup/restore database state.
              </p>
            </div>
          </div>
        </div>
      </div>

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
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Database Backup & Cloud Persistence</h3>
              <p className="text-xs text-slate-400">Prevent data loss across Render restarts and download complete JSON snapshots.</p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full flex items-center space-x-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Persistence Engine</span>
          </span>
        </div>

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

        {/* Cloud Persistence Instructions for Render */}
        <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-800/40 text-xs text-slate-300 space-y-2">
          <h4 className="font-bold text-purple-300 flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>How Render.com Persistence & Cloud Storage Sync Works</span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Render free Web Services feature an <strong>ephemeral disk</strong>. When Render restarts or redeploys a new commit, local files reset to the Git repository state. To guarantee <strong>24/7 continuous automatic cloud data persistence</strong> without paying for disks:
          </p>
          <ul className="list-disc list-inside text-[11px] text-purple-200 space-y-1 font-mono">
            <li>Create a free account on <a href="https://jsonbin.io" target="_blank" rel="noreferrer" className="underline text-amber-300">JSONBin.io</a> or MongoDB Atlas.</li>
            <li>In Render Dashboard -&gt; Environment, set <span className="text-amber-300">DATABASE_SYNC_URL</span> to your cloud bin endpoint URL.</li>
            <li>Optionally set <span className="text-amber-300">DATABASE_SYNC_KEY</span> to your secret key.</li>
          </ul>
          <p className="text-[11px] text-slate-400">
            The portal backend automatically pulls the latest cloud snapshot on boot and saves every update to the cloud in real-time!
          </p>
        </div>

      </div>

    </div>
  );
};
