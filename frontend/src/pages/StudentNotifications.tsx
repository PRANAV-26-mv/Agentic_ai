import React from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  AlertTriangle, 
  Video, 
  ExternalLink, 
  Crown, 
  CheckCircle2, 
  Sparkles, 
  Monitor 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, permission, requestPermission } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="liquid-glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            <span>Notification Center</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Official announcements, live meeting invitations from faculty, and assessment updates.
          </p>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={() => requestPermission()}
            className="px-3.5 py-2 liquid-btn-primary text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enable Desktop Pop-ups</span>
          </button>
        )}
      </div>

      {/* Desktop Pop-Up Status Ribbon */}
      <div className="p-3.5 liquid-glass-card rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Monitor className="w-4 h-4 text-indigo-600" />
          <span>
            {permission === 'granted'
              ? 'Desktop pop-up alerts outside browser are active on this device.'
              : 'Desktop pop-ups outside the browser are currently disabled. Click above to enable instant alerts.'}
          </span>
        </div>
        {permission === 'granted' && (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 liquid-glass-pill px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Active
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center liquid-glass-card rounded-2xl text-xs text-slate-400 italic">
          You are all caught up! No notifications at this time.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isMeeting = n.action_url?.includes('/meetings') || Boolean(n.meeting_code);

            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-5 rounded-2xl border transition-all flex items-start space-x-4 cursor-pointer ${
                  !n.is_read
                    ? 'liquid-glass-card border-indigo-300/80 shadow-[0_8px_30px_rgba(99,102,241,0.12)]'
                    : 'liquid-glass-card-hover border-white/60'
                }`}
              >
                <div className={`p-2.5 rounded-xl text-white shrink-0 ${
                  isMeeting
                    ? 'bg-rose-500'
                    : n.priority === 'IMPORTANT'
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}>
                  {isMeeting ? (
                    <Video className="w-5 h-5 animate-pulse" />
                  ) : n.priority === 'IMPORTANT' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      {n.sender_role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <Crown className="w-2.5 h-2.5 mr-1 text-amber-600" />
                          SUPER ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold liquid-glass-pill text-slate-700">
                          FACULTY / ADMIN
                        </span>
                      )}

                      <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  {/* Direct Action Link Button */}
                  {n.action_url && (
                    <div className="pt-2">
                      <Link
                        to={n.action_url}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 liquid-btn-primary text-xs font-bold rounded-lg"
                      >
                        {isMeeting ? <Video className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        <span>{isMeeting ? 'Join Live Meeting' : 'Open Link'}</span>
                      </Link>
                    </div>
                  )}
                </div>

                {!n.is_read && (
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 shrink-0 animate-ping" title="Unread"></span>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
