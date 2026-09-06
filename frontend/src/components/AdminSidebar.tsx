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

  const rawNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/manage-admins', label: 'Admin Members', icon: Crown, superOnly: true },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/assessments', label: 'Assessments', icon: FileCheck },
    { to: '/admin/question-bank', label: 'Question Bank', icon: HelpCircle },
    { to: '/admin/study-materials', label: 'Study Materials', icon: BookOpen },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/results', label: 'Results', icon: BarChart },
    { to: '/admin/monitoring', label: 'Assessment Monitoring', icon: Activity },
    { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
    { to: '/admin/audit-log', label: 'User & Admin Activity', icon: ShieldAlert, superOnly: true },
  ];

  const navItems = rawNavItems.filter(item => !item.superOnly || isSuperAdmin);

  const sidebarInner = (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            Admin Management
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
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 text-xs">
          <p className="font-bold text-slate-100 truncate">{user?.name}</p>
          <p className="text-[11px] text-purple-300 font-mono truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
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
