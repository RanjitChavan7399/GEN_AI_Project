import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { Navbar } from '../components/layout/Navbar';
import { Sparkles, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(msg);
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
          className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[#10B981]/30 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#064E3B]">Welcome Back</h2>
            <p className="text-xs text-surface-textMuted">Sign in to your PrepNexus AI student account</p>
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
              <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D] shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:outline-none focus:border-[#10B981] text-xs font-medium text-[#14251D] shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-extrabold text-sm shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-surface-textMuted pt-2 border-t border-emerald-100">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#059669] hover:underline">
              Create student account
            </Link>
          </div>
        </motion.div>
      </main>

    </div>
  );
};
