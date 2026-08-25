import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  UploadCloud,
  MapPin,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CandidateStatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const CandidatesView: React.FC = () => {
  const {
    candidates,
    jobs,
    applications,
    setActiveTab,
    setSelectedCandidateId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [minExpFilter, setMinExpFilter] = useState<number>(0);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'experience'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesEmail = c.email.toLowerCase().includes(query);
        const matchesSkills = c.skills.some((s) => s.name.toLowerCase().includes(query));
        const matchesCity = c.city.toLowerCase().includes(query);
        const matchesRaw = c.rawText?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesSkills && !matchesCity && !matchesRaw) {
          return false;
        }
      }

      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      if (cityFilter !== 'all' && c.city !== cityFilter) {
        return false;
      }

      if (c.totalExperienceYears < minExpFilter) {
        return false;
      }

      if (skillFilter.trim()) {
        const querySkill = skillFilter.toLowerCase();
        const hasSkill = c.skills.some((s) => s.name.toLowerCase().includes(querySkill));
        if (!hasSkill) return false;
      }

      if (selectedJobFilter !== 'all') {
        const hasApplication = applications.some(
          (a) => a.candidateId === c.id && a.jobId === selectedJobFilter
        );
        if (!hasApplication) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'experience') return b.totalExperienceYears - a.totalExperienceYears;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [candidates, search, statusFilter, cityFilter, minExpFilter, skillFilter, selectedJobFilter, sortBy, applications]);

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCityFilter('all');
    setMinExpFilter(0);
    setSelectedJobFilter('all');
    setSkillFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    cityFilter !== 'all' ||
    minExpFilter > 0 ||
    selectedJobFilter !== 'all' ||
    skillFilter !== '';

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Banco de Candidatos ({filteredCandidates.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Perfis cadastrados, histórico profissional e status nos processos seletivos
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('import_resume')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            Importar currículos
          </button>
        </div>
      </div>

      {/* Control Bar: Search + Filter Toggle + View Mode + Sorting */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, habilidades, e-mail ou cidade..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden transition-all text-gray-900"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 ml-0.5" />
              )}
            </button>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 outline-hidden font-medium"
            >
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome (A-Z)</option>
              <option value="experience">Maior Experiência</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-gray-100 rounded-md border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-red-600 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-red-600 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Status no Processo
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800 outline-hidden"
              >
                <option value="all">Todos os Status</option>
                <option value="novo">Novo</option>
                <option value="triagem">Em Triagem</option>
                <option value="pre_selecionado">Pré-selecionado</option>
                <option value="entrevista">Entrevista</option>
                <option value="teste">Teste</option>
                <option value="aprovado">Aprovado</option>
                <option value="contratado">Contratado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Cidade / UF
              </label>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800 outline-hidden"
              >
                <option value="all">Todas as Cidades</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Experiência Mínima ({minExpFilter} anos)
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={minExpFilter}
                onChange={(e) => {
                  setMinExpFilter(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Vaga Relacionada
              </label>
              <select
                value={selectedJobFilter}
                onChange={(e) => {
                  setSelectedJobFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800 outline-hidden"
              >
                <option value="all">Todas as Vagas</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Results */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title="Nenhum candidato encontrado"
          description={
            hasActiveFilters
              ? 'Nenhum resultado corresponde aos filtros aplicados. Tente redefinir os critérios.'
              : 'Nenhum candidato cadastrado no sistema ainda. Importe arquivos de currículo para iniciar.'
          }
          actionLabel="Importar currículos"
          onAction={() => setActiveTab('import_resume')}
          secondaryActionLabel={hasActiveFilters ? 'Limpar Filtros' : undefined}
          onSecondaryAction={hasActiveFilters ? resetFilters : undefined}
        />
      ) : viewMode === 'table' ? (
        /* Table View (Corporate Priority) */
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Candidato</th>
                  <th className="px-4 py-3.5">Localização</th>
                  <th className="px-4 py-3.5">Experiência</th>
                  <th className="px-4 py-3.5">Formação</th>
                  <th className="px-4 py-3.5">Competências Principais</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCandidateId(cand.id);
                      setActiveTab('candidate_detail');
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                        {cand.name}
                      </div>
                      <div className="text-[11px] text-gray-500">{cand.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {cand.city ? `${cand.city} - ${cand.state}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      {cand.totalExperienceYears} anos
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-gray-700">
                      {cand.education[0]?.course || 'Não informada'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk.id}
                            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] border border-gray-200"
                          >
                            {sk.name}
                          </span>
                        ))}
                        {cand.skills.length > 3 && (
                          <span className="text-[11px] text-gray-400 self-center">
                            +{cand.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <CandidateStatusBadge status={cand.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidateId(cand.id);
                          setActiveTab('candidate_detail');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded text-xs transition-colors shadow-2xs inline-flex items-center gap-1"
                      >
                        Ver perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedCandidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setActiveTab('candidate_detail');
                      }}
                      className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer line-clamp-1 transition-colors"
                    >
                      {cand.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {cand.city ? `${cand.city} - ${cand.state}` : 'Local não informado'}
                    </p>
                  </div>
                  <CandidateStatusBadge status={cand.status} />
                </div>

                {/* Formação / Experiência */}
                <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      <strong>{cand.totalExperienceYears} anos</strong> de experiência
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {cand.education[0]?.course || 'Superior'}
                    </span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">
                    Habilidades
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cand.skills.slice(0, 4).map((sk) => (
                      <span
                        key={sk.id}
                        className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-medium"
                      >
                        {sk.name}
                      </span>
                    ))}
                    {cand.skills.length > 4 && (
                      <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                        +{cand.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium">
                  {new Date(cand.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidateId(cand.id);
                    setActiveTab('candidate_detail');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Ver Perfil <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500">
            Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * pageSize, filteredCandidates.length)}</strong> de{' '}
            <strong>{filteredCandidates.length}</strong> candidatos
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-700 px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
