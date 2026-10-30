import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { companyPrepAPI, experiencesAPI } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import {
  Map,
  Sparkles,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  Check,
  AlertCircle,
  FileCheck,
  Zap,
  ListTodo,
  FileText,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Globe,
  User,
  MapPin,
  Newspaper,
  Layers,
  Award,
  ThumbsUp,
  Lightbulb,
  Send,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';

export const RoadmapPage = () => {
  const location = useLocation();
  const initialData = location.state || {};

  const [companyName, setCompanyName] = useState(initialData.company_name || 'Google');
  const [jobRole, setJobRole] = useState(initialData.job_role || 'Software Engineer');
  const [daysRemaining, setDaysRemaining] = useState(initialData.days_remaining || 7);
  const [jobDescription, setJobDescription] = useState(initialData.job_description || '');

  const [loading, setLoading] = useState(false);
  const [roadmapResult, setRoadmapResult] = useState(null);
  const [overviewResult, setOverviewResult] = useState(null);
  const [questionsResult, setQuestionsResult] = useState([]);
  const [experiencesResult, setExperiencesResult] = useState([]);
  const [error, setError] = useState('');
  const [completedItems, setCompletedItems] = useState({});

  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);

  // Concept Explainer State (Module D)
  const [conceptQuery, setConceptQuery] = useState('');
  const [explainingConcept, setExplainingConcept] = useState(false);
  const [conceptResult, setConceptResult] = useState(null);
  const [conceptError, setConceptError] = useState('');

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState(null);

  useEffect(() => {
    handleGenerateRoadmap();
    fetchSavedRoadmaps();
  }, []);

  const fetchSavedRoadmaps = async () => {
    try {
      const res = await companyPrepAPI.getSavedRoadmaps();
      if (res.success) {
        setSavedRoadmaps(res.roadmaps || []);
      }
    } catch (err) {
      console.warn("Could not load saved roadmaps:", err);
    }
  };

  const handleSelectSavedRoadmap = (saved) => {
    if (saved && saved.roadmap) {
      setRoadmapResult(saved.roadmap);
      setCompanyName(saved.company_name);
      setJobRole(saved.job_role);
      setDaysRemaining(saved.days_remaining || 7);
      setShowSavedList(false);
    }
  };

  const handleExplainConcept = async (customConcept) => {
    const target = customConcept || conceptQuery;
    if (!target || !target.trim()) {
      setConceptError('Please enter a concept or select a topic to explain.');
      return;
    }
    setConceptError('');
    setExplainingConcept(true);
    try {
      const res = await companyPrepAPI.explainConcept({
        concept: target.trim(),
        company_name: companyName,
        job_role: jobRole
      });
      if (res.success) {
        setConceptResult(res.data);
      }
    } catch (err) {
      setConceptError(err.response?.data?.error || 'Failed to explain concept with Gemini AI.');
    } finally {
      setExplainingConcept(false);
    }
  };

  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Please provide the Target Company Name.');
      return;
    }
    if (!jobRole.trim()) {
      setError('Please provide the Job Role.');
      return;
    }

    setLoading(true);

    try {
      const [roadmapRes, overviewRes, questionsRes, experiencesRes] = await Promise.all([
        companyPrepAPI.generateRoadmap({
          company_name: companyName,
          job_role: jobRole,
          days_remaining: parseInt(daysRemaining, 10),
          job_description: jobDescription
        }),
        companyPrepAPI.getOverview({
          company_name: companyName,
          job_role: jobRole,
          job_description: jobDescription
        }),
        companyPrepAPI.getQuestions({
          company_name: companyName,
          job_role: jobRole,
          category: 'all'
        }),
        experiencesAPI.getExperiences(companyName)
      ]);

      if (roadmapRes.success) {
        setRoadmapResult(roadmapRes.data);
      }
      if (overviewRes.success) {
        setOverviewResult(overviewRes.data);
      }
      if (questionsRes.success) {
        setQuestionsResult(questionsRes.questions || []);
      }
      const expList = Array.isArray(experiencesRes) ? experiencesRes : (experiencesRes?.experiences || []);
      setExperiencesResult(expList);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while contacting the roadmap generator.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (id, text) => {
    if (!('speechSynthesis' in window)) return;
    
    if (playingAudioId === id) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;

    utterance.onstart = () => setPlayingAudioId(id);
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    window.speechSynthesis.speak(utterance);
  };

  const toggleCheck = (dayNum, idx) => {
    const key = `${dayNum}-${idx}`;
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const companyDetails = overviewResult?.company_details || {};

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#0A1C15] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto overflow-y-auto">
          
          {/* PAGE TITLE */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/20 text-[#041E17] font-extrabold text-xs border border-[#10B981]/40 mb-2">
              <Map className="w-3.5 h-3.5 text-[#059669]" /> Target Company Placement Intelligence Dashboard
            </div>
            <h1 className="text-3xl font-black text-[#041E17]">Company Specific Preparation Dashboard</h1>
            <p className="text-xs font-bold text-[#1A3328]">
              Comprehensive corporate profile, community experiences, recruitment drive rounds, priority focus topics, audio Q&A, and countdown roadmap.
            </p>
          </div>

          {/* INPUT FORM CARD */}
          <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/40 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#059669]" /> Target Placement Drive Setup
              </h3>
              {savedRoadmaps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSavedList(!showSavedList)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#064E3B] font-black text-xs border border-emerald-300 transition-all flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-[#059669]" /> Saved Roadmaps ({savedRoadmaps.length})
                </button>
              )}
            </div>

            {/* SAVED ROADMAPS DROPDOWN */}
            {showSavedList && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-lg space-y-2 animate-fade-in">
                <h4 className="text-xs font-black text-[#041E17] uppercase tracking-wider">Select a Saved Roadmap:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {savedRoadmaps.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSavedRoadmap(r)}
                      className="p-3 rounded-xl border border-emerald-200 hover:border-[#10B981] hover:bg-emerald-50 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-[#064E3B]">{r.company_name}</span>
                        <span className="text-[10px] font-bold text-gray-500">{r.days_remaining} Days</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 truncate">{r.job_role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateRoadmap} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              <div className="md:col-span-4">
                <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Amazon, TCS, Infosys"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                  Target Job Role *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer, SDE-1"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                  Days Remaining Before Drive
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={daysRemaining}
                    onChange={(e) => setDaysRemaining(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="md:col-span-12 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-xs shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Fetching Corporate Intelligence & Generating Countdown Package...</span>
                    </div>
                  ) : (
                    <>
                      <Map className="w-4 h-4 text-[#D9F99D]" /> Load Company Dashboard & Generate Audio Roadmap
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* DASHBOARD CONTENT */}
          {roadmapResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              
              {/* SECTION 1: DETAILED COMPANY CORPORATE PROFILE */}
              <div className="glass-panel p-8 rounded-3xl border border-emerald-300 space-y-6 bg-white/90 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-black text-2xl shadow-md">
                      {companyName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#059669] uppercase tracking-wider">Corporate Overview</span>
                      <h2 className="text-2xl font-black text-[#041E17]">{companyDetails.name || companyName}</h2>
                    </div>
                  </div>
                  <div className="bg-[#064E3B] text-[#D9F99D] px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                    {daysRemaining} Days Countdown Strategy
                  </div>
                </div>

                <p className="text-xs font-bold text-[#1A3328] leading-relaxed">
                  {companyDetails.description || overviewResult?.company_overview}
                </p>

                {/* METADATA GRID: EMPLOYEES, CEO, HEADQUARTERS, FOUNDING YEAR, DOMAIN */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-[#059669]" /> Employees
                    </div>
                    <p className="text-xs font-black text-[#041E17]">{companyDetails.no_of_employees || '10,000+'}</p>
                  </div>

                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                      <User className="w-3.5 h-3.5 text-[#059669]" /> CEO / Executive
                    </div>
                    <p className="text-xs font-black text-[#041E17]">{companyDetails.ceo || 'Executive Board'}</p>
                  </div>

                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#059669]" /> Headquarters
                    </div>
                    <p className="text-xs font-black text-[#041E17]">{companyDetails.headquarters || 'Global HQ'}</p>
                  </div>

                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#059669]" /> Founding Year
                    </div>
                    <p className="text-xs font-black text-[#041E17]">{companyDetails.founding_year || 'Established'}</p>
                  </div>

                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-[#059669]" /> Domain / Industry
                    </div>
                    <p className="text-xs font-black text-[#041E17]">{companyDetails.domain || 'Software & Tech'}</p>
                  </div>
                </div>

                {/* MAIN PRODUCTS & LATEST NEWS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <h4 className="text-xs font-black text-[#041E17] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#059669]" /> Core Products & Key Platforms
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {companyDetails.main_products?.map((prod, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-black text-[11px] border border-emerald-300">
                          {prod}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <h4 className="text-xs font-black text-[#041E17] flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#059669]" /> Latest News & Tech Highlights
                    </h4>
                    <ul className="space-y-1 text-xs font-bold text-gray-700">
                      {companyDetails.latest_news?.map((news, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#059669] font-black">•</span>
                          <span>{news}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>


              {/* SECTION 2: EXPERIENCES SHARED BY STUDENTS (COMMUNITY RAG INSIGHTS) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#041E17] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#059669]" /> Experiences Shared for {companyName}
                  </h3>
                  <span className="text-xs font-extrabold text-[#059669] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    {experiencesResult.length} Student Reports Found
                  </span>
                </div>

                {experiencesResult.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {experiencesResult.map((exp, idx) => (
                      <div key={idx} className="glass-card p-5 rounded-3xl border border-emerald-300 space-y-3 bg-white/80">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black text-[10px]">
                              {exp.company_name || exp.company} • {exp.job_role || exp.role}
                            </span>
                            <h4 className="text-sm font-black text-[#041E17] mt-1">
                              {exp.student_name || exp.student} <span className="text-xs font-semibold text-gray-600">({exp.college})</span>
                            </h4>
                          </div>
                          <span className="text-[10px] font-black text-[#059669] bg-emerald-100 px-2 py-0.5 rounded-md">
                            ★ {exp.upvotes || 0} Upvotes
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#0A1C15] bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                          "{exp.summary}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-600">
                          <span>Rounds: {exp.rounds_conducted || 'Technical & HR'}</span>
                          <span className="text-emerald-800">{exp.status || 'Offered'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 text-xs font-bold text-gray-600 text-center">
                    No community experiences submitted yet for {companyName}. RAG system using general placement benchmarks.
                  </div>
                )}
              </div>


              {/* SECTION 3: RECRUITMENT DRIVE PATTERN & SELECTION ROUNDS */}
              {overviewResult?.recruitment_stages && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-[#041E17] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#059669]" /> Recruitment Drive Pattern & Selection Rounds
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewResult.recruitment_stages.map((round, idx) => (
                      <div key={idx} className="glass-card p-5 rounded-2xl border border-emerald-300 space-y-2 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-xl bg-[#064E3B] text-[#D9F99D] font-black text-xs flex items-center justify-center">
                            R{round.stage_number}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#041E17] bg-[#D9F99D] px-2 py-0.5 rounded-md border border-emerald-400">
                            {round.duration}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-[#041E17] leading-tight">{round.stage_name}</h4>
                        <p className="text-xs font-bold text-[#1A3328] leading-relaxed">{round.description}</p>
                        
                        <div className="pt-1 flex flex-wrap gap-1">
                          {round.key_topics?.map((topic, i) => (
                            <span key={i} className="text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-[#041E17] px-2 py-0.5 rounded-md">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* SECTION 4: MAIN TOPICS TO FOCUS & KEY REQUIRED SKILLS */}
              <div className="glass-panel p-6 rounded-3xl border border-emerald-300 space-y-4 bg-white">
                <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#059669]" /> Main Topics & Key Skills to Focus for {companyName}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-[#041E17] uppercase tracking-wider">Required Core Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {overviewResult?.key_skills_required?.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-xl bg-[#10B981]/20 text-[#041E17] border border-[#10B981]/40 font-black text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-[#041E17] uppercase tracking-wider">Preparation Priorities:</span>
                    <div className="space-y-1.5">
                      {overviewResult?.preparation_priorities?.map((priority, i) => (
                        <div key={i} className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold flex justify-between items-center">
                          <span><strong>{priority.category}:</strong> {priority.focus_areas}</span>
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-md">
                            {priority.importance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 5: DAY BY DAY COUNTDOWN ROADMAP */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#041E17] flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-[#059669]" /> Customized {daysRemaining}-Day Countdown Roadmap
                  </h3>
                  <span className="text-xs font-black text-[#041E17] bg-[#D9F99D] px-3 py-1 rounded-full border border-emerald-400">
                    {roadmapResult.daily_plan?.length || 0} Daily Milestones
                  </span>
                </div>

                <div className="space-y-4">
                  {roadmapResult.daily_plan?.map((dayPlan) => (
                    <div key={dayPlan.day} className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-3 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-black text-sm shrink-0">
                            Day {dayPlan.day}
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-[#059669] uppercase tracking-wider">{dayPlan.phase}</span>
                            <h4 className="text-base font-black text-[#041E17]">{dayPlan.title}</h4>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#059669]">Estimated: {dayPlan.estimated_hours || 3} Hours</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-[#041E17]">Action Tasks:</span>
                        <div className="space-y-2">
                          {dayPlan.tasks?.map((item, idx) => {
                            const isDone = !!completedItems[`${dayPlan.day}-${idx}`];
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleCheck(dayPlan.day, idx)}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-3 cursor-pointer transition-all ${
                                  isDone
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 line-through'
                                    : 'bg-white border-emerald-200 text-[#0A1C15] hover:border-[#10B981]'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                  isDone ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-emerald-400 bg-white'
                                }`}>
                                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <span>{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* SECTION 6: TARGET INTERVIEW QUESTIONS WITH AUDIO PLAYBACK FORMAT */}
              {questionsResult.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#041E17] flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#059669]" /> Practice Questions & Audio Playback Answers
                    </h3>
                    <span className="text-xs font-black text-[#059669] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" /> Text-to-Speech Audio Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionsResult.map((q, idx) => {
                      const audioId = `audio_q_${idx}`;
                      const fullSpeechText = `Question: ${q.question}. Model Answer: ${q.model_answer}`;
                      const isPlaying = playingAudioId === audioId;

                      return (
                        <div key={idx} className="glass-card p-5 rounded-3xl border border-emerald-300 space-y-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300">
                              {q.category} • {q.difficulty}
                            </span>
                            <button
                              onClick={() => playAudio(audioId, fullSpeechText)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                                isPlaying
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-[#059669] text-white hover:bg-[#047857]'
                              }`}
                            >
                              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              <span>{isPlaying ? 'Stop Audio' : 'Play Audio Answer'}</span>
                            </button>
                          </div>

                          <h4 className="text-sm font-black text-[#041E17]">{q.question}</h4>
                          
                          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs font-bold text-gray-900 space-y-1">
                            <span className="text-[#059669] font-black block">Model Answer Outline:</span>
                            <p className="leading-relaxed">{q.model_answer}</p>
                          </div>

                          {q.provenance && (
                            <span className="text-[10px] font-extrabold text-emerald-800 block italic">
                              Source Citation: {q.provenance}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 7: INTERACTIVE AI CONCEPT EXPLAINER & TEXT Q&A (MODULE D) */}
              <div className="glass-panel p-6 rounded-3xl border border-emerald-300 space-y-4 bg-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#10B981]/20 text-[#041E17] font-black text-[11px] border border-[#10B981]/40 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-[#059669]" /> Module D — Text & Spoken Concept Intelligence
                    </div>
                    <h3 className="text-lg font-black text-[#041E17]">Interactive Concept Explainer & Interview Q&A</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500">Powered by Gemini AI & Community RAG</span>
                </div>

                <p className="text-xs font-bold text-[#1A3328]">
                  Test your understanding of any technical concept, algorithm, or system design pattern for <strong>{companyName}</strong>:
                </p>

                {/* QUICK TOPIC CHIPS */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "LRU Cache Design",
                    "Database Normalization (3NF)",
                    "OS Deadlocks & Prevention",
                    "Two Pointers vs Sliding Window",
                    "CAP Theorem & Trade-offs",
                    "B-Trees vs Hash Indexing"
                  ].map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setConceptQuery(topic);
                        handleExplainConcept(topic);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] font-black text-xs border border-emerald-300 transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-[#059669]" /> {topic}
                    </button>
                  ))}
                </div>

                {/* SEARCH INPUT */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder={`e.g. How does Redis caching work, or explain Deadlocks for ${companyName}...`}
                    value={conceptQuery}
                    onChange={(e) => setConceptQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExplainConcept();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl border border-emerald-300 bg-white text-xs font-black text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                  <button
                    type="button"
                    onClick={() => handleExplainConcept()}
                    disabled={explainingConcept || !conceptQuery.trim()}
                    className="px-5 py-3 rounded-2xl bg-[#064E3B] hover:bg-[#041E17] text-[#D9F99D] font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {explainingConcept ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#10B981]" /> Explain Concept
                      </>
                    )}
                  </button>
                </div>

                {conceptError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{conceptError}</span>
                  </div>
                )}

                {/* EXPLANATION RESULT CARD */}
                {conceptResult && (
                  <div className="mt-4 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-300 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-black text-[#059669] tracking-wider">Concept Overview</span>
                        <h4 className="text-base font-black text-[#041E17]">{conceptResult.concept}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => playAudio('concept_audio', `Concept: ${conceptResult.concept}. Explanation: ${conceptResult.simple_explanation}. Model Answer: ${conceptResult.model_interview_answer}`)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                          playingAudioId === 'concept_audio'
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-[#059669] text-white hover:bg-[#047857]'
                        }`}
                      >
                        {playingAudioId === 'concept_audio' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{playingAudioId === 'concept_audio' ? 'Stop Audio' : 'Play Explanation'}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#041E17]">Simple Explanation:</span>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed bg-white p-3 rounded-xl border border-emerald-200">
                        {conceptResult.simple_explanation}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#041E17]">Technical Deep Dive:</span>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed bg-white p-3 rounded-xl border border-emerald-200">
                        {conceptResult.technical_deep_dive}
                      </p>
                    </div>

                    {conceptResult.interview_tradeoffs?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-[#041E17]">Interview Trade-offs:</span>
                        <div className="flex flex-wrap gap-2">
                          {conceptResult.interview_tradeoffs.map((t, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-xl bg-white border border-emerald-300 font-bold text-xs text-emerald-950">
                              ⚖️ {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {conceptResult.code_or_design_example && (
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-[#041E17]">Code / Design Implementation Pattern:</span>
                        <pre className="bg-[#041E17] text-[#D9F99D] p-4 rounded-xl text-xs font-mono overflow-x-auto">
                          {conceptResult.code_or_design_example}
                        </pre>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#041E17]">Model Verbal Answer for Interviewers:</span>
                      <p className="text-xs font-bold text-gray-900 bg-[#D9F99D]/40 p-3.5 rounded-xl border border-emerald-400 leading-relaxed">
                        "{conceptResult.model_interview_answer}"
                      </p>
                    </div>

                    {conceptResult.sources?.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200 text-[11px] font-bold text-emerald-900">
                        <span>Grounded in Community Reports: </span>
                        {conceptResult.sources.map((s, idx) => (
                          <span key={idx} className="mr-2 italic">{s.provenance}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
};
