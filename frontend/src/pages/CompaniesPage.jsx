import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import { Building2, Sparkles, CheckCircle2, ArrowRight, Map } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CompaniesPage = () => {
  const navigate = useNavigate();
  
  const companies = [
    {
      name: "Google",
      role: "Software Development Engineer",
      rounds: ["Online Assessment", "Technical DSA 1", "Technical DSA 2", "Googliness & Leadership"],
      focus: "Advanced Data Structures, Graph Algorithms, Dynamic Programming & Clean Code."
    },
    {
      name: "Amazon",
      role: "SDE-1 / SDE Intern",
      rounds: ["OA Debugging + Coding", "Tech Interview 1", "Tech Interview 2 + Leadership Principles"],
      focus: "Trees, HashMaps, System Design Basics & 14 Leadership Principles."
    },
    {
      name: "TCS Digital",
      role: "System Engineer / Digital Cadre",
      rounds: ["TCS NQT National Test", "Technical + HR Combined Round"],
      focus: "Core CS Fundamentals (OS, DBMS, SQL, OOPs) & Python/Java problem solving."
    },
    {
      name: "Infosys",
      role: "Specialist Programmer (SP) / DSE",
      rounds: ["InfyTQ / HackWithInfy", "Technical & Coding Interview"],
      focus: "Algorithm optimization, Competitive Programming, and Web stack basics."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#14251D] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#064E3B] font-bold text-xs border border-[#10B981]/30 mb-2">
              <Building2 className="w-3.5 h-3.5 text-[#10B981]" /> Recruitment Guides
            </div>
            <h1 className="text-3xl font-black text-[#064E3B]">Target Company Placement Intelligence</h1>
            <p className="text-xs text-surface-textMuted">Explore company-specific selection round structures and launch tailored RAG preparation roadmaps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((comp, idx) => (
              <div key={idx} className="glass-card p-6 rounded-3xl border border-emerald-200 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D9F99D] flex items-center justify-center font-bold text-lg">
                      {comp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#064E3B]">{comp.name}</h3>
                      <p className="text-xs text-[#059669] font-semibold">{comp.role}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#064E3B] uppercase tracking-wider">Recruitment Rounds:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.rounds.map((r, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 text-[11px] font-semibold">
                        {i + 1}. {r}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-surface-textMuted leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-100">
                  <strong>Preparation Focus:</strong> {comp.focus}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                  <button
                    onClick={() => navigate('/roadmap', { state: { company_name: comp.name, job_role: comp.role } })}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#059669] hover:text-[#064E3B] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
                  >
                    <Map className="w-3.5 h-3.5" /> Generate {comp.name} Roadmap
                  </button>

                  <Link
                    to="/resume-analyzer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                  >
                    Match Resume <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
};
