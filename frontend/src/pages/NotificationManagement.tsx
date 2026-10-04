import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Send, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Monitor, 
  Sparkles, 
  Crown, 
  ExternalLink, 
  Volume2, 
  ShieldCheck, 
  Users, 
  Link as LinkIcon 
} from 'lucide-react';

export const NotificationManagement: React.FC = () => {
  const { user } = useAuth();
  const { permission, requestPermission, sendTestNotification, refreshNotifications: globalRefresh } = useNotifications();

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingNotif, setEditingNotif] = useState<NotificationItem | null>(null);

  const [formData, setFormData] = useState<any>({
    title: '',
    message: '',
    target_type: 'ALL',
    target_community: 'AGENTIC AI & LLM OPTIMIZATION',
    target_department: 'Computer Science & Engineering',
    priority: 'NORMAL',
    action_url: ''
  });
  const [sending, setSending] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    if (editingNotif) {
      // Edit existing notification
      api.put(`/notifications/${editingNotif.id}`, formData)
        .then(() => {
          setSuccessMsg('Notification updated and broadcasted successfully!');
          setEditingNotif(null);
          setFormData({ 
            title: '', 
            message: '', 
            target_type: 'ALL', 
            priority: 'NORMAL',
            action_url: '',
            target_department: 'Computer Science & Engineering',
            target_community: 'AGENTIC AI & LLM OPTIMIZATION'
          });
          fetchNotifications();
          globalRefresh();
          setTimeout(() => setSuccessMsg(null), 3500);
        })
        .catch(err => alert(err.response?.data?.message || 'Failed to update notification'))
        .finally(() => setSending(false));
    } else {
      // Create new notification
      api.post('/notifications', formData)
        .then(() => {
          setSuccessMsg('Notification broadcasted! Desktop pop-up alert delivered to connected devices.');
          setFormData({ 
            title: '', 
            message: '', 
            target_type: 'ALL', 
            priority: 'NORMAL',
            action_url: '',
            target_department: 'Computer Science & Engineering',
            target_community: 'AGENTIC AI & LLM OPTIMIZATION'
          });
          fetchNotifications();
          globalRefresh();
          setTimeout(() => setSuccessMsg(null), 3500);
        })
        .catch(err => alert(err.response?.data?.message || 'Failed to send notification'))
        .finally(() => setSending(false));
    }
  };

  const handleEditClick = (notif: NotificationItem) => {
    setEditingNotif(notif);
    setFormData({
      title: notif.title,
      message: notif.message,
      target_type: notif.target_type,
      target_community: notif.target_community || 'AGENTIC AI & LLM OPTIMIZATION',
      target_department: notif.target_department || 'Computer Science & Engineering',
      priority: notif.priority,
      action_url: notif.action_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the notification "${title}"?`)) return;

    api.delete(`/notifications/${id}`)
      .then(() => {
        setSuccessMsg('Notification deleted successfully!');
        fetchNotifications();
        globalRefresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      })
      .catch(err => alert(err.response?.data?.message || 'Failed to delete notification'));
  };

  const cancelEdit = () => {
    setEditingNotif(null);
    setFormData({ 
      title: '', 
      message: '', 
      target_type: 'ALL', 
      priority: 'NORMAL',
      action_url: '',
      target_department: 'Computer Science & Engineering',
      target_community: 'AGENTIC AI & LLM OPTIMIZATION'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span>Broadcast & Desktop Notifications</span>
              {isSuperAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <Crown className="w-3 h-3 mr-1 text-amber-600" />
                  SUPER ADMIN
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Send broadcast notifications and direct meeting alerts with native OS pop-ups outside the browser.
            </p>
          </div>
        </div>

        {/* Test Desktop Notification Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => sendTestNotification()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center space-x-1.5"
            title="Triggers a native notification pop-up outside the browser window"
          >
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>Test Outside Pop-up</span>
          </button>
        </div>
      </div>

      {/* Desktop Pop-Up Status Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-purple-700/50">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white/10 rounded-xl text-purple-200 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">System Desktop Pop-Up Status</span>
              {permission === 'granted' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Active & Allowed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Permission Needed
                </span>
              )}
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              When enabled, notifications appear directly in Windows Action Center / OS desktop outside the browser tab.
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={() => requestPermission()}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-purple-900 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Allow Desktop Pop-ups</span>
          </button>
        )}
      </div>

      {/* Broadcast / Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            {editingNotif ? <Edit3 className="w-4 h-4 text-purple-600" /> : <Send className="w-4 h-4 text-purple-600" />}
            <span>{editingNotif ? 'Edit Sent Notification' : 'Compose New Broadcast Notification'}</span>
          </h3>
          {editingNotif && (
            <button type="button" onClick={cancelEdit} className="text-xs font-bold text-rose-600 hover:underline">
              Cancel Editing
            </button>
          )}
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Notification Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Mandatory Live Briefing with Super Admin"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Broadcast Message</label>
          <textarea
            rows={4}
            required
            placeholder="Enter announcement details, instructions, or meeting notes..."
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Action URL / Meeting Link */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
            <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Direct Action URL or Meeting Link (Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. /meetings/room/abc-123 or https://..."
            value={formData.action_url || ''}
            onChange={e => setFormData({ ...formData, action_url: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Clicking the pop-up notification outside the browser will immediately open this link.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
            <select
              value={formData.target_type}
              onChange={e => setFormData({ ...formData, target_type: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              <option value="ALL">🌐 All Students & Admins (Campus-Wide)</option>
              <option value="ADMINS_ONLY">🛡️ All Admins & Faculty Only (Staff Alert)</option>
              <option value="STUDENTS_ONLY">🎓 All Students Only</option>
              <option value="DEPARTMENT">🏢 Specific Department</option>
              <option value="COMMUNITY">👥 Specific Community</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-purple-700"
            >
              <option value="NORMAL">NORMAL (Standard Blue Badge)</option>
              <option value="IMPORTANT">IMPORTANT (Red Alert Badge & Sound)</option>
            </select>
          </div>
        </div>

        {formData.target_type === 'DEPARTMENT' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Department</label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science & Engineering"
              value={formData.target_department}
              onChange={e => setFormData({ ...formData, target_department: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        )}

        {formData.target_type === 'COMMUNITY' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Community</label>
            <input
              type="text"
              required
              placeholder="e.g. AGENTIC AI & LLM OPTIMIZATION"
              value={formData.target_community}
              onChange={e => setFormData({ ...formData, target_community: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center space-x-2 transition-colors text-xs"
          >
            {editingNotif ? <Edit3 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>{sending ? 'Broadcasting...' : (editingNotif ? 'Update & Broadcast' : 'Send & Trigger Desktop Pop-up')}</span>
          </button>
          
          {editingNotif && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Previously Sent Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Previously Broadcasted Notifications ({notifications.length})</span>
          </div>
          <button
            onClick={fetchNotifications}
            className="text-xs text-purple-600 hover:underline font-bold"
          >
            Refresh
          </button>
        </h3>

        {loading ? (
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400 font-bold">Loading Sent Notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No broadcasted notifications found. Create one above to notify members.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {notif.sender_role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        <Crown className="w-2.5 h-2.5 mr-1 text-amber-600" />
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                        ADMIN
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      notif.priority === 'IMPORTANT' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {notif.priority}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      notif.target_type === 'ADMINS_ONLY'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Target: {notif.target_type === 'ADMINS_ONLY' ? 'Admins Only' : notif.target_type}
                    </span>

                    <h4 className="font-bold text-sm text-slate-900 ml-1">{notif.title}</h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-medium">
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                    {notif.action_url && (
                      <a
                        href={notif.action_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline flex items-center space-x-0.5"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link: {notif.action_url}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleEditClick(notif)}
                    className="p-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-sm transition-colors"
                    title="Edit Notification"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClick(notif.id, notif.title)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-sm transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
