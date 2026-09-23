import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  BarChart2, 
  Calendar, 
  Bell, 
  MessageSquare, 
  User, 
  Zap,
  Video,
  LogOut,
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/assessments', label: 'Assessments', icon: FileText },
    { to: '/meetings', label: 'Live Meetings', icon: Video },
    { to: '/quiz-sessions', label: 'Live Quiz Sessions', icon: Zap },
    { to: '/results', label: 'My Results', icon: BarChart2 },
    { to: '/attendance', label: 'Attendance', icon: Calendar },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/ask-doubt', label: 'Ask a Doubt', icon: MessageSquare },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const sidebarInner = (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Student Portal
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Close Navigation Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isLiveQuiz = item.to === '/quiz-sessions';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onCloseMobile && onCloseMobile()}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-950/40 font-bold border-l-4 border-amber-400 pl-2.5'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className="w-5 h-5 shrink-0 group-hover:scale-125 group-hover:text-sky-300 transition-all duration-200 text-slate-400 group-hover:rotate-3" />
                <span className="truncate">{item.label}</span>
              </div>
              {isLiveQuiz && (
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-xs shadow-amber-500"></span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 text-xs">
          <p className="font-bold text-slate-100 truncate">{user?.name}</p>
          <p className="text-[11px] text-sky-300 font-mono truncate">{user?.student_id || user?.email}</p>
        </div>
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex-col justify-between p-4 shadow-xl shrink-0">
        {sidebarInner}
      </aside>

      {/* Mobile Drawer (Slide-Over with Backdrop Blur) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 h-full flex flex-col justify-between p-4 shadow-2xl z-10 overflow-y-auto">
            {sidebarInner}
          </aside>
        </div>
      )}
    </>
  );
};
