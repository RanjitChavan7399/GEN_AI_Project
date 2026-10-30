import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Shield, Terminal, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#041E17] border-t border-[#10B981]/30 text-[#E6F9F0] py-12 px-4 sm:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 relative z-10">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center text-[#041E17] font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">PrepNexus <span className="text-[#10B981]">AI</span></span>
          </div>
          <p className="text-xs text-[#A7F3D0] leading-relaxed font-medium">
            Campus Placement Preparation Platform integrating company-specific intelligence, personalized countdown roadmaps, AI resume evaluation, and senior interview experiences.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-black text-[#D9F99D] mb-3">Placement Modules</h4>
          <ul className="space-y-2 text-xs font-bold">
            <li><Link to="/roadmap" className="hover:text-[#D9F99D] transition-colors">Personalized Preparation</Link></li>
            <li><Link to="/resume-analyzer" className="hover:text-[#D9F99D] transition-colors">AI Resume Analyzer</Link></li>
            <li><Link to="/mock-interview" className="hover:text-[#D9F99D] transition-colors">AI Technical Mock Interview</Link></li>
            <li><Link to="/experiences" className="hover:text-[#D9F99D] transition-colors">Verified Interview Experiences</Link></li>
          </ul>
        </div>

        {/* Target Companies */}
        <div>
          <h4 className="text-sm font-black text-[#D9F99D] mb-3">Company Track Prep</h4>
          <ul className="space-y-2 text-xs font-bold">
            <li><Link to="/companies" className="hover:text-[#D9F99D] transition-colors">Google Placement Preparation</Link></li>
            <li><Link to="/companies" className="hover:text-[#D9F99D] transition-colors">Amazon SDE Track</Link></li>
            <li><Link to="/companies" className="hover:text-[#D9F99D] transition-colors">TCS Digital & Ninja</Link></li>
            <li><Link to="/companies" className="hover:text-[#D9F99D] transition-colors">Infosys Specialist Programmer</Link></li>
          </ul>
        </div>

        {/* Technology Stack & Security */}
        <div>
          <h4 className="text-sm font-black text-[#D9F99D] mb-3">Technology & Trust</h4>
          <div className="space-y-2 text-xs text-[#E6F9F0] font-semibold">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#10B981]" /> Encrypted Student Data
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#D9F99D]" /> Powered by Google Gemini API
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#A7F3D0]" /> React & Django REST Framework
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#A7F3D0]">
        <p>© {new Date().getFullYear()} PrepNexus AI. College Placement Preparation Platform.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3 h-3 text-[#10B981] fill-[#10B981]" /> for college placement candidates.
        </p>
      </div>
    </footer>
  );
};
