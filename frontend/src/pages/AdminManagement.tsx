import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Admin } from '../types';
import { Shield, UserPlus, Trash2, Crown, Mail, Building, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const fetchAdmins = () => {
    setLoading(true);
    api.get('/admins')
      .then(res => setAdmins(res.data))
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
        fetchAdmins();
        setTimeout(() => setSuccessMsg(null), 3000);
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to delete admin member.');
      });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
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
              <h2 className="text-2xl font-black mt-1">Admin Member & Portal Access Control</h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Manage portal administrators. Add new admin members by entering their email address to grant full administrative access.
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
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering (CS)</option>
              <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science (AD)</option>
              <option value="Information Technology">Information Technology (IT)</option>
              <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
              <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Login Password</label>
            <input
              type="text"
              required
              placeholder="Default: 9488529035"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center space-x-2 transition-colors text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Registering Admin...' : 'Register & Grant Admin Access'}</span>
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

    </div>
  );
};
