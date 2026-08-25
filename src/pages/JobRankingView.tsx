import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Columns,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoreBadge, CandidateStatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { rankCandidatesForJob, calculateCandidateMatch } from '../services/matchingEngine';
import { Candidate, CandidateStatus, HybridRankingItem } from '../types';

export const JobRankingView: React.FC = () => {
  const {
    jobs,
    candidates,
    applications,
    selectedJobForRanking,
    setSelectedJobForRanking,
    setSelectedCandidateId,
    setActiveTab,
    moveApplicationStage,
    scheduleInterview,
    rankCandidatesWithAI,
  } = useApp();

  const [selectedJobId, setSelectedJobId] = useState<string>(
    selectedJobForRanking || (jobs.length > 0 ? jobs[0].id : '')
  );

  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // Hybrid AI Mode State
  const [isHybridMode, setIsHybridMode] = useState<boolean>(false);
  const [hybridResults, setHybridResults] = useState<HybridRankingItem[]>([]);
  const [isComputingHybrid, setIsComputingHybrid] = useState<boolean>(false);

  // Compare mode (select up to 3 candidates)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Quick Interview modal
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewTargetCand, setInterviewTargetCand] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState('');

  const currentJob = jobs.find((j) => j.id === selectedJobId);

  // Calculate standard deterministic rankings
  const deterministicResults = useMemo(() => {
    if (!currentJob) return [];
    const allRankings = rankCandidatesForJob(candidates, currentJob);

    return allRankings.filter((r) => {
      if (r.score < minScoreFilter) return false;
      const app = applications.find(
        (a) => a.candidateId === r.candidate.id && a.jobId === currentJob.id
      );
      if (stageFilter !== 'all') {
        const candStage = app ? app.stage : 'nao_inscrito';
        if (candStage !== stageFilter) return false;
      }
      return true;
    });
  }, [currentJob, candidates, minScoreFilter, stageFilter, applications]);

  // Filtered hybrid results
  const filteredHybridResults = useMemo(() => {
    if (!isHybridMode || hybridResults.length === 0) return [];
    return hybridResults.filter((h) => {
      if (h.finalScore < minScoreFilter) return false;
      const app = applications.find(
        (a) => a.candidateId === h.candidate.id && a.jobId === currentJob?.id
      );
      if (stageFilter !== 'all') {
        const candStage = app ? app.stage : 'nao_inscrito';
        if (candStage !== stageFilter) return false;
      }
      return true;
    });
  }, [isHybridMode, hybridResults, minScoreFilter, stageFilter, applications, currentJob]);

  const handleComputeHybrid = async () => {
    if (!currentJob) return;
    setIsComputingHybrid(true);
    try {
      const results = await rankCandidatesWithAI(currentJob.id);
      setHybridResults(results);
      setIsHybridMode(true);
    } catch (err) {
      console.error('Erro ao calcular ranking híbrido:', err);
    } finally {
      setIsComputingHybrid(false);
    }
  };

  const toggleCompare = (candidateId: string) => {
    if (compareIds.includes(candidateId)) {
      setCompareIds(compareIds.filter((id) => id !== candidateId));
    } else {
      if (compareIds.length >= 3) {
        alert('Você pode comparar no máximo 3 candidatos simultaneamente.');
        return;
      }
      setCompareIds([...compareIds, candidateId]);
    }
  };

  const exportRankingCSV = () => {
    if (!currentJob) return;

    if (isHybridMode && filteredHybridResults.length > 0) {
      const headers = [
        'Posicao',
        'Nome',
        'Email',
        'Telefone',
        'Cidade',
        'Score_Final_Hibrido',
        'Score_Deterministico',
        'Score_IA_Semantico',
        'Recomendacao',
        'Justificativa_IA',
      ];
      const rows = filteredHybridResults.map((h, index) => [
        index + 1,
        `"${h.candidate.name}"`,
        `"${h.candidate.email}"`,
        `"${h.candidate.phone}"`,
        `"${h.candidate.city}"`,
        h.finalScore,
        h.matchingScore,
        h.aiScore,
        `"${h.recommendation}"`,
        `"${h.aiJustification.replace(/"/g, '""')}"`,
      ].join(';'));

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Ranking_Hibrido_${currentJob.title.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (deterministicResults.length === 0) return;

    const headers = [
      'Posição',
      'Nome',
      'E-mail',
      'Telefone',
      'Cidade',
      'Score Geral (%)',
      'Score Experiência',
      'Score Habilidades',
      'Score Formação',
      'Score Certificações',
      'Score Idiomas',
      'Etapa Atual',
    ];

    const rows = deterministicResults.map((r, index) => {
      const app = applications.find(
        (a) => a.candidateId === r.candidate.id && a.jobId === currentJob.id
      );
      return [
        index + 1,
        `"${r.candidate.name}"`,
        `"${r.candidate.email}"`,
        `"${r.candidate.phone}"`,
        `"${r.candidate.city}"`,
        r.score,
        r.breakdown.experienceScore,
        r.breakdown.skillsScore,
        r.breakdown.educationScore,
        r.breakdown.certificationsScore,
        r.breakdown.languagesScore,
        `"${app ? app.stage : 'Banco de Talentos'}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ranking_${currentJob.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickSchedule = async () => {
    if (!interviewTargetCand || !currentJob || !interviewDate) return;
    await scheduleInterview({
      candidateId: interviewTargetCand.id,
      jobId: currentJob.id,
      scheduledAt: interviewDate,
      interviewer: 'Recrutador Responsável',
      type: 'online',
      status: 'agendada',
      stage: 'Entrevista de Triagem',
    });
    await moveApplicationStage(interviewTargetCand.id, currentJob.id, 'entrevista');
    setIsInterviewModalOpen(false);
    setInterviewTargetCand(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Job Select */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Ranking & Triagem de Candidatos
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Classificação por aderência técnica, matching algorítmico e critérios da vaga
          </p>
        </div>

        {/* Job Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Vaga Alvo:</span>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSelectedJobForRanking(e.target.value);
              setCompareIds([]);
              setIsHybridMode(false);
              setHybridResults([]);
            }}
            className="w-full sm:w-72 px-3 py-1.5 text-xs font-semibold text-gray-900 bg-white border border-gray-300 rounded-md outline-hidden cursor-pointer shadow-2xs"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Corporate Scoring Mode Banner */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-gray-300 text-gray-800">
              {isHybridMode ? 'Modo Híbrido (Algoritmo + Análise Semântica)' : 'Modo Algorítmico Padrão'}
            </span>
            <span className="text-xs text-gray-600 font-medium">
              Pesos: <strong>70% Motor de Regras</strong> + <strong>30% IA Semântica</strong>
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {isHybridMode
              ? 'Exibindo pontuação combinada com parecer analítico de aderência técnica.'
              : 'O ranking atual é calculado estritamente pelas regras matemáticas de experiência, skills e formação.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isHybridMode ? (
            <button
              type="button"
              onClick={() => setIsHybridMode(false)}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md transition-all border border-gray-300 shadow-2xs"
            >
              Voltar ao Modo Padrão
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComputeHybrid}
              disabled={isComputingHybrid}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isComputingHybrid ? 'animate-spin' : ''}`} />
              {isComputingHybrid ? 'Calculando Ranking...' : 'Classificação com IA'}
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Cutoff Filter + Stage Filter + Compare Button + Export CSV */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Cutoff slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Nota Mínima:</span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(parseInt(e.target.value))}
              className="accent-red-600 w-24 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-gray-800">
              ≥ {minScoreFilter}%
            </span>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Etapa:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md text-gray-800 font-medium outline-hidden"
            >
              <option value="all">Todas as Etapas</option>
              <option value="novo">Novo</option>
              <option value="triagem">Triagem</option>
              <option value="pre_selecionado">Pré-selecionados</option>
              <option value="entrevista">Entrevista</option>
              <option value="teste">Teste</option>
              <option value="aprovado">Aprovado</option>
              <option value="contratado">Contratado</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {compareIds.length > 1 && (
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
            >
              <Columns className="w-3.5 h-3.5" />
              Comparar ({compareIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={exportRankingCSV}
            disabled={isHybridMode ? filteredHybridResults.length === 0 : deterministicResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Main Ranking Table / List */}
      {!currentJob ? (
        <EmptyState
          title="Nenhuma vaga selecionada"
          description="Cadastre uma vaga ou selecione uma existente para visualizar o ranking de candidatos."
          actionLabel="Cadastrar Vaga"
          onAction={() => setActiveTab('job_create')}
        />
      ) : isHybridMode ? (
        filteredHybridResults.length === 0 ? (
          <EmptyState
            title="Nenhum candidato atende aos critérios do Ranking Híbrido"
            description="Ajuste os filtros de pontuação mínima ou execute a reanálise."
            actionLabel="Redefinir Filtros"
            onAction={() => {
              setMinScoreFilter(0);
              setStageFilter('all');
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredHybridResults.map((item, index) => {
              const { candidate, finalScore, matchingScore, aiScore, recommendation, aiJustification, strengths, attentionPoints } = item;
              const app = applications.find(
                (a) => a.candidateId === candidate.id && a.jobId === currentJob.id
              );
              const isExpanded = expandedCandidateId === candidate.id;
              const isCompared = compareIds.includes(candidate.id);

              const recBadge = {
                fortemente_recomendado: { label: 'Fortemente Recomendado', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                recomendado: { label: 'Recomendado', color: 'bg-blue-50 text-blue-800 border-blue-300' },
                com_ressalvas: { label: 'Recomendado com Ressalvas', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                nao_recomendado: { label: 'Requer Avaliação', color: 'bg-gray-50 text-gray-700 border-gray-300' },
              }[recommendation] || { label: recommendation, color: 'bg-gray-50 text-gray-700 border-gray-300' };

              return (
                <div
                  key={candidate.id}
                  className={`bg-white rounded-lg border transition-all ${
                    isExpanded
                      ? 'border-gray-400 shadow-sm ring-1 ring-gray-200'
                      : 'border-gray-200 hover:border-gray-300 shadow-xs'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Position & Candidate Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          index === 0
                            ? 'bg-red-600 text-white shadow-2xs'
                            : index === 1
                            ? 'bg-gray-800 text-white'
                            : index === 2
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(candidate.id)}
                        title="Selecionar para comparação"
                        className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={() => {
                              setSelectedCandidateId(candidate.id);
                              setActiveTab('candidate_detail');
                            }}
                            className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                          >
                            {candidate.name}
                          </h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${recBadge.color}`}>
                            {recBadge.label}
                          </span>
                          {app && <CandidateStatusBadge status={app.stage} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {candidate.city ? `${candidate.city} - ${candidate.state}` : 'Local não informado'} •{' '}
                          <strong>{candidate.totalExperienceYears} anos de experiência</strong>
                        </p>
                      </div>
                    </div>

                    {/* Center: Hybrid Score Breakdown */}
                    <div className="flex items-center gap-4 self-start lg:self-center">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Score Híbrido</span>
                        <ScoreBadge score={finalScore} size="md" />
                      </div>

                      <div className="hidden sm:flex flex-col gap-1 text-[11px] bg-gray-50 p-2 rounded-md border border-gray-200 min-w-40">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Algoritmo (70%):</span>
                          <strong className="font-mono text-gray-900">{matchingScore}%</strong>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                          <span>IA Semântica (30%):</span>
                          <strong className="font-mono text-gray-900">{aiScore}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <select
                        value={app ? app.stage : 'novo'}
                        onChange={(e) =>
                          moveApplicationStage(
                            candidate.id,
                            currentJob.id,
                            e.target.value as CandidateStatus
                          )
                        }
                        className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-md px-2.5 py-1.5 outline-hidden"
                      >
                        <option value="novo">Novo</option>
                        <option value="triagem">Triagem</option>
                        <option value="pre_selecionado">Pré-selecionar</option>
                        <option value="entrevista">Entrevista</option>
                        <option value="teste">Teste</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="contratado">Contratado</option>
                        <option value="reprovado">Reprovar</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setInterviewTargetCand(candidate);
                          setIsInterviewModalOpen(true);
                        }}
                        className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        title="Agendar Entrevista"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.id)}
                        className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        title="Ver Justificativa"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded AI Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50 rounded-b-lg space-y-3">
                      <div className="p-3.5 bg-white rounded-md border border-gray-200 shadow-2xs">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-4 h-4 text-red-600" />
                          Parecer e Justificativa da Análise
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {aiJustification}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Strengths */}
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                          <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Pontos Fortes Identificados ({strengths.length})
                          </h4>
                          <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                            {strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Attention points */}
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Pontos de Atenção & Ressalvas ({attentionPoints.length})
                          </h4>
                          {attentionPoints.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">
                              Nenhuma ressalva crítica identificada.
                            </p>
                          ) : (
                            <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                              {attentionPoints.map((a, idx) => (
                                <li key={idx}>{a}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : deterministicResults.length === 0 ? (
        <EmptyState
          title="Nenhum candidato atende à nota de corte"
          description={`Nenhum candidato atingiu a pontuação mínima de ${minScoreFilter}%. Ajuste os filtros ou importe novos currículos.`}
          actionLabel="Redefinir Filtros"
          onAction={() => {
            setMinScoreFilter(0);
            setStageFilter('all');
          }}
        />
      ) : (
        <div className="space-y-3">
          {deterministicResults.map((result, index) => {
            const { candidate, score, breakdown, strengths, attentionPoints } = result;
            const app = applications.find(
              (a) => a.candidateId === candidate.id && a.jobId === currentJob.id
            );
            const isExpanded = expandedCandidateId === candidate.id;
            const isCompared = compareIds.includes(candidate.id);

            return (
              <div
                key={candidate.id}
                className={`bg-white rounded-lg border transition-all ${
                  isExpanded
                    ? 'border-gray-400 shadow-sm ring-1 ring-gray-200'
                    : 'border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                {/* Ranking Item Main Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Position Rank + Candidate Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-red-600 text-white shadow-2xs'
                          : index === 1
                          ? 'bg-gray-800 text-white'
                          : index === 2
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => toggleCompare(candidate.id)}
                      title="Selecionar para comparação lado a lado"
                      className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => {
                            setSelectedCandidateId(candidate.id);
                            setActiveTab('candidate_detail');
                          }}
                          className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          {candidate.name}
                        </h3>
                        {app ? (
                          <CandidateStatusBadge status={app.stage} />
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">
                            Banco de Talentos
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {candidate.city ? `${candidate.city} - ${candidate.state}` : 'Local não informado'} •{' '}
                        <strong>{candidate.totalExperienceYears} anos de experiência</strong>
                      </p>
                    </div>
                  </div>

                  {/* Center: Score + Mini breakdown bars */}
                  <div className="flex items-center gap-6 self-start lg:self-center">
                    <ScoreBadge score={score} size="md" />

                    <div className="hidden sm:grid grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-gray-600 w-64">
                      <div className="flex justify-between">
                        <span>Exp:</span> <strong className="text-gray-900">{breakdown.experienceScore}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Skills:</span> <strong className="text-gray-900">{breakdown.skillsScore}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Formação:</span> <strong className="text-gray-900">{breakdown.educationScore}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Certs:</span> <strong className="text-gray-900">{breakdown.certificationsScore}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Idiomas:</span> <strong className="text-gray-900">{breakdown.languagesScore}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Específicos:</span> <strong className="text-gray-900">{breakdown.customScore}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <select
                      value={app ? app.stage : 'novo'}
                      onChange={(e) =>
                        moveApplicationStage(
                          candidate.id,
                          currentJob.id,
                          e.target.value as CandidateStatus
                        )
                      }
                      className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-md px-2.5 py-1.5 outline-hidden"
                    >
                      <option value="novo">Novo</option>
                      <option value="triagem">Triagem</option>
                      <option value="pre_selecionado">Pré-selecionar</option>
                      <option value="entrevista">Entrevista</option>
                      <option value="teste">Teste</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="contratado">Contratado</option>
                      <option value="reprovado">Reprovar</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setInterviewTargetCand(candidate);
                        setIsInterviewModalOpen(true);
                      }}
                      className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Agendar Entrevista"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.id)}
                      className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Ver Motivos e Detalhamento"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Justification / Breakdown Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50 rounded-b-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* Pontos Fortes */}
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Motivos do Score Positivo ({strengths.length})
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                          {strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Pontos de Atenção */}
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Pontos de Atenção / Ausências ({attentionPoints.length})
                        </h4>
                        {attentionPoints.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            O candidato atende com conformidade aos requisitos configurados.
                          </p>
                        ) : (
                          <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                            {attentionPoints.map((a, idx) => (
                              <li key={idx}>{a}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Progress Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Experiência ({currentJob.weights.experience}%)
                        </span>
                        <ProgressBar value={breakdown.experienceScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.experienceScore}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Habilidades ({currentJob.weights.skills}%)
                        </span>
                        <ProgressBar value={breakdown.skillsScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.skillsScore}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Formação ({currentJob.weights.education}%)
                        </span>
                        <ProgressBar value={breakdown.educationScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.educationScore}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Certificações ({currentJob.weights.certifications}%)
                        </span>
                        <ProgressBar value={breakdown.certificationsScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.certificationsScore}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Idiomas ({currentJob.weights.languages}%)
                        </span>
                        <ProgressBar value={breakdown.languagesScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.languagesScore}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                          Critérios ({currentJob.weights.customCriteria}%)
                        </span>
                        <ProgressBar value={breakdown.customScore} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-700 mt-1 block">
                          {breakdown.customScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidateId(candidate.id);
                          setActiveTab('candidate_detail');
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        Visualizar perfil completo do candidato →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Side-by-Side Comparison of Candidates */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Comparativo Lado a Lado de Candidatos"
        subtitle={`Vaga: ${currentJob?.title || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className={`grid grid-cols-1 md:grid-cols-${compareIds.length} gap-4`}>
            {compareIds.map((candId) => {
              const cand = candidates.find((c) => c.id === candId);
              if (!cand || !currentJob) return null;
              const match = calculateCandidateMatch(cand, currentJob);

              return (
                <div key={cand.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{cand.name}</h4>
                      <p className="text-xs text-gray-500">{cand.city} • {cand.totalExperienceYears} anos exp</p>
                    </div>
                    <ScoreBadge score={match.score} size="md" />
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-1 text-xs border-y border-gray-100 py-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Exp. Profissional</span>
                      <strong className="text-gray-900">{match.breakdown.experienceScore}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Habilidades</span>
                      <strong className="text-gray-900">{match.breakdown.skillsScore}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formação</span>
                      <strong className="text-gray-900">{match.breakdown.educationScore}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Certificações</span>
                      <strong className="text-gray-900">{match.breakdown.certificationsScore}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Idiomas</span>
                      <strong className="text-gray-900">{match.breakdown.languagesScore}%</strong>
                    </div>
                  </div>

                  {/* Skills Tag List */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Habilidades</div>
                    <div className="flex flex-wrap gap-1">
                      {cand.skills.map((s) => (
                        <span key={s.id} className="text-[10px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-medium text-gray-700">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800 mb-1">Destaques</div>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      {match.strengths.slice(0, 3).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(false)}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md border border-gray-300"
            >
              Fechar Comparação
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Quick Interview Scheduling */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title="Agendar Entrevista"
        subtitle={interviewTargetCand ? `Candidato: ${interviewTargetCand.name}` : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Data e Horário</label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsInterviewModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleQuickSchedule}
              disabled={!interviewDate}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
            >
              Confirmar Agendamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
