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
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  isLiveBadge?: boolean;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/assessments', label: 'Assessments', icon: FileText },
  ];

  const interactiveNav: NavItem[] = [
    { to: '/meetings', label: 'Live Meetings', icon: Video },
    { to: '/quiz-sessions', label: 'Live Quiz Sessions', icon: Zap, isLiveBadge: true },
    { to: '/gd-sessions', label: 'GD Sessions', icon: Users },
  ];

  const profileNav: NavItem[] = [
    { to: '/results', label: 'My Results', icon: BarChart2 },
    { to: '/attendance', label: 'Attendance', icon: Calendar },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/ask-doubt', label: 'Ask a Doubt', icon: MessageSquare },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ];

  const renderNavGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-0.5">
      {title && (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
          {title}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onCloseMobile && onCloseMobile()}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_8px_22px_rgba(99,102,241,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] font-semibold scale-[1.01]'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/70 hover:shadow-xs'
              }`
            }
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.isLiveBadge && (
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3.5 space-y-4">
      <div className="space-y-3">
        {/* Mobile Header Title */}
        <div className="flex items-center justify-between px-3 py-1 md:hidden">
          <span className="text-xs font-bold text-slate-900 tracking-tight">Navigation</span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-white/60"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {renderNavGroup(mainNav, 'Overview')}
        {renderNavGroup(interactiveNav, 'Collaboration')}
        {renderNavGroup(profileNav, 'Account & Progress')}
      </div>

      {/* User Identity Layered Floating Card */}
      <div className="pt-3 border-t border-white/60 space-y-2.5">
        <div className="apple-glass-card p-3 rounded-2xl flex items-center space-x-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-white/40">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-mono truncate">{user?.student_id || user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
            navigate('/login');
          }}
          className="apple-btn-glass w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Translucent Floating Liquid Glass Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 liquid-glass-sidebar rounded-3xl my-2 sm:my-3 min-h-[calc(100vh-6.5rem)] flex-col justify-between shrink-0 shadow-lg sticky top-22 self-start liquid-glow-border-hover">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Liquid Glass Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] liquid-glass-card h-full flex flex-col justify-between shadow-2xl z-10 border-r border-white/80 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
