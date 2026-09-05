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
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/manage-admins', label: 'Admin Members', icon: Crown },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/assessments', label: 'Assessments', icon: FileCheck },
    { to: '/admin/question-bank', label: 'Question Bank', icon: HelpCircle },
    { to: '/admin/study-materials', label: 'Study Materials', icon: BookOpen },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/results', label: 'Results', icon: BarChart },
    { to: '/admin/monitoring', label: 'Assessment Monitoring', icon: Activity },
    { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
    { to: '/admin/audit-log', label: 'Audit Log', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
          Admin Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
