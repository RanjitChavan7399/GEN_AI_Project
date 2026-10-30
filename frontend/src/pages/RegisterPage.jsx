import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { Navbar } from '../components/layout/Navbar';
import { Sparkles, User, Mail, Lock, GraduationCap, BookOpen, Calendar, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    college: '',
    branch: 'Computer Science',
    graduation_year: '2026'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const firstKey = Object.keys(errs)[0];
        const msg = Array.isArray(errs[firstKey]) ? errs[firstKey][0] : errs[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please check details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F2] flex flex-col justify-between relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-[#10B981]/30 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center mx-auto shadow-md">
              <UserPlus className="w-6 h-6 text-[#D9F99D]" />
            </div>
            <h2 className="text-2xl font-black text-[#064E3B]">Create Candidate Account</h2>
            <p className="text-xs text-surface-textMuted">Start your company-specific placement preparation with AI</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ranjit Chavan"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ranjit@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                College / Institute Name
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                  Branch / Department
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Computer Science / IT"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                  Graduation Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="2026"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-extrabold text-sm shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Complete Registration
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-surface-textMuted pt-2 border-t border-emerald-100">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#059669] hover:underline">
              Sign in to your account
            </Link>
          </div>
        </motion.div>
      </main>

    </div>
  );
};
