import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = (notifId: string) => {
    api.post(`/notifications/${notifId}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Notification Center</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Official announcements, upcoming test reminders, and study material alerts.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-slate-200 rounded-xl"></div>
          <div className="h-20 bg-slate-200 rounded-xl"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                !n.is_read
                  ? 'bg-brand-50/50 border-brand-200 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl text-white ${
                n.priority === 'IMPORTANT' ? 'bg-rose-500' : 'bg-brand-600'
              }`}>
                {n.priority === 'IMPORTANT' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 bg-brand-600 rounded-full mt-1.5 flex-shrink-0 animate-pulse"></span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
