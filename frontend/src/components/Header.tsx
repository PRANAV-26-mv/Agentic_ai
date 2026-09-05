import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Shield, User as UserIcon, BookOpen, Crown, Menu, X } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  useEffect(() => {
    if (user && role === 'STUDENT') {
      api.get('/notifications')
        .then(res => {
          const unread = res.data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user, role]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Title & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 focus:outline-none transition-colors"
              title="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-purple-600" /> : <Menu className="w-5 h-5 text-purple-600" />}
            </button>
          )}

          <div className="bg-sky-600 text-white p-2 rounded-lg flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-xs sm:text-lg leading-tight">
              <span className="hidden sm:inline">Student Assessment & Learning Portal</span>
              <span className="inline sm:hidden font-extrabold text-xs">Assessment Portal</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Learn • Practice • Assess • Improve</p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          
          {/* Role / Super Admin Badge */}
          {isSuperAdmin ? (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">SUPER ADMIN PORTAL</span>
              <span className="inline sm:hidden uppercase font-black">SUPER</span>
            </span>
          ) : (
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border ${
              role === 'ADMIN' 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1 shrink-0" /> : <UserIcon className="w-3 h-3 mr-1 shrink-0" />}
              <span>{role}</span>
            </span>
          )}

          {/* Notifications (Student) */}
          {role === 'STUDENT' && (
            <Link 
              to="/notifications" 
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User Name */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
