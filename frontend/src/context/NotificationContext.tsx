import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api, API_BASE_URL } from '../services/api';
import { NotificationItem } from '../types';
import { 
  isDesktopNotificationSupported, 
  getDesktopNotificationPermission, 
  requestDesktopNotificationPermission, 
  showDesktopNotification,
  DesktopNotificationPermissionStatus 
} from '../services/desktopNotificationService';
import { Bell, Video, X, ExternalLink, ShieldCheck, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  permission: DesktopNotificationPermissionStatus;
  requestPermission: () => Promise<DesktopNotificationPermissionStatus>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  sendTestNotification: () => void;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permission, setPermission] = useState<DesktopNotificationPermissionStatus>('default');
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Initialize permission status
  useEffect(() => {
    setPermission(getDesktopNotificationPermission());
    const dismissed = localStorage.getItem('portal_notif_banner_dismissed');
    if (getDesktopNotificationPermission() === 'default' && !dismissed) {
      setShowPromptBanner(true);
    }
  }, []);

  // Fetch notifications from server
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
        const unread = res.data.filter((n: NotificationItem) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Silently catch network errors
    }
  }, [user]);

  // Initial fetch and periodic background fallback polling (every 25 seconds)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();
    const interval = setInterval(refreshNotifications, 25000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  // Trigger incoming notification (both Desktop OS Popup + In-App Toast)
  const handleIncomingNotification = useCallback((notif: NotificationItem) => {
    // 1. Trigger OS Desktop Notification (outside the browser / app)
    showDesktopNotification({
      title: notif.title,
      message: notif.message,
      tag: notif.id,
      actionUrl: notif.action_url || (notif.meeting_code ? `/meetings/room/${notif.meeting_code}` : '/notifications'),
      requireInteraction: true
    });

    // 2. Trigger In-App Rich Toast
    setActiveToast(notif);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 8000);

    // 3. Refresh notification badge count
    setUnreadCount(prev => prev + 1);
    setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
  }, []);

  // Connect to global WebSocket notification channel
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = API_BASE_URL.startsWith('http')
      ? API_BASE_URL.replace(/\/api\/?$/, '')
      : window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1500
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Register client details for targeted push
      socket.emit('register-user', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        department: (user as any).department
      });
    });

    // Listen for broadcasted notification
    socket.on('notification-received', (notif: NotificationItem) => {
      handleIncomingNotification(notif);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, role, handleIncomingNotification]);

  // Request browser permission
  const requestPermission = async (): Promise<DesktopNotificationPermissionStatus> => {
    const status = await requestDesktopNotificationPermission();
    setPermission(status);
    if (status === 'granted') {
      setShowPromptBanner(false);
      // Give instant confirmation popup outside browser
      showDesktopNotification({
        title: '🔔 Desktop Notifications Activated!',
        message: 'You will now receive alerts outside this window when an administrator sends announcements or hosts live meetings.',
        tag: 'setup-success'
      });
    }
    return status;
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const sendTestNotification = () => {
    if (socketRef.current) {
      socketRef.current.emit('test-desktop-notification');
    } else {
      // Local fallback test
      handleIncomingNotification({
        id: `test-${Date.now()}`,
        title: '🔔 Desktop Notification Verified!',
        message: 'This pop-up appears outside your browser window on your OS screen when an admin sends an alert or meeting link.',
        priority: 'IMPORTANT',
        target_type: 'ALL',
        created_at: new Date().toISOString(),
        sender_role: 'SUPER_ADMIN',
        sender_name: 'System Admin'
      });
    }
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setActiveToast(null);
  };

  const dismissBanner = () => {
    setShowPromptBanner(false);
    localStorage.setItem('portal_notif_banner_dismissed', 'true');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      permission,
      requestPermission,
      refreshNotifications,
      markAsRead,
      sendTestNotification,
      dismissToast
    }}>
      {children}

      {/* Floating Permission Banner (If notifications not yet allowed) */}
      {showPromptBanner && permission === 'default' && user && (
        <div className="fixed bottom-4 right-4 sm:right-6 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-md text-white border border-purple-500/40 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-purple-600/30 border border-purple-500/50 rounded-xl text-purple-300 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold flex items-center space-x-1.5 text-white">
                <span>Enable Desktop Pop-Up Notifications</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Receive instant pop-ups outside the browser window when an Admin or Super Admin hosts meetings or broadcasts alerts.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={requestPermission}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enable Pop-ups</span>
                </button>
                <button
                  onClick={dismissBanner}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App Live Notification Toast */}
      {activeToast && (
        <div 
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-white border-2 border-purple-500 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 ring-4 ring-purple-500/10"
          onMouseEnter={() => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          }}
          onMouseLeave={() => {
            toastTimeoutRef.current = setTimeout(dismissToast, 4000);
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                activeToast.action_url?.includes('/meetings') || activeToast.meeting_code
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {activeToast.action_url?.includes('/meetings') || activeToast.meeting_code ? (
                  <Video className="w-5 h-5 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {activeToast.sender_role === 'SUPER_ADMIN' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown className="w-2.5 h-2.5 mr-1 text-amber-600" />
                      SUPER ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      ADMIN
                    </span>
                  )}
                  {activeToast.priority === 'IMPORTANT' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      URGENT
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                  {activeToast.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {activeToast.message}
                </p>
                
                {/* Action button if meeting or url */}
                <div className="mt-3 flex items-center space-x-2">
                  {activeToast.action_url ? (
                    <a
                      href={activeToast.action_url}
                      onClick={() => dismissToast()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                    >
                      <span>Join / Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => dismissToast()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
