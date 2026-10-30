import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyzerAPI } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import {
  Sparkles,
  FileText,
  Map,
  Mic,
  Users,
  Building2,
  TrendingUp,
  Target,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    analyzerAPI.getHistory()
      .then(res => {
        if (res.success) {
          setHistory(res.history || []);
        }
      })
      .catch(err => console.error("Failed to load history:", err))
      .finally(() => setLoadingHistory(false));
  }, []);

  const latestAnalysis = history.length > 0 ? history[0].result : null;

  const chartData = [
    { category: 'Skills Align', value: latestAnalysis?.match_score || 70, color: '#10B981' },
    { category: 'Experience', value: latestAnalysis?.score_breakdown?.experience_relevance || 65, color: '#059669' },
    { category: 'Projects', value: latestAnalysis?.score_breakdown?.projects_quality || 80, color: '#34D399' },
    { category: 'Certifications', value: latestAnalysis?.score_breakdown?.education_certification || 75, color: '#A7F3D0' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#0A1C15] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto overflow-y-auto">
          
          {/* TOP GREETING BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-banner-dark p-6 rounded-3xl relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/30 border border-[#10B981]/50 text-[#D9F99D] text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> Candidate Placement Portal
                </div>
                <h1 className="text-3xl font-black text-white">
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Candidate'}!
                </h1>
                <p className="text-xs font-semibold text-[#E6F9F0]">
                  Target Company: <span className="font-black text-[#D9F99D]">{user?.target_company || 'Google'}</span> • Role: <span className="font-black text-[#A7F3D0]">{user?.target_role || 'Software Engineer'}</span>
                </p>
              </div>

              {/* Action Buttons: Personalized Preparation FIRST, then Resume Analyzer */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/roadmap"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D9F99D] text-[#041E17] font-black text-xs shadow-glow-emerald hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Map className="w-4 h-4 text-[#041E17]" /> Personalized Preparation
                </Link>
                <Link
                  to="/resume-analyzer"
                  className="px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#D9F99D]" /> AI Resume Analyzer
                </Link>
              </div>
            </div>
          </motion.div>

          {/* QUICK STATS CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stat 1: Target Focus */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-300 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#1A3328] font-extrabold">
                <span>Target Focus</span>
                <Target className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="text-lg font-black text-[#041E17] truncate">{user?.target_company || 'Google'}</h3>
              <p className="text-xs text-[#059669] font-bold truncate">{user?.target_role || 'Software Engineer'}</p>
            </div>

            {/* Stat 2: Latest Resume Match */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-300 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#1A3328] font-extrabold">
                <span>Resume Match Score</span>
                <TrendingUp className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-[#059669]">
                  {latestAnalysis ? `${latestAnalysis.match_score}%` : 'Not Analyzed'}
                </h3>
                {latestAnalysis && <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">AI Verified</span>}
              </div>
              <p className="text-xs text-[#1A3328] font-semibold">
                {latestAnalysis ? `${latestAnalysis.matched_skills?.length || 0} skills aligned` : 'Upload resume to generate score'}
              </p>
            </div>

            {/* Stat 3: Preparation Milestone */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-300 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#1A3328] font-extrabold">
                <span>Personalized Prep Progress</span>
                <Map className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="text-2xl font-black text-[#041E17]">Stage 2 / 5</h3>
              <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full w-[40%]" />
              </div>
            </div>

            {/* Stat 4: Profile Readiness */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-300 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#1A3328] font-extrabold">
                <span>Profile Readiness</span>
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="text-2xl font-black text-[#059669]">90%</h3>
              <p className="text-xs text-[#1A3328] font-semibold">{user?.college ? user.college : 'Academic profile configured'}</p>
            </div>

          </div>

          {/* MAIN DASHBOARD CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Columns: Skill Breakdown Chart & Quick Action Launchers */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Data Visualization Card */}
              <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/30 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#041E17]">Placement Readiness Evaluation</h3>
                    <p className="text-xs font-semibold text-[#1A3328]">Visual breakdown across candidate skills and company target requirements</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#041E17] bg-[#D9F99D] px-3 py-1 rounded-full border border-emerald-400">
                    Live Score
                  </span>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="category" tick={{ fill: '#041E17', fontSize: 11, fontWeight: 800 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#1A3328', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#041E17', borderColor: '#10B981', borderRadius: '12px', color: '#FFF' }}
                        itemStyle={{ color: '#D9F99D', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Action Cards Grid (Personalized Preparation FIRST, then Resume Analyzer) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/roadmap"
                  className="glass-card p-5 rounded-2xl border border-emerald-300 hover:border-[#10B981] space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold">
                    <Map className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-[#041E17] group-hover:text-[#059669] transition-colors flex items-center justify-between">
                    Personalized Preparation <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#059669]" />
                  </h4>
                  <p className="text-xs font-semibold text-[#1A3328]">Company specific day-by-day drive prep schedule</p>
                </Link>

                <Link
                  to="/resume-analyzer"
                  className="glass-card p-5 rounded-2xl border border-emerald-300 hover:border-[#10B981] space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-[#041E17] group-hover:text-[#059669] transition-colors flex items-center justify-between">
                    Resume Analyzer <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#059669]" />
                  </h4>
                  <p className="text-xs font-semibold text-[#1A3328]">Match resume against specific target job descriptions</p>
                </Link>
              </div>

            </div>

            {/* Right 5 Columns: Recent Activity History & Recommended Topics */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Recent Analyses History */}
              <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/30 space-y-4">
                <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#059669]" /> Recent Resume Evaluations
                </h3>

                {loadingHistory ? (
                  <div className="text-xs font-semibold text-[#1A3328] py-4 text-center">Loading evaluation history...</div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold">
                        <div>
                          <p className="font-extrabold text-[#041E17]">{item.company_name} — {item.job_role}</p>
                          <p className="text-[10px] text-[#1A3328]">{item.filename}</p>
                        </div>
                        <span className="font-black text-[#041E17] bg-[#D9F99D] px-2.5 py-1 rounded-lg border border-emerald-400">
                          {item.result?.match_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-2xl text-center space-y-2 border border-dashed border-emerald-300">
                    <AlertCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-black text-[#041E17]">No Resume Evaluated Yet</p>
                    <p className="text-[11px] font-medium text-[#1A3328]">Upload your PDF/DOCX resume to generate your first match report.</p>
                    <Link to="/resume-analyzer" className="inline-block text-xs font-black text-[#059669] hover:underline">
                      Analyze Resume Now →
                    </Link>
                  </div>
                )}
              </div>

              {/* Recommended Topics */}
              <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/30 space-y-3">
                <h3 className="text-base font-black text-[#041E17]">Recommended Revision Topics</h3>
                <ul className="space-y-2 text-xs">
                  {[
                    'Data Structures: Trees, Graphs & Dynamic Programming',
                    'System Design: Load Balancing & Caching',
                    'SQL Query Optimization & Database Indexing',
                    'Object-Oriented Programming & SOLID Principles'
                  ].map((topic, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#041E17] font-bold bg-white p-2.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
