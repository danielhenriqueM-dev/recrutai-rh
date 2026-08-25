import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  UploadCloud,
  Briefcase,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const {
    activeTab,
    setActiveTab,
    candidates,
    jobs,
    setSelectedCandidateId,
    setSelectedJobId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredCandidates = searchQuery.trim()
    ? candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.skills.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          c.city.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredJobs = searchQuery.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.department.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Visão geral e indicadores de recursos humanos',
    },
    candidates: {
      title: 'Candidatos',
      subtitle: 'Gerenciamento de banco de perfis e histórico profissional',
    },
    candidate_detail: {
      title: 'Detalhes do Candidato',
      subtitle: 'Perfil completo, histórico e avaliações registradas',
    },
    jobs: {
      title: 'Vagas',
      subtitle: 'Gerenciamento de posições abertas e requisitos',
    },
    job_detail: {
      title: 'Detalhes da Vaga',
      subtitle: 'Critérios de avaliação e candidatos inscritos',
    },
    job_create: {
      title: 'Nova Vaga',
      subtitle: 'Cadastro de nova oportunidade e perfil desejado',
    },
    job_ranking: {
      title: 'Relatórios & Ranking',
      subtitle: 'Relatórios de aderência de candidatos por vaga',
    },
    pipeline: {
      title: 'Processos Seletivos',
      subtitle: 'Acompanhamento do fluxo e etapas de seleção',
    },
    interviews: {
      title: 'Entrevistas',
      subtitle: 'Agenda de entrevistas e registro de avaliações',
    },
    talent_pool: {
      title: 'Banco de Talentos',
      subtitle: 'Busca avançada e filtros por competências',
    },
    import_resume: {
      title: 'Importar Currículos',
      subtitle: 'Importação e extração de dados cadastrais',
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Parâmetros do sistema e preferências gerais',
    },
  };

  const headerInfo = titles[activeTab] || {
    title: 'RecruitAI RH',
    subtitle: 'Gestão de Recursos Humanos',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md lg:hidden transition-colors"
          title="Alternar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight truncate">
            {headerInfo.title}
          </h1>
          <p className="hidden md:block text-xs text-gray-500 truncate">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Quick Search & Actions & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Pesquisar candidatos, vagas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-md border border-gray-200 py-2 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Resultados da busca
              </div>

              {filteredCandidates.length === 0 && filteredJobs.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">
                  Nenhum registro encontrado para "{searchQuery}"
                </div>
              ) : (
                <>
                  {filteredCandidates.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50">
                        Candidatos ({filteredCandidates.length})
                      </div>
                      {filteredCandidates.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCandidateId(c.id);
                            setActiveTab('candidate_detail');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-gray-900 block">{c.name}</span>
                            <span className="text-[11px] text-gray-500">{c.city || 'Local não informado'} • {c.totalExperienceYears} anos exp</span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                            {c.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredJobs.length > 0 && (
                    <div className="mt-1 border-t border-gray-100 pt-1">
                      <div className="px-3 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50">
                        Vagas ({filteredJobs.length})
                      </div>
                      {filteredJobs.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            setSelectedJobId(j.id);
                            setActiveTab('job_detail');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-gray-900 block">{j.title}</span>
                            <span className="text-[11px] text-gray-500">{j.department} • {j.location}</span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                            {j.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="px-3 pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('import_resume')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-medium rounded-md transition-colors shadow-xs"
            title="Importar novos currículos"
          >
            <UploadCloud className="w-3.5 h-3.5 text-gray-600" />
            <span className="hidden sm:inline">Importar currículos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job_create')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova vaga</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">Equipe RH</p>
            <p className="text-[10px] text-gray-500 font-medium">Administrador</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center font-bold text-xs text-red-700 shrink-0">
            RH
          </div>
        </div>
      </div>
    </header>
  );
};
