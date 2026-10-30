import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyzerAPI } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { ScoreRing } from '../components/ui/ScoreRing';
import {
  FileText,
  UploadCloud,
  X,
  Sparkles,
  Building2,
  Briefcase,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Download,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
  History,
  Trash2,
  ArrowRight,
  Search,
  ListCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const ResumeAnalyzerPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [companyName, setCompanyName] = useState('Google');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [jobDescription, setJobDescription] = useState(
    `We are looking for a Software Engineer to join our core engineering team. 
Key Requirements:
- Proficiency in Python or JavaScript / React.js
- Solid understanding of Data Structures, Algorithms, and System Design
- Experience building RESTful APIs and microservices architecture
- Knowledge of relational databases (SQL) or NoSQL databases (MongoDB)
- Familiarity with Git, Docker containerization, and CI/CD pipelines`
  );

  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // History Drawer State
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [skillFilter, setSkillFilter] = useState('');

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const loadingMessages = [
    "Uploading resume & validating document signature...",
    "Extracting text content & detecting section structures...",
    "Running deterministic token skill-matching engine...",
    "Calculating transparent alignment weights & breakdown...",
    "Querying Gemini AI for grounded bullet enhancements..."
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await analyzerAPI.getHistory();
      if (res.success) {
        setHistoryList(res.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setError('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      setError('Unsupported file type. Please upload a PDF or DOCX file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please upload your resume file (PDF or DOCX) to analyze.');
      return;
    }

    if (!jobDescription || jobDescription.trim().length < 30) {
      setError('Please enter a detailed Job Description (at least 30 characters).');
      return;
    }

    setAnalyzing(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1100);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);
    formData.append('company_name', companyName);
    formData.append('job_role', jobRole);

    try {
      const res = await analyzerAPI.analyzeResume(formData);
      clearInterval(stepInterval);

      if (res.success) {
        setResult(res);
        fetchHistory(); // refresh history list
      } else {
        setError(res.error || 'Failed to analyze resume. Please try again.');
      }
    } catch (err) {
      clearInterval(stepInterval);
      const msg = err.response?.data?.error || err.response?.data?.errors?.resume?.[0] || 'An error occurred during analysis.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadHistoryDetail = async (analysisId) => {
    try {
      const res = await analyzerAPI.getAnalysisDetail(analysisId);
      if (res.success && res.data?.result) {
        setResult(res.data.result);
        setHistoryDrawerOpen(false);
      }
    } catch (err) {
      console.error("Failed to load analysis detail:", err);
    }
  };

  const handleDeleteHistory = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this evaluation history record?")) return;
    try {
      const res = await analyzerAPI.deleteAnalysis(analysisId);
      if (res.success) {
        setHistoryList(prev => prev.filter(item => item.analysis_id !== analysisId && item._id !== analysisId));
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const handleCopySuggestion = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    try {
      const canvas = await html2canvas(resultsRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PrepNexus_Resume_Analysis_${companyName}_${jobRole}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      window.print();
    }
  };

  const filteredMatchedSkills = (result?.matched_skills || []).filter(s =>
    (s.name || '').toLowerCase().includes(skillFilter.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(skillFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#0A1C15] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto overflow-y-auto">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/20 text-[#041E17] font-extrabold text-xs border border-[#10B981]/40 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" /> AI Placement Workspace
              </div>
              <h1 className="text-3xl font-black text-[#041E17]">AI Resume Analyzer</h1>
              <p className="text-xs font-semibold text-[#1A3328]">
                Match your resume against specific target job descriptions using Google Gemini AI.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setHistoryDrawerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-[#041E17] font-bold text-xs hover:border-[#10B981] flex items-center gap-2 shadow-sm"
              >
                <History className="w-4 h-4 text-[#059669]" /> Evaluation Logs ({historyList.length})
              </button>

              {result && (
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#064E3B] text-[#D9F99D] font-black text-xs hover:bg-[#041E17] flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-[#10B981]" /> Analyze Another Resume
                </button>
              )}
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-black flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* WORKSPACE AREA */}
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* LEFT WORKSPACE: FILE UPLOAD CARD */}
                <div className="lg:col-span-5 space-y-6">
                  
                  <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/40 space-y-4 shadow-md">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#059669]" /> Upload Resume File
                    </h3>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        dragActive
                          ? 'border-[#10B981] bg-[#10B981]/20 scale-[1.01]'
                          : file
                          ? 'border-[#10B981] bg-white'
                          : 'border-emerald-300 bg-white hover:bg-emerald-50 hover:border-[#10B981]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {file ? (
                        <div className="space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center mx-auto shadow-md">
                            <FileText className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#041E17] truncate max-w-xs mx-auto">{file.name}</p>
                            <p className="text-xs font-bold text-[#1A3328]">{(file.size / (1024 * 1024)).toFixed(2)} MB • Signature Verified</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-800 font-bold text-xs hover:bg-red-200"
                          >
                            <X className="w-3.5 h-3.5" /> Remove File
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#059669] flex items-center justify-center mx-auto border border-[#10B981]/40">
                            <UploadCloud className="w-7 h-7 animate-bounce text-[#059669]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#041E17]">Drag & Drop your resume here</p>
                            <p className="text-xs font-bold text-[#1A3328] mt-1">Supported formats: PDF or DOCX (Max 5MB)</p>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl bg-[#064E3B] text-[#D9F99D] font-black text-xs shadow-sm hover:bg-[#041E17]"
                          >
                            Browse Files
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-emerald-100/90 border border-emerald-300 p-3.5 rounded-2xl text-xs font-semibold text-[#041E17] flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[11px]">
                        <strong>Privacy Guarantee:</strong> Your resume is processed securely in-memory for matching against the JD and is not publicly indexed or shared.
                      </p>
                    </div>

                  </div>

                </div>

                {/* RIGHT WORKSPACE: JOB DESCRIPTION & TARGET DETAILS */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/40 space-y-5 shadow-md">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#059669]" /> Target Job Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                          Company Name *
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Google, Amazon, TCS"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-[#10B981] text-xs font-black text-[#0A1C15]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-1">
                          Target Job Role *
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Software Engineer, Backend Dev"
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-[#10B981] text-xs font-black text-[#0A1C15]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider">
                          Job Description Text *
                        </label>
                        <span className="text-[11px] text-[#1A3328] font-bold">
                          {jobDescription.length} characters
                        </span>
                      </div>
                      <textarea
                        rows={7}
                        placeholder="Paste the target job description requirements, responsibilities, and skill requirements here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full p-4 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-[#10B981] text-xs font-bold text-[#0A1C15] leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-sm shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2"
                      >
                        {analyzing ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{loadingMessages[loadingStep]}</span>
                          </div>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 text-[#D9F99D]" /> Run AI Resume Match Analysis
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              </motion.div>
            ) : (
              /* RESULTS DASHBOARD */
              <motion.div
                key="results-dashboard"
                ref={resultsRef}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* TOP SUMMARY SCORE BANNER */}
                <div className="glass-banner-dark p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                  
                  <div className="space-y-3 flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/30 border border-[#10B981]/50 text-[#D9F99D] font-black text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> Target: {result.company_name} — {result.job_role}
                    </div>
                    <h2 className="text-3xl font-black text-white">
                      Resume Alignment Evaluation Report
                    </h2>
                    <p className="text-xs text-[#E6F9F0] font-medium leading-relaxed max-w-2xl">
                      {result.summary?.key_strengths?.join(" ") || result.summary}
                    </p>

                    {/* Disclaimer Box */}
                    <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-[11px] text-[#A7F3D0] font-semibold">
                      <strong>Note:</strong> {result.score?.disclaimer || "This is an estimated alignment score, not a hiring decision prediction."}
                    </div>

                    <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4">
                      <button
                        onClick={handleDownloadPDF}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#D9F99D] text-[#041E17] font-black text-xs shadow-glow-emerald hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download PDF Analysis Report
                      </button>

                      <Link
                        to="/roadmap"
                        state={{ company_name: result.company_name, job_role: result.job_role }}
                        className="px-5 py-2.5 rounded-xl bg-white/20 border border-white/40 text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-2"
                      >
                        Launch Personalized Preparation →
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-[#10B981]/40 shrink-0 text-center">
                    <ScoreRing score={result.match_score || result.score?.overall} size={160} strokeWidth={14} label="Match Score" />
                  </div>

                </div>

                {/* SCORE BREAKDOWN CATEGORIES */}
                {result.score_breakdown && (
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#059669]" /> Alignment Score Component Breakdown
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.score_breakdown.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                          <div className="flex justify-between items-center text-xs font-black text-[#041E17]">
                            <span>{item.category}</span>
                            <span className="text-[#059669] font-black">{item.score}%</span>
                          </div>
                          <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#10B981] h-full" style={{ width: `${item.score}%` }} />
                          </div>
                          <p className="text-[11px] font-semibold text-[#1A3328]">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SKILLS MATCHED VS MISSING GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Matched Skills */}
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#059669]" /> Verified Matched Skills ({result.matched_skills?.length || 0})
                      </h3>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Filter skills..."
                          value={skillFilter}
                          onChange={(e) => setSkillFilter(e.target.value)}
                          className="pl-7 pr-3 py-1 rounded-lg border border-emerald-300 bg-white text-[11px] font-bold text-[#0A1C15]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {filteredMatchedSkills.map((skill, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-black text-[#041E17] block">{skill.name || skill}</span>
                            {skill.evidence && <span className="text-[10px] text-[#1A3328] font-semibold">Evidence: "{skill.evidence}" ({skill.resume_section || 'Resume'})</span>}
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                            {skill.importance || 'Demonstrated'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="glass-card p-6 rounded-3xl border border-amber-300 space-y-4">
                    <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" /> Skills to Improve ({result.missing_skills?.length || 0})
                    </h3>
                    <p className="text-xs font-semibold text-[#1A3328]">Skills specified in target JD not clearly demonstrated in extracted resume:</p>
                    <div className="space-y-2">
                      {result.missing_skills?.map((skill, idx) => (
                        <div key={idx} className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                          <div className="flex justify-between items-center font-extrabold text-amber-950">
                            <span>{skill.name || skill}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] uppercase font-bold">
                              {skill.importance || 'Required'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 font-medium">{skill.reason || "Not clearly demonstrated in extracted resume."}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RESUME BULLET POINT ENHANCER */}
                {result.bullet_suggestions && result.bullet_suggestions.length > 0 && (
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#059669]" /> Interactive Resume Bullet Point Enhancer
                      </h3>
                      <span className="text-[11px] font-extrabold text-[#059669] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        Grounded AI Rewrites
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#1A3328]">
                      Suggested rewrites based on your original resume bullets. No fake metrics or invented experiences are added.
                    </p>

                    <div className="space-y-4">
                      {result.bullet_suggestions.map((bullet, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-[#041E17] uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                              Original Bullet Text
                            </span>
                            <p className="text-xs text-gray-700 italic font-medium">"{bullet.original}"</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                              Grounded Suggested Enhancement
                            </span>
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#041E17] flex justify-between items-start gap-3">
                              <p className="leading-relaxed">{bullet.suggested}</p>
                              <button
                                onClick={() => handleCopySuggestion(bullet.suggested, idx)}
                                className="px-3 py-1.5 rounded-lg bg-[#064E3B] text-[#D9F99D] font-bold text-[11px] hover:bg-[#041E17] flex items-center gap-1.5 shrink-0"
                              >
                                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#D9F99D]" />}
                                {copiedIdx === idx ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          {bullet.missing_information && (
                            <div className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Verified information to provide: {bullet.missing_information.join(", ")}</span>
                            </div>
                          )}

                          <p className="text-[11px] text-surface-textMuted font-semibold">
                            <strong>Why this is better:</strong> {bullet.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STRENGTHS AND IMPROVEMENT AREAS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strengths */}
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#059669]" /> Key Resume Strengths
                    </h3>
                    <ul className="space-y-2.5">
                      {result.strengths?.map((str, idx) => (
                        <li key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs font-bold text-[#0A1C15] space-y-1">
                          <div className="flex items-center gap-2 font-black text-[#041E17]">
                            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                            <span>{str.title || str}</span>
                          </div>
                          {str.description && <p className="text-[11px] text-[#1A3328] font-medium pl-6">{str.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvement Areas */}
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-[#059669]" /> Actionable Improvements
                    </h3>
                    <ul className="space-y-2.5">
                      {result.improvement_areas?.map((item, idx) => (
                        <li key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs font-bold text-[#0A1C15] space-y-1">
                          <div className="flex items-center justify-between font-black text-[#041E17]">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{item.title || item}</span>
                            </div>
                            {item.priority && (
                              <span className="text-[9px] uppercase font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                {item.priority}
                              </span>
                            )}
                          </div>
                          {item.recommendation && <p className="text-[11px] text-[#1A3328] font-medium pl-6">{item.recommendation}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* PERSONALIZED ACTION PLAN */}
                {result.action_plan && (
                  <div className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-4">
                    <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                      <ListCheck className="w-5 h-5 text-[#059669]" /> Personalized Action Plan Roadmap
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Today */}
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                        <span className="text-xs font-black text-[#041E17] uppercase tracking-wider bg-emerald-100 px-2.5 py-1 rounded-md inline-block">
                          Today
                        </span>
                        <ul className="space-y-1.5 text-xs font-bold text-[#0A1C15]">
                          {result.action_plan.today?.map((task, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* This Week */}
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                        <span className="text-xs font-black text-[#041E17] uppercase tracking-wider bg-teal-100 px-2.5 py-1 rounded-md inline-block">
                          This Week
                        </span>
                        <ul className="space-y-1.5 text-xs font-bold text-[#0A1C15]">
                          {result.action_plan.this_week?.map((task, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Before Applying */}
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                        <span className="text-xs font-black text-[#041E17] uppercase tracking-wider bg-lime-100 px-2.5 py-1 rounded-md inline-block">
                          Before Applying
                        </span>
                        <ul className="space-y-1.5 text-xs font-bold text-[#0A1C15]">
                          {result.action_plan.before_applying?.map((task, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#064E3B] mt-1.5 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* HISTORY DRAWER MODAL */}
      <AnimatePresence>
        {historyDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex justify-end"
            onClick={() => setHistoryDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white min-h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#059669]" />
                    <h3 className="text-lg font-black text-[#041E17]">Evaluation Logs History</h3>
                  </div>
                  <button onClick={() => setHistoryDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="text-xs font-bold text-gray-500 py-8 text-center">Loading evaluation history...</div>
                ) : historyList.length > 0 ? (
                  <div className="space-y-3">
                    {historyList.map((item) => (
                      <div
                        key={item.analysis_id || item._id}
                        onClick={() => handleLoadHistoryDetail(item.analysis_id || item._id)}
                        className="p-4 rounded-2xl border border-emerald-200 bg-[#F7F9F2] hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black text-[#041E17]">{item.company_name} — {item.job_role}</p>
                          <p className="text-[10px] text-gray-500">{item.filename} • {new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#041E17] bg-[#D9F99D] px-2.5 py-1 rounded-lg text-xs border border-emerald-300">
                            {item.result?.match_score}%
                          </span>
                          <button
                            onClick={(e) => handleDeleteHistory(item.analysis_id || item._id, e)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs font-bold text-gray-500">
                    No past evaluations found.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
