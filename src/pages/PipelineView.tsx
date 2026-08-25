import React, { useState } from 'react';
import {
  Kanban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoreBadge } from '../components/common/Badge';
import { calculateCandidateMatch } from '../services/matchingEngine';
import { CandidateStatus } from '../types';

interface StageCol {
  id: CandidateStatus;
  title: string;
  badgeBg: string;
}

const STAGES: StageCol[] = [
  { id: 'novo', title: 'Novos', badgeBg: 'bg-gray-100 text-gray-800' },
  { id: 'triagem', title: 'Triagem', badgeBg: 'bg-gray-100 text-gray-800' },
  { id: 'pre_selecionado', title: 'Pré-selecionados', badgeBg: 'bg-red-50 text-red-700 font-semibold' },
  { id: 'entrevista', title: 'Entrevistas', badgeBg: 'bg-amber-50 text-amber-800 font-semibold' },
  { id: 'teste', title: 'Testes Técnicos', badgeBg: 'bg-purple-50 text-purple-800 font-semibold' },
  { id: 'aprovado', title: 'Aprovados', badgeBg: 'bg-emerald-50 text-emerald-800 font-semibold' },
  { id: 'contratado', title: 'Contratados', badgeBg: 'bg-emerald-100 text-emerald-900 font-bold' },
];

export const PipelineView: React.FC = () => {
  const {
    jobs,
    candidates,
    applications,
    moveApplicationStage,
    setSelectedCandidateId,
    setActiveTab,
  } = useApp();

  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');

  const filteredApps = applications.filter((app) => {
    if (selectedJobFilter !== 'all' && app.jobId !== selectedJobFilter) return false;
    return true;
  });

  const handleAdvance = (candidateId: string, jobId: string, currentStage: CandidateStatus) => {
    const stageOrder: CandidateStatus[] = [
      'novo',
      'triagem',
      'pre_selecionado',
      'entrevista',
      'teste',
      'aprovado',
      'contratado',
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      moveApplicationStage(candidateId, jobId, stageOrder[currentIndex + 1]);
    }
  };

  const handleRegress = (candidateId: string, jobId: string, currentStage: CandidateStatus) => {
    const stageOrder: CandidateStatus[] = [
      'novo',
      'triagem',
      'pre_selecionado',
      'entrevista',
      'teste',
      'aprovado',
      'contratado',
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex > 0) {
      moveApplicationStage(candidateId, jobId, stageOrder[currentIndex - 1]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Job Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Pipeline do Processo Seletivo
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Acompanhamento e movimentação de candidatos por etapas do processo seletivo
          </p>
        </div>

        {/* Job selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Filtrar por vaga:</span>
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded-md outline-hidden cursor-pointer shadow-2xs"
          >
            <option value="all">Todas as Vagas Ativas</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1250px]">
          {STAGES.map((col) => {
            const stageApps = filteredApps.filter((a) => a.stage === col.id);

            return (
              <div
                key={col.id}
                className="flex-1 bg-gray-100 rounded-lg p-3 flex flex-col border border-gray-200 min-h-[520px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 px-1 border-b border-gray-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{col.title}</span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded border border-gray-200 ${col.badgeBg}`}>
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards in this Stage */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageApps.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-gray-300 rounded-md text-[11px] text-gray-400 bg-white/50">
                      Vazio
                    </div>
                  ) : (
                    stageApps.map((app) => {
                      const cand = candidates.find((c) => c.id === app.candidateId);
                      const job = jobs.find((j) => j.id === app.jobId);
                      if (!cand || !job) return null;
                      const match = calculateCandidateMatch(cand, job);

                      return (
                        <div
                          key={app.id}
                          className="bg-white rounded-md border border-gray-200 hover:border-gray-300 hover:shadow-2xs transition-all p-3 space-y-2"
                        >
                          {/* Top: Score + Job Name */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
                              {job.title}
                            </span>
                            <ScoreBadge score={match.score} size="sm" />
                          </div>

                          {/* Candidate Name */}
                          <div>
                            <h4
                              onClick={() => {
                                setSelectedCandidateId(cand.id);
                                setActiveTab('candidate_detail');
                              }}
                              className="text-xs font-bold text-gray-900 hover:text-red-600 cursor-pointer line-clamp-1 transition-colors"
                            >
                              {cand.name}
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              {cand.totalExperienceYears} anos exp • {cand.city || 'Local não informado'}
                            </p>
                          </div>

                          {/* Skills Preview */}
                          <div className="flex flex-wrap gap-1">
                            {cand.skills.slice(0, 3).map((sk) => (
                              <span
                                key={sk.id}
                                className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded"
                              >
                                {sk.name}
                              </span>
                            ))}
                          </div>

                          {/* Card Footer: Stage Navigation Buttons */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleRegress(cand.id, job.id, col.id)}
                              disabled={col.id === 'novo'}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Etapa anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCandidateId(cand.id);
                                setActiveTab('candidate_detail');
                              }}
                              className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                            >
                              Ver perfil
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAdvance(cand.id, job.id, col.id)}
                              disabled={col.id === 'contratado'}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Próxima etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
