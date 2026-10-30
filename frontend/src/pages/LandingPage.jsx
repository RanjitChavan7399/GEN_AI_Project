import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Map,
  Mic,
  Users,
  Building2,
  CheckCircle2,
  Calendar,
  Briefcase
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [quickCompany, setQuickCompany] = useState('Google');
  const [quickRole, setQuickRole] = useState('Software Engineer');
  const [quickDate, setQuickDate] = useState('2026-10-15');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    navigate('/roadmap', { state: { company_name: quickCompany, job_role: quickRole, drive_date: quickDate } });
  };

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#0A1C15] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <main className="flex-grow z-10">
        
        {/* HERO SECTION */}
        <section className="relative pt-10 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#064E3B] font-extrabold text-xs shadow-sm">
                <Building2 className="w-4 h-4 text-[#059669]" />
                <span>College Campus Placement Portal</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#041E17] leading-[1.15] font-sans">
                Targeted Company Placement Prep &{' '}
                <span className="bg-gradient-to-r from-[#059669] via-[#10B981] to-[#047857] bg-clip-text text-transparent underline decoration-[#D9F99D] decoration-wavy">
                  Personalized Preparation.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#1A3328] font-medium leading-relaxed max-w-2xl">
                Specify your target company, job role, and drive date. Get instant company selection round breakdowns, core coding topics, and a personalized day-by-day countdown preparation schedule.
              </p>

              {/* CTAs: Personalized Preparation FIRST, then AI Resume Analyzer */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/roadmap"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-base shadow-glow-emerald hover:scale-[1.03] transition-all flex items-center gap-2 group"
                >
                  <Map className="w-5 h-5 text-[#D9F99D]" />
                  Start Personalized Preparation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#D9F99D]" />
                </Link>
                <Link
                  to="/resume-analyzer"
                  className="px-7 py-4 rounded-2xl bg-white border-2 border-[#10B981]/40 text-[#041E17] font-extrabold text-base hover:bg-emerald-50 hover:border-[#10B981] shadow-sm transition-all flex items-center gap-2"
                >
                  <FileText className="w-5 h-5 text-[#059669]" />
                  AI Resume Analyzer
                </Link>
              </div>

              {/* Features List */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-bold text-[#1A3328] border-t border-[#10B981]/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Personalized Prep Roadmap</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Company Selection Round Details</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Senior Interview Experiences</span>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Generator Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative z-10 glass-panel p-6 rounded-3xl shadow-2xl border border-[#10B981]/40 space-y-4">
                
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#059669]" />
                    <span className="text-sm font-black text-[#041E17]">Personalized Prep Generator</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#041E17] bg-[#D9F99D] px-2.5 py-1 rounded-full border border-[#10B981]/40">
                    Campus Portal
                  </span>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                      1. Target Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Google, Amazon, TCS, Infosys"
                        value={quickCompany}
                        onChange={(e) => setQuickCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                      2. Job Role
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Software Engineer, System Engineer"
                        value={quickRole}
                        onChange={(e) => setQuickRole(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                      3. Scheduled Drive Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        required
                        value={quickDate}
                        onChange={(e) => setQuickDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-xs shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Map className="w-4 h-4 text-[#D9F99D]" /> Generate Personalized Preparation Plan
                  </button>
                </form>

              </div>
            </motion.div>

          </div>
        </section>

        {/* CAMPUS MODULES SECTION */}
        <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#059669] bg-[#10B981]/20 px-3 py-1 rounded-full border border-[#10B981]/40">
              Campus Placement Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#041E17]">
              Complete Placement Preparation Modules
            </h2>
            <p className="text-sm font-semibold text-[#1A3328]">
              Designed to guide college candidates step-by-step from company drive setup to final interview selection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Module 1: Personalized Preparation (FIRST) */}
            <div className="glass-card p-6 rounded-3xl border border-[#10B981]/30 space-y-4 hover:shadow-glow-emerald">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold shadow-md">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#041E17]">Personalized Preparation</h3>
              <p className="text-xs text-[#1A3328] font-medium leading-relaxed">
                Provide your target company name, role, and drive date to get a customized day-by-day countdown checklist covering key DSA patterns, core CS concepts, and project revision.
              </p>
              <Link to="/roadmap" className="inline-flex items-center gap-1 text-xs font-black text-[#059669] hover:text-[#041E17]">
                Generate Personalized Plan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 2: AI Resume Analyzer (SECOND) */}
            <div className="glass-card p-6 rounded-3xl border border-[#10B981]/30 space-y-4 hover:shadow-glow-emerald">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#041E17]">AI Resume Analyzer</h3>
              <p className="text-xs text-[#1A3328] font-medium leading-relaxed">
                Upload your PDF/DOCX resume alongside a specific target company job description. Get instant match score, missing skills, bullet point suggestions, and section breakdown.
              </p>
              <Link to="/resume-analyzer" className="inline-flex items-center gap-1 text-xs font-black text-[#059669] hover:text-[#041E17]">
                Analyze Resume <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 3: Mock Technical Interview */}
            <div className="glass-card p-6 rounded-3xl border border-[#10B981]/30 space-y-4 hover:shadow-glow-emerald">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold shadow-md">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#041E17]">AI Mock Interview</h3>
              <p className="text-xs text-[#1A3328] font-medium leading-relaxed">
                Practice role-specific technical and HR interview questions with real-time feedback on technical correctness and terminology clarity.
              </p>
              <Link to="/mock-interview" className="inline-flex items-center gap-1 text-xs font-black text-[#059669] hover:text-[#041E17]">
                Start Practice <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 4: Experience Hub */}
            <div className="glass-card p-6 rounded-3xl border border-[#10B981]/30 space-y-4 hover:shadow-glow-emerald md:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#041E17]">Senior Interview Experience Hub</h3>
              <p className="text-xs text-[#1A3328] font-medium leading-relaxed">
                Read real, verified campus placement interview experiences shared by seniors. Learn specific interview rounds, questions asked, difficulty level, and key preparation tips.
              </p>
              <Link to="/experiences" className="inline-flex items-center gap-1 text-xs font-black text-[#059669] hover:text-[#041E17]">
                Explore Experiences <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 5: Company Directory */}
            <div className="glass-card p-6 rounded-3xl border border-[#10B981]/30 space-y-4 hover:shadow-glow-emerald">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#041E17]">Company Intelligence</h3>
              <p className="text-xs text-[#1A3328] font-medium leading-relaxed">
                Detailed corporate recruitment round breakdowns, eligibility criteria, and past coding problem patterns.
              </p>
              <Link to="/companies" className="inline-flex items-center gap-1 text-xs font-black text-[#059669] hover:text-[#041E17]">
                Browse Companies <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};
