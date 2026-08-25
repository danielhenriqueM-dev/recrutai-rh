import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Database,
  Kanban,
  Calendar,
  FileBarChart,
  Settings,
  Building2,
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  matchTabs?: ActiveTab[];
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { activeTab, setActiveTab, candidates, jobs, applications, interviews } = useApp();

  const openJobsCount = jobs.filter((j) => j.status === 'aberta').length;
  const pendingInterviewsCount = interviews.filter((i) => i.status === 'agendada').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'candidates',
      label: 'Candidatos',
      icon: <Users className="w-4 h-4" />,
      badge: candidates.length,
      matchTabs: ['candidates', 'candidate_detail', 'import_resume'],
    },
    {
      id: 'jobs',
      label: 'Vagas',
      icon: <Briefcase className="w-4 h-4" />,
      badge: openJobsCount,
      matchTabs: ['jobs', 'job_detail', 'job_create'],
    },
    {
      id: 'talent_pool',
      label: 'Banco de Talentos',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'pipeline',
      label: 'Processos Seletivos',
      icon: <Kanban className="w-4 h-4" />,
      badge: applications.length,
    },
    {
      id: 'interviews',
      label: 'Entrevistas',
      icon: <Calendar className="w-4 h-4" />,
      badge: pendingInterviewsCount > 0 ? pendingInterviewsCount : undefined,
    },
    {
      id: 'job_ranking',
      label: 'Relatórios',
      icon: <FileBarChart className="w-4 h-4" />,
      matchTabs: ['job_ranking'],
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-gray-700 flex flex-col border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-200 bg-white">
          <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center text-white font-bold tracking-wider text-xs shadow-xs">
            RH
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900 tracking-tight leading-tight">
              RecruitAI RH
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide">
              Gestão de Talentos
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] text-gray-400 uppercase tracking-wider font-bold">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.matchTabs && item.matchTabs.includes(activeTab));

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-medium text-sm transition-colors text-left relative ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-semibold border-l-4 border-red-600 pl-2'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-red-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 ml-2 ${
                      isActive
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Corporate Status Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/70 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-gray-700">Sistema Conectado</span>
          </div>
          <span className="font-mono text-[11px] text-gray-400">v2.4.0</span>
        </div>
      </aside>
    </>
  );
};
