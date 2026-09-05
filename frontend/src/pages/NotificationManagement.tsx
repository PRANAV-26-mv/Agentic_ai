import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, Send, Edit3, Trash2, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingNotif, setEditingNotif] = useState<NotificationItem | null>(null);

  const [formData, setFormData] = useState<any>({
    title: '',
    message: '',
    target_type: 'ALL',
    target_community: 'AGENTIC AI & LLM OPTIMIZATION',
    target_department: 'CS',
    priority: 'NORMAL'
  });
  const [sending, setSending] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => setNotifications(res.data))
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
          setSuccessMsg('Notification updated successfully!');
          setEditingNotif(null);
          setFormData({ title: '', message: '', target_type: 'ALL', priority: 'NORMAL' });
          fetchNotifications();
          setTimeout(() => setSuccessMsg(null), 3000);
        })
        .catch(err => alert(err.response?.data?.message || 'Failed to update notification'))
        .finally(() => setSending(false));
    } else {
      // Create new notification
      api.post('/notifications', formData)
        .then(() => {
          setSuccessMsg('Notification broadcasted successfully!');
          setFormData({ title: '', message: '', target_type: 'ALL', priority: 'NORMAL' });
          fetchNotifications();
          setTimeout(() => setSuccessMsg(null), 3000);
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
      target_department: notif.target_department || 'CS',
      priority: notif.priority
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the notification "${title}"?`)) return;

    api.delete(`/notifications/${id}`)
      .then(() => {
        setSuccessMsg('Notification deleted successfully!');
        fetchNotifications();
        setTimeout(() => setSuccessMsg(null), 3000);
      })
      .catch(err => alert(err.response?.data?.message || 'Failed to delete notification'));
  };

  const cancelEdit = () => {
    setEditingNotif(null);
    setFormData({ title: '', message: '', target_type: 'ALL', priority: 'NORMAL' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Broadcast Notifications & Management</h2>
            <p className="text-slate-500 text-xs mt-0.5">Send, edit, and delete announcements or assessment reminders for students.</p>
          </div>
        </div>
      </div>

      {/* Broadcast / Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            {editingNotif ? <Edit3 className="w-4 h-4 text-purple-600" /> : <Send className="w-4 h-4 text-purple-600" />}
            <span>{editingNotif ? 'Edit Sent Notification' : 'Compose New Notification'}</span>
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
            placeholder="e.g. Mandatory Assessment Deadline Reminder"
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
            placeholder="Enter announcement details..."
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
            <select
              value={formData.target_type}
              onChange={e => setFormData({ ...formData, target_type: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              <option value="ALL">All Students</option>
              <option value="COMMUNITY">Specific Community</option>
              <option value="DEPARTMENT">Specific Department</option>
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
              <option value="IMPORTANT">IMPORTANT (Red Alert Badge)</option>
            </select>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            <span>{sending ? 'Saving...' : (editingNotif ? 'Update Notification' : 'Send Broadcast Notification')}</span>
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
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2 border-b pb-3">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Previously Broadcasted Notifications ({notifications.length})</span>
        </h3>

        {loading ? (
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400 font-bold">Loading Sent Notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No broadcasted notifications found. Create one above to notify students.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      notif.priority === 'IMPORTANT' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {notif.priority}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Target: <span className="font-bold text-slate-600">{notif.target_type}</span> • {new Date(notif.created_at).toLocaleString()}
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
