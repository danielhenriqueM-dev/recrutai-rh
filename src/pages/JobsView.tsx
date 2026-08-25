import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Award,
  List,
  LayoutGrid,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { JobStatus } from '../types';

export const JobsView: React.FC = () => {
  const {
    jobs,
    applications,
    setActiveTab,
    setSelectedJobId,
    setSelectedJobForRanking,
    setEditingJobId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [workplaceFilter, setWorkplaceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = j.title.toLowerCase().includes(q);
        const matchesDept = j.department.toLowerCase().includes(q);
        const matchesSkills = j.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDept && !matchesSkills) return false;
      }
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (deptFilter !== 'all' && j.department !== deptFilter) return false;
      if (workplaceFilter !== 'all' && j.workplaceType !== workplaceFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, search, statusFilter, deptFilter, workplaceFilter]);

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'aberta':
        return <Badge variant="success" dot>Aberta</Badge>;
      case 'pausada':
        return <Badge variant="warning" dot>Pausada</Badge>;
      case 'encerrada':
        return <Badge variant="danger" dot>Encerrada</Badge>;
      default:
        return <Badge variant="default" dot>Rascunho</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Gestão de Vagas ({filteredJobs.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gerenciamento de posições abertas, critérios de seleção e triagem de candidatos
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingJobId(null);
            setActiveTab('job_create');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar nova vaga
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título do cargo, departamento ou competências..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden transition-all text-gray-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 outline-hidden font-medium"
          >
            <option value="all">Todos os Status</option>
            <option value="aberta">Aberta</option>
            <option value="pausada">Pausada</option>
            <option value="encerrada">Encerrada</option>
            <option value="rascunho">Rascunho</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 outline-hidden font-medium"
          >
            <option value="all">Todos os Departamentos</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={workplaceFilter}
            onChange={(e) => setWorkplaceFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 outline-hidden font-medium"
          >
            <option value="all">Todos os Modelos</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>

          {/* Switcher */}
          <div className="flex items-center p-0.5 bg-gray-100 rounded-md border border-gray-200">
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
          </div>
        </div>
      </div>

      {/* Jobs Content */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga encontrada"
          description="Nenhuma oportunidade corresponde aos filtros selecionados. Crie uma nova vaga para começar a receber e classificar candidatos."
          actionLabel="Cadastrar nova vaga"
          onAction={() => setActiveTab('job_create')}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Título da Vaga</th>
                  <th className="px-4 py-3.5">Departamento</th>
                  <th className="px-4 py-3.5">Local / Modelo</th>
                  <th className="px-4 py-3.5">Candidatos</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map((job) => {
                  const jobApps = applications.filter((a) => a.jobId === job.id);
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setActiveTab('job_detail');
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                          {job.title}
                        </div>
                        {job.salaryRange && (
                          <div className="text-[11px] text-gray-500">{job.salaryRange}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800">{job.department}</td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {job.location} ({job.workplaceType})
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900">{jobApps.length}</span> inscritos
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobForRanking(job.id);
                              setActiveTab('job_ranking');
                            }}
                            className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded text-xs transition-colors border border-red-200"
                          >
                            Triagem
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab('job_detail');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded text-xs transition-colors border border-gray-300 shadow-2xs"
                          >
                            Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const inInterviewCount = jobApps.filter((a) => a.stage === 'entrevista').length;
            const hiredCount = jobApps.filter((a) => a.stage === 'contratado').length;

            return (
              <div
                key={job.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Status & Workplace */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                      {job.workplaceType}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Title & Department */}
                  <h3
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setActiveTab('job_detail');
                    }}
                    className="text-base font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors leading-tight"
                  >
                    {job.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    {job.department} • <MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.location}
                  </p>

                  {job.salaryRange && (
                    <div className="text-xs font-semibold text-gray-700 mt-2 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 inline-block">
                      {job.salaryRange}
                    </div>
                  )}

                  {/* Description Snip */}
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Required Skills Badges */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2">
                      Requisitos Principais
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.slice(0, 4).map((sk) => (
                        <span
                          key={sk}
                          className="text-[11px] font-medium bg-gray-50 text-gray-800 px-2 py-0.5 rounded border border-gray-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-gray-50 rounded-md border border-gray-200 text-center">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Inscritos</span>
                      <span className="text-xs font-bold text-gray-900">{jobApps.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Entrevistas</span>
                      <span className="text-xs font-bold text-gray-900">{inInterviewCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Contratados</span>
                      <span className="text-xs font-bold text-emerald-700">{hiredCount}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobForRanking(job.id);
                      setActiveTab('job_ranking');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-md border border-red-200 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Triagem e Ranking
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setActiveTab('job_detail');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 shadow-2xs transition-colors"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
