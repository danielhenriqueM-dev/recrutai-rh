import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';

// Page Views
import { DashboardView } from './pages/DashboardView';
import { CandidatesView } from './pages/CandidatesView';
import { CandidateDetailView } from './pages/CandidateDetailView';
import { JobsView } from './pages/JobsView';
import { JobDetailView } from './pages/JobDetailView';
import { JobCreateEditView } from './pages/JobCreateEditView';
import { JobRankingView } from './pages/JobRankingView';
import { PipelineView } from './pages/PipelineView';
import { InterviewsView } from './pages/InterviewsView';
import { TalentPoolView } from './pages/TalentPoolView';
import { ImportResumeView } from './pages/ImportResumeView';
import { SettingsView } from './pages/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, toasts, removeToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'candidates':
        return <CandidatesView />;
      case 'candidate_detail':
        return <CandidateDetailView />;
      case 'jobs':
        return <JobsView />;
      case 'job_detail':
        return <JobDetailView />;
      case 'job_create':
        return <JobCreateEditView />;
      case 'job_ranking':
        return <JobRankingView />;
      case 'pipeline':
        return <PipelineView />;
      case 'interviews':
        return <InterviewsView />;
      case 'talent_pool':
        return <TalentPoolView />;
      case 'import_resume':
        return <ImportResumeView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900 selection:bg-red-100 selection:text-red-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden lg:pl-64">
        {/* Sticky Header */}
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Dynamic Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>

        {/* Footer Status Bar */}
        <footer className="h-9 bg-white border-t border-gray-200 flex items-center px-4 sm:px-8 justify-between text-[11px] text-gray-500 shrink-0 font-medium">
          <div className="truncate">
            RecruitAI RH — Sistema Integrado de Gestão de Processos Seletivos
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <span className="hidden md:inline">Ambiente Corporativo</span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Operacional
            </span>
          </div>
        </footer>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
