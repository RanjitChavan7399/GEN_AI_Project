import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
