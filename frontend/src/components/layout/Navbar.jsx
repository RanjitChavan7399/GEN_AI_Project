import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, FileText, Map, User, LogOut, LayoutDashboard, Menu, X, Compass, Building2, MessageSquareQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Personalized Preparation comes FIRST, then Resume Analyzer
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Personalized Preparation', path: '/roadmap', highlight: true },
    { name: 'Resume Analyzer', path: '/resume-analyzer' },
    { name: 'Mock Interview', path: '/mock-interview' },
    { name: 'Experience Hub', path: '/experiences' },
    { name: 'Companies', path: '/companies' },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-3 backdrop-blur-md bg-[#041E17] border-b border-[#10B981]/30 shadow-lg text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#D9F99D] p-[2px] shadow-glow-emerald group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#064E3B] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D9F99D] animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-[#A7F3D0] to-[#D9F99D] bg-clip-text text-transparent font-sans">
              PrepNexus <span className="text-[#10B981] font-bold text-xs px-1.5 py-0.5 rounded bg-[#10B981]/20 border border-[#10B981]/40 ml-1">AI</span>
            </span>
            <p className="text-[11px] text-[#A7F3D0] font-semibold tracking-tight -mt-0.5">Placement Intelligence Portal</p>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#064E3B]/80 p-1.5 rounded-full border border-[#10B981]/30">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${
                  active
                    ? 'text-[#041E17] font-extrabold shadow-md'
                    : 'text-[#E6F9F0] hover:text-white hover:bg-emerald-800/60'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-gradient-to-r from-[#10B981] to-[#D9F99D] rounded-full z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {link.highlight && <Sparkles className={`w-3.5 h-3.5 ${active ? 'text-[#041E17]' : 'text-[#D9F99D]'}`} />}
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* AUTH ACTIONS */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#10B981]/20 text-[#D9F99D] border border-[#10B981]/40 hover:bg-[#10B981]/30 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-gradient-to-r from-[#059669] to-[#10B981] flex items-center justify-center font-extrabold text-white shadow-md border border-[#D9F99D]/60">
                  {user?.full_name?.charAt(0) || 'S'}
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#041E17] border border-[#10B981]/40 rounded-xl shadow-2xl py-2 hidden group-hover:block backdrop-blur-xl">
                  <div className="px-4 py-2 border-b border-emerald-800/60">
                    <p className="text-xs font-bold text-white">{user?.full_name}</p>
                    <p className="text-[11px] text-[#A7F3D0] truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#E6F9F0] hover:bg-emerald-900/80">
                    <User className="w-3.5 h-3.5 text-[#10B981]" /> Profile Settings
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-950/60 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#E6F9F0] hover:text-white hover:bg-emerald-900/60 transition-all"
              >
                Student Sign In
              </Link>
              <Link
                to="/roadmap"
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#10B981] to-[#D9F99D] text-[#041E17] shadow-glow-emerald hover:opacity-95 hover:scale-[1.02] transition-all"
              >
                Campus Prep Portal
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-emerald-900/80 text-white border border-emerald-700/50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#D9F99D]" /> : <Menu className="w-6 h-6 text-[#D9F99D]" />}
        </button>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-3 pt-3 border-t border-emerald-800/60 flex flex-col gap-2 overflow-hidden bg-[#041E17] p-3 rounded-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  isActive(link.path)
                    ? 'bg-[#10B981] text-[#041E17]'
                    : 'text-[#E6F9F0] hover:bg-emerald-900/70'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-emerald-800/50 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#10B981]/30 text-[#D9F99D] flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold text-red-300 bg-red-950/40 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold text-center text-[#E6F9F0] bg-emerald-900/60"
                  >
                    Student Sign In
                  </Link>
                  <Link
                    to="/roadmap"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-black text-center bg-gradient-to-r from-[#10B981] to-[#D9F99D] text-[#041E17]"
                  >
                    Campus Prep Portal
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
