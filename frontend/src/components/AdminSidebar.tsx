import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  HelpCircle, 
  BookOpen, 
  CalendarCheck, 
  Bell, 
  BarChart, 
  Activity, 
  PieChart, 
  ShieldAlert,
  Crown, 
  Zap,
  Ban,
  Mail,
  Award,
  Video,
  MessagesSquare,
  LogOut,
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  const coreNav = [
    { to: '/admin/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/admin/manage-admins', label: 'Admin Members', icon: Crown, superOnly: true },
    { to: '/admin/restrictions', label: 'User Restrictions', icon: Ban, superOnly: true },
    { to: '/admin/send-emails', label: 'Email Broadcasts', icon: Mail },
  ];

  const sessionsNav = [
    { to: '/admin/meetings', label: 'Live Meetings', icon: Video },
    { to: '/admin/quiz-sessions', label: 'Live Quiz Sessions', icon: Zap, isLiveBadge: true },
    { to: '/admin/gd-sessions', label: 'GD Sessions', icon: MessagesSquare },
    { to: '/admin/assessments', label: 'Assessments', icon: FileCheck },
    { to: '/admin/monitoring', label: 'Live Monitoring', icon: Activity, isPulseGreen: true },
  ];

  const academicNav = [
    { to: '/admin/students', label: 'Student Directory', icon: Users },
    { to: '/admin/question-bank', label: 'Question Bank', icon: HelpCircle },
    { to: '/admin/study-materials', label: 'Study Materials', icon: BookOpen },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/results', label: 'Assessment Results', icon: BarChart },
    { to: '/admin/certificate-settings', label: 'Certificates', icon: Award },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
    { to: '/admin/audit-log', label: 'Audit Logs', icon: ShieldAlert, superOnly: true },
  ];

  const renderNavGroup = (items: Array<any>, title?: string) => {
    const visibleItems = items.filter(item => !item.superOnly || isSuperAdmin);
    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-0.5">
        {title && (
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
            {title}
          </p>
        )}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onCloseMobile && onCloseMobile()}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.isLiveBadge ? (
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              ) : item.isPulseGreen ? (
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3.5 space-y-4">
      <div className="space-y-3">
        {/* Mobile Header Title */}
        <div className="flex items-center justify-between px-3 py-1 md:hidden">
          <span className="text-xs font-bold text-slate-900 tracking-tight">Admin Console</span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-black/[0.05]"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {renderNavGroup(coreNav, 'Administration')}
        {renderNavGroup(sessionsNav, 'Live Sessions & Monitoring')}
        {renderNavGroup(academicNav, 'Academic Data & System')}
      </div>

      {/* Admin Identity Footer */}
      <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
        <div className="flex items-center space-x-2.5 px-2.5 py-1.5 bg-black/[0.02] rounded-xl border border-black/[0.04]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-[#1d1d1f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Frosted Glass Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/70 backdrop-blur-2xl border-r border-black/[0.06] min-h-[calc(100vh-4rem)] flex-col justify-between shrink-0 shadow-[1px_0_12px_rgba(0,0,0,0.02)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white/95 backdrop-blur-2xl h-full flex flex-col justify-between shadow-2xl z-10 border-r border-black/[0.08] overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
