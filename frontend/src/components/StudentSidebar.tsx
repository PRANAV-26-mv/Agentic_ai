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
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudentSidebar: React.FC = () => {
  const { logout } = useAuth();
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Student Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
