import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, GraduationCap, BookOpen, Calendar, Building2, Save, CheckCircle2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    college: user?.college || '',
    branch: user?.branch || '',
    graduation_year: user?.graduation_year || '2026',
    target_company: user?.target_company || 'Google',
    target_role: user?.target_role || 'Software Engineer',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await authAPI.updateProfile(formData);
      updateUserProfile(formData);
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#14251D] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto overflow-y-auto">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#064E3B] font-bold text-xs border border-[#10B981]/30 mb-2">
              <User className="w-3.5 h-3.5 text-[#10B981]" /> Candidate Profile Settings
            </div>
            <h1 className="text-3xl font-black text-[#064E3B]">Student Profile</h1>
            <p className="text-xs text-surface-textMuted">Manage your target company focus and academic details.</p>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" /> {successMsg}
            </div>
          )}

          <div className="glass-panel p-8 rounded-3xl border border-[#10B981]/30 space-y-6 shadow-md">
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full p-3 rounded-xl border border-emerald-200 bg-gray-100 text-xs font-semibold text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Target Company Focus
                  </label>
                  <input
                    type="text"
                    value={formData.target_company}
                    onChange={(e) => setFormData({ ...formData, target_company: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Target Job Role
                  </label>
                  <input
                    type="text"
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    College / Institute
                  </label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Branch / Dept
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    className="w-full p-3 rounded-xl border border-emerald-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white font-extrabold text-xs shadow-glow-emerald hover:opacity-95 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#D9F99D]" /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>

          </div>

        </main>
      </div>
    </div>
  );
};
