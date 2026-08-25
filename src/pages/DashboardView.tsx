import React from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Clock,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoreBadge, CandidateStatusBadge, Badge } from '../components/common/Badge';

export const DashboardView: React.FC = () => {
  const {
    candidates,
    jobs,
    applications,
    interviews,
    setActiveTab,
    setSelectedCandidateId,
    setSelectedJobId,
  } = useApp();

  // Top Metrics
  const totalCandidates = candidates.length;
  const openJobs = jobs.filter((j) => j.status === 'aberta').length;
  const scheduledInterviews = interviews.filter((i) => i.status === 'agendada').length;
  const hiredCandidates = applications.filter((a) => a.stage === 'contratado').length;

  // Recent data
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.appliedAt || b.stageUpdatedAt || 0).getTime() - new Date(a.appliedAt || a.stageUpdatedAt || 0).getTime())
    .slice(0, 5);

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top 4 Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Candidatos
            </span>
            <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalCandidates}</span>
            <span className="text-xs text-gray-500 font-medium">cadastrados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Vagas Abertas
            </span>
            <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{openJobs}</span>
            <span className="text-xs text-gray-500 font-medium">de {jobs.length} no total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Entrevistas
            </span>
            <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{scheduledInterviews}</span>
            <span className="text-xs text-gray-500 font-medium">agendadas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contratados
            </span>
            <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{hiredCandidates}</span>
            <span className="text-xs text-gray-500 font-medium">concluídos</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Processos Recentes & Vagas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Processos Seletivos Recentes (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Processos Recentes</h2>
              <p className="text-xs text-gray-500">Últimas candidaturas e movimentações no fluxo</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
            >
              Ver processos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[11px] uppercase text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Candidato</th>
                  <th className="px-5 py-3">Vaga</th>
                  <th className="px-5 py-3 text-center">Score</th>
                  <th className="px-5 py-3">Etapa Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {recentApplications.length > 0 ? (
                  recentApplications.map((app) => {
                    const cand = candidates.find((c) => c.id === app.candidateId);
                    const job = jobs.find((j) => j.id === app.jobId);
                    return (
                      <tr
                        key={app.id}
                        onClick={() => {
                          setSelectedCandidateId(app.candidateId);
                          setActiveTab('candidate_detail');
                        }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900">
                            {cand?.name || 'Candidato'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {cand?.city || 'Localidade não informada'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-800 font-medium">
                          {job?.title || 'Vaga em aberto'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <ScoreBadge score={app.score || 75} size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          <CandidateStatusBadge status={app.stage} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">
                      Nenhum processo seletivo registrado no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Vagas Recentes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Vagas Recentes</h2>
              <p className="text-xs text-gray-500">Posições ativas e cadastradas</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100 p-2">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setActiveTab('job_detail');
                  }}
                  className="p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-xs truncate">
                      {job.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                        job.status === 'aberta'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {job.status === 'aberta' ? 'Aberta' : job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1.5">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">
                Nenhuma vaga cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidatos Recentes Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Candidatos Recentes</h2>
            <p className="text-xs text-gray-500">Novos perfis cadastrados no banco de dados</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
          >
            Ver todos candidatos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Localização</th>
                <th className="px-5 py-3">Experiência</th>
                <th className="px-5 py-3">Competências Principais</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {recentCandidates.length > 0 ? (
                recentCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => {
                      setSelectedCandidateId(cand.id);
                      setActiveTab('candidate_detail');
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{cand.name}</div>
                      <div className="text-[11px] text-gray-500">{cand.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {cand.city ? `${cand.city} - ${cand.state}` : 'Não informada'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {cand.totalExperienceYears} anos
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {cand.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] border border-gray-200"
                          >
                            {s.name}
                          </span>
                        ))}
                        {cand.skills.length > 3 && (
                          <span className="text-[11px] text-gray-500 self-center">
                            +{cand.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <CandidateStatusBadge status={cand.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">
                    Nenhum candidato cadastrado no banco.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
