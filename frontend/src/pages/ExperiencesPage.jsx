import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { experiencesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, PlusCircle, CheckCircle2, ThumbsUp, Filter, X, 
  Sparkles, Award, GraduationCap, Building, FileText, Loader2, Send,
  Flag, Trash2, AlertTriangle
} from 'lucide-react';

export const ExperiencesPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Share Experience Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    student_name: user?.name || '',
    college: user?.college || 'B.Tech CS / IT',
    company_name: '',
    job_role: '',
    placement_year: '2025 Placement',
    rounds_conducted: 3,
    status: 'Selected / Offered',
    summary: ''
  });

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const data = await experiencesAPI.getExperiences();
      const list = Array.isArray(data) ? data : (data?.experiences || []);
      setExperiences(list);
    } catch (err) {
      console.error("Failed to load interview experiences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.company_name.trim() || !formData.job_role.trim() || !formData.summary.trim()) {
      setSubmitError('Please fill in all required fields (Company, Job Role, and Summary).');
      return;
    }

    setSubmitting(true);
    try {
      const result = await experiencesAPI.submitExperience(formData);
      if (result && result.experience) {
        setExperiences(prev => [result.experience, ...prev]);
      } else {
        await fetchExperiences();
      }
      setSubmitSuccess('Your experience has been shared successfully! Thank you for helping juniors.');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess('');
        setFormData({
          student_name: user?.name || '',
          college: user?.college || 'B.Tech CS / IT',
          company_name: '',
          job_role: '',
          placement_year: '2025 Placement',
          rounds_conducted: 3,
          status: 'Selected / Offered',
          summary: ''
        });
      }, 1500);
    } catch (err) {
      console.error("Failed to submit experience:", err);
      setSubmitError(err.response?.data?.message || 'Failed to submit experience. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (expId) => {
    try {
      const res = await experiencesAPI.upvoteExperience(expId);
      if (res && res.upvotes !== undefined) {
        setExperiences(prev => prev.map(item => {
          if (item.id === expId || item._id === expId) {
            return { ...item, upvotes: res.upvotes };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const [actionNotice, setActionNotice] = useState('');

  const handleFlag = async (expId) => {
    const reason = window.prompt("Reason for reporting this experience (e.g., spam, false information, offensive content):", "Contains inaccurate interview questions or misleading claims.");
    if (!reason) return;
    try {
      const res = await experiencesAPI.flagExperience(expId, reason);
      if (res && res.success) {
        setActionNotice("Experience flagged for moderation review. Thank you for keeping our community accurate.");
        setExperiences(prev => prev.map(item => {
          if (item.id === expId || item._id === expId) {
            return { ...item, is_flagged: true, flagged_reason: reason };
          }
          return item;
        }));
        setTimeout(() => setActionNotice(''), 4500);
      }
    } catch (err) {
      console.error("Failed to flag experience:", err);
    }
  };

  const handleDelete = async (expId) => {
    if (!window.confirm("Are you sure you want to delete this interview experience? This will also remove it from the RAG knowledge index.")) {
      return;
    }
    try {
      const res = await experiencesAPI.deleteExperience(expId);
      if (res && res.success) {
        setActionNotice("Interview experience deleted and removed from RAG index.");
        setExperiences(prev => prev.filter(item => (item.id !== expId && item._id !== expId)));
        setTimeout(() => setActionNotice(''), 4500);
      }
    } catch (err) {
      console.error("Failed to delete experience:", err);
    }
  };

  // Extract unique companies for dynamic filter buttons
  const uniqueCompanies = ['All', ...Array.from(new Set(experiences.map(e => e.company_name || e.company))).filter(Boolean)];

  const filtered = experiences.filter(exp => {
    const company = exp.company_name || exp.company || '';
    const role = exp.job_role || exp.role || '';
    const summary = exp.summary || '';
    const student = exp.student_name || exp.student || '';

    const matchesSearch = company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComp = selectedCompanyFilter === 'All' || company === selectedCompanyFilter;
    return matchesSearch && matchesComp;
  });

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#0A1C15] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/20 text-[#041E17] font-extrabold text-xs border border-[#10B981]/40 mb-2">
                <Users className="w-3.5 h-3.5 text-[#059669]" /> Senior Insights Hub
              </div>
              <h1 className="text-3xl font-black text-[#041E17]">Student Interview Experience Hub</h1>
              <p className="text-xs font-semibold text-[#1A3328]">Read & share authentic placement interview experiences with fellow candidates.</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#064E3B] hover:bg-[#041E17] text-[#D9F99D] font-black text-xs shadow-lg transition-all border border-[#10B981]/40 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-[#10B981]" /> Share Your Experience
            </button>
          </div>

          {/* COMMUNITY DISCLAIMER NOTICE */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-[#064E3B] leading-relaxed">
              <span className="font-black">Notice:</span> Community-Submitted Reports: Authenticated peer contributions moderated for placement prep; not official company statements.
            </p>
          </div>

          {/* ACTION NOTICE TOAST */}
          {actionNotice && (
            <div className="bg-[#064E3B] text-[#D9F99D] border border-emerald-400 rounded-2xl p-3.5 flex items-center justify-between text-xs font-black shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>{actionNotice}</span>
              </div>
              <button onClick={() => setActionNotice('')} className="text-[#D9F99D] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="glass-panel p-4 rounded-2xl border border-emerald-300 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by company, role or questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-[#10B981] text-xs font-black text-[#0A1C15]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-[#059669] shrink-0" />
              <span className="text-xs font-extrabold text-[#041E17] shrink-0">Company:</span>
              {uniqueCompanies.slice(0, 6).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompanyFilter(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all shrink-0 ${
                    selectedCompanyFilter === c
                      ? 'bg-[#064E3B] text-[#D9F99D]'
                      : 'bg-white text-[#041E17] border border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-emerald-200 gap-3">
              <Loader2 className="w-8 h-8 text-[#059669] animate-spin" />
              <p className="text-xs font-black text-[#041E17]">Loading verified interview experiences...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-emerald-200 space-y-3">
              <Sparkles className="w-8 h-8 text-[#059669] mx-auto" />
              <h3 className="text-sm font-black text-[#041E17]">No experiences found</h3>
              <p className="text-xs font-bold text-[#1A3328]">Be the first student to contribute an interview experience for this company!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#064E3B] text-[#D9F99D] font-black text-xs mt-2"
              >
                <PlusCircle className="w-4 h-4" /> Share Experience Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((exp) => {
                const expId = exp.id || exp._id;
                const company = exp.company_name || exp.company;
                const role = exp.job_role || exp.role;
                const student = exp.student_name || exp.student;
                const year = exp.placement_year || exp.year;
                const rounds = exp.rounds_conducted || exp.rounds;

                return (
                  <div key={expId} className="glass-card p-6 rounded-3xl border border-emerald-300 space-y-3 hover:border-[#10B981] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-[#10B981]/20 text-[#041E17] font-black text-xs border border-[#10B981]/40">
                            {company}
                          </span>
                          <span className="text-xs font-black text-[#059669]">{role}</span>
                          <span className="text-[11px] font-bold text-[#1A3328]">• {year}</span>
                          {exp.is_approved && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#064E3B] border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified
                            </span>
                          )}
                          {exp.is_flagged && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Under Review
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-black text-[#041E17]">
                          Shared by {student} <span className="text-xs font-semibold text-[#1A3328]">({exp.college})</span>
                        </h3>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-[11px] border border-emerald-400 shrink-0">
                        {exp.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#0A1C15] leading-relaxed bg-white p-4 rounded-xl border border-emerald-200 whitespace-pre-line">
                      "{exp.summary}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs font-bold text-[#1A3328] pt-2 border-t border-emerald-100 gap-2">
                      <span>Rounds Conducted: <strong className="text-[#041E17]">{rounds} Rounds</strong></span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpvote(expId)}
                          className="flex items-center gap-1.5 font-black text-[#059669] hover:text-[#041E17] bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-300 transition-all text-xs"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[#059669]" /> {exp.upvotes || 0} Helpful
                        </button>
                        <button
                          onClick={() => handleFlag(expId)}
                          title="Report this experience for moderation"
                          className="flex items-center gap-1 font-bold text-gray-500 hover:text-amber-700 bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-amber-300 transition-all text-xs"
                        >
                          <Flag className="w-3.5 h-3.5" /> Report
                        </button>
                        <button
                          onClick={() => handleDelete(expId)}
                          title="Delete this experience"
                          className="flex items-center gap-1 font-bold text-gray-500 hover:text-red-700 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-red-300 transition-all text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* SHARE EXPERIENCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#F7F9F2] w-full max-w-2xl rounded-3xl border border-emerald-400 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#064E3B] text-white p-5 flex items-center justify-between border-b border-emerald-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40">
                  <GraduationCap className="w-5 h-5 text-[#D9F99D]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Share Your Placement Experience</h2>
                  <p className="text-xs font-semibold text-emerald-200">Help juniors prepare effectively by sharing your interview rounds</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-emerald-200 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {submitError && (
                <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-black">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" /> {submitSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    name="student_name"
                    required
                    value={formData.student_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">College / University *</label>
                  <input
                    type="text"
                    name="college"
                    required
                    value={formData.college}
                    onChange={handleInputChange}
                    placeholder="e.g. IIT Bombay / VJTI / COEP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Target Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Google, TCS, Infosys, Microsoft"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Job Role / Position *</label>
                  <input
                    type="text"
                    name="job_role"
                    required
                    value={formData.job_role}
                    onChange={handleInputChange}
                    placeholder="e.g. Software Engineer / SDE-1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Placement Drive Year</label>
                  <select
                    name="placement_year"
                    value={formData.placement_year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="2026 Placement">2026 Placement</option>
                    <option value="2025 Placement">2025 Placement</option>
                    <option value="2024 Placement">2024 Placement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Rounds Conducted</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="rounds_conducted"
                    value={formData.rounds_conducted}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Final Result / Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="Selected / Offered">Selected / Offered</option>
                    <option value="Cleared Technical Rounds">Cleared Technical Rounds</option>
                    <option value="Interview In-Progress">Interview In-Progress</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#041E17] mb-1">
                  Interview Breakdown & Important Questions *
                </label>
                <textarea
                  name="summary"
                  required
                  rows="4"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Detail the technical questions asked, coding round topics, HR questions, difficulty level, and key advice for juniors..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#0A1C15] focus:outline-none focus:border-[#10B981]"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-[#041E17] font-black text-xs border border-emerald-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#041E17] text-[#D9F99D] font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Experience
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

