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
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onCloseMobile && onCloseMobile()}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
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
