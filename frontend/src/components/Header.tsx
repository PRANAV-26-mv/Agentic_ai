import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, LogOut, Shield, User as UserIcon, BookOpen, Crown, Menu, X, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, permission, requestPermission } = useNotifications();

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;
  const notifTargetRoute = role === 'ADMIN' ? '/admin/notifications' : '/notifications';

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-2xl border-b border-black/[0.06] shadow-[0_1px_12px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Brand Title & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-black/[0.04] border border-black/[0.06] focus:outline-hidden transition-colors cursor-pointer"
              title="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <Menu className="w-4 h-4 text-slate-900" />}
            </button>
          )}

          {/* Minimalist Apple-inspired Brand Icon */}
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#1d1d1f] to-[#2c2c2e] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105 border border-white/10 shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">
                <span className="hidden sm:inline">Student Assessment & Learning</span>
                <span className="inline sm:hidden font-bold">CampusPortal</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-normal hidden sm:block">
                Precision Learning • Cohort Analytics • Group Discussion
              </p>
            </div>
          </Link>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* Role / Super Admin Badge */}
          {isSuperAdmin ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-900 border border-amber-500/20 shadow-2xs">
              <Crown className="w-3 h-3 mr-1 text-amber-600 shrink-0 animate-bounce" />
              <span className="hidden sm:inline">SUPER ADMIN</span>
              <span className="inline sm:hidden">SUPER</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] text-slate-800 border border-black/[0.06]">
              {role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1 text-indigo-600 shrink-0" /> : <UserIcon className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />}
              <span>{role}</span>
            </span>
          )}

          {/* Desktop Notification Status / Quick Trigger */}
          {permission === 'granted' ? (
            <div 
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
              title="Native desktop alerts active"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Alerts Active</span>
            </div>
          ) : (
            <button
              onClick={() => requestPermission()}
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 rounded-full transition-all duration-200 cursor-pointer"
              title="Click to enable native pop-ups"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Enable Alerts</span>
            </button>
          )}

          {/* Notifications Bell */}
          <Link 
            to={notifTargetRoute} 
            className="relative p-2 text-slate-600 hover:text-slate-900 bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] rounded-full transition-all duration-200 cursor-pointer"
            title={role === 'ADMIN' ? 'Admin Notifications' : 'Student Notifications'}
          >
            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bell-ring text-indigo-600' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Name Capsule */}
          <div className="hidden md:flex items-center space-x-2 pl-1 border-l border-black/[0.06]">
            <div className="w-7 h-7 rounded-full bg-black/[0.06] text-slate-800 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{user?.student_id || user?.email}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 bg-black/[0.03] hover:bg-rose-50 border border-black/[0.06] hover:border-rose-200 rounded-full transition-all duration-200 cursor-pointer"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
