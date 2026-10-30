import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Map,
  Mic,
  Users,
  Building2,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Personalized Preparation FIRST, then Resume Analyzer
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Personalized Preparation', path: '/roadmap', icon: Map, badge: 'Main Focus' },
    { label: 'Resume Analyzer', path: '/resume-analyzer', icon: FileText },
    { label: 'Mock Interview', path: '/mock-interview', icon: Mic },
    { label: 'Experience Hub', path: '/experiences', icon: Users },
    { label: 'Companies', path: '/companies', icon: Building2 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-[#041E17] border-r border-[#10B981]/30 flex flex-col justify-between p-4 min-h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="flex flex-col gap-6">
        
        {/* User Card */}
        <div className="bg-[#064E3B] border border-[#10B981]/30 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#D9F99D] flex items-center justify-center text-[#041E17] font-black text-base shadow-sm">
            {user?.full_name?.charAt(0) || 'S'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-black text-white truncate">{user?.full_name || 'Student Candidate'}</h4>
            <p className="text-[11px] text-[#A7F3D0] font-medium truncate">{user?.email || 'student@college.edu'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#D9F99D] mb-1">Placement Workspace</p>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  active
                    ? 'text-[#041E17] font-black shadow-glow-emerald'
                    : 'text-[#E6F9F0] hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#10B981] to-[#D9F99D] rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#041E17]' : 'text-[#10B981]'}`} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`relative z-10 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    active ? 'bg-[#041E17] text-[#D9F99D]' : 'bg-[#10B981]/30 text-[#D9F99D] border border-[#10B981]/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Target Focus Badge & Logout */}
      <div className="flex flex-col gap-3 pt-4 border-t border-emerald-800/60">
        <div className="bg-[#064E3B]/80 border border-[#10B981]/30 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-[#D9F99D] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> Target Focus
          </div>
          <p className="text-xs text-white font-bold">{user?.target_company || 'Google'} — {user?.target_role || 'Software Engineer'}</p>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/60 border border-red-900/30 transition-all text-left"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Sign Out Account
        </button>
      </div>
    </aside>
  );
};
