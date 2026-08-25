import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Trash2,
  Download,
  PlusCircle,
  Star,
  CheckCircle,
  AlertCircle,
  UserCheck,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, ScoreBadge, CandidateStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatEducationLevel, calculateCandidateMatch } from '../services/matchingEngine';
import { CandidateStatus, AICandidateAnalysis } from '../types';

export const CandidateDetailView: React.FC = () => {
  const {
    candidates,
    selectedCandidateId,
    setActiveTab,
    jobs,
    applications,
    interviews,
    evaluations,
    updateCandidate,
    deleteCandidate,
    moveApplicationStage,
    applyCandidateToJob,
    scheduleInterview,
    addEvaluation,
    analyzeCandidateProfile,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'perfil' | 'ia_analise' | 'candidaturas' | 'entrevistas' | 'curriculo_bruto' | 'lgpd'
  >('perfil');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AICandidateAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [selectedJobForAI, setSelectedJobForAI] = useState<string>('');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobToApply, setSelectedJobToApply] = useState('');

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    jobId: '',
    scheduledAt: '',
    interviewer: 'Recrutador RH',
    type: 'online' as 'online' | 'presencial' | 'telefone',
    stage: 'Entrevista de Triagem Técnica',
  });

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    jobId: '',
    evaluator: 'Gestor de RH',
    technicalScore: 4,
    behavioralScore: 4,
    overallScore: 4,
    comments: '',
    recommendation: 'recomendado' as 'fortemente_recomendado' | 'recomendado' | 'com_ressalvas' | 'nao_recomendado',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const candidate = candidates.find((c) => c.id === selectedCandidateId);

  if (!candidate) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-4">Candidato não encontrado ou removido.</p>
        <button
          onClick={() => setActiveTab('candidates')}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700"
        >
          Voltar para Candidatos
        </button>
      </div>
    );
  }

  // Linked applications
  const candidateApps = applications.filter((a) => a.candidateId === candidate.id);
  const candidateInterviews = interviews.filter((i) => i.candidateId === candidate.id);
  const candidateEvals = evaluations.filter((e) => e.candidateId === candidate.id);

  // Status options for quick update
  const statusOptions: { value: CandidateStatus; label: string }[] = [
    { value: 'novo', label: 'Novo' },
    { value: 'triagem', label: 'Em Triagem' },
    { value: 'pre_selecionado', label: 'Pré-selecionado' },
    { value: 'entrevista', label: 'Entrevista' },
    { value: 'teste', label: 'Em Teste' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'contratado', label: 'Contratado' },
    { value: 'reprovado', label: 'Reprovado' },
  ];

  const handleApply = async () => {
    if (!selectedJobToApply) return;
    await applyCandidateToJob(candidate.id, selectedJobToApply);
    setIsApplyModalOpen(false);
    setSelectedJobToApply('');
  };

  const handleSchedule = async () => {
    if (!interviewForm.jobId || !interviewForm.scheduledAt) return;
    await scheduleInterview({
      candidateId: candidate.id,
      jobId: interviewForm.jobId,
      scheduledAt: interviewForm.scheduledAt,
      interviewer: interviewForm.interviewer,
      type: interviewForm.type,
      status: 'agendada',
      stage: interviewForm.stage,
    });
    setIsInterviewModalOpen(false);
  };

  const handleEval = async () => {
    if (!evalForm.jobId) return;
    await addEvaluation({
      candidateId: candidate.id,
      jobId: evalForm.jobId,
      evaluator: evalForm.evaluator,
      technicalScore: evalForm.technicalScore,
      behavioralScore: evalForm.behavioralScore,
      overallScore: evalForm.overallScore,
      comments: evalForm.comments,
      recommendation: evalForm.recommendation,
    });
    setIsEvalModalOpen(false);
  };

  const exportCandidateJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(candidate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Candidato_${candidate.name.replace(/\s+/g, '_')}_LGPD.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzingAI(true);
    try {
      const result = await analyzeCandidateProfile(candidate.id, selectedJobForAI || undefined);
      setAiAnalysis(result);
    } catch (err) {
      console.error('Erro na análise de perfil:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Profile Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('candidates')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gray-500" />
            Vincular a vaga
          </button>
          <button
            type="button"
            onClick={() => setIsInterviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Agendar entrevista
          </button>
        </div>
      </div>

      {/* Main Candidate Card Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {candidate.name}
                </h1>
                <CandidateStatusBadge status={candidate.status} />
              </div>

              {/* Contact and Location */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2">
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {candidate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {candidate.city ? `${candidate.city} - ${candidate.state}` : 'Local não informado'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  {candidate.totalExperienceYears} anos de experiência
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status Select */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200 self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-xs font-semibold text-gray-600 pl-2">Status:</span>
            <select
              value={candidate.status}
              onChange={(e) => updateCandidate(candidate.id, { status: e.target.value as CandidateStatus })}
              className="text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-md px-3 py-1.5 outline-hidden cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 pt-4 border-t border-gray-100 overflow-x-auto">
          {[
            { id: 'perfil', label: 'Visão Geral & Perfil' },
            { id: 'ia_analise', label: 'Diagnóstico & Fit' },
            { id: 'candidaturas', label: `Candidaturas (${candidateApps.length})` },
            { id: 'entrevistas', label: `Entrevistas (${candidateInterviews.length}) & Avaliações (${candidateEvals.length})` },
            { id: 'curriculo_bruto', label: 'Texto do CV' },
            { id: 'lgpd', label: 'Governança & LGPD' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id as any);
                if (tab.id === 'ia_analise' && !aiAnalysis) {
                  handleRunAIAnalysis();
                }
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-red-50 text-red-700 border border-red-200 font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Diagnóstico de Perfil */}
      {activeSubTab === 'ia_analise' && (
        <div className="space-y-6">
          {/* Header Controls for Analysis */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Diagnóstico de Perfil e Aderência
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Avaliação estruturada de competências, pontos de atenção e roteiro sugerido para entrevista
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedJobForAI}
                onChange={(e) => setSelectedJobForAI(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md font-medium text-gray-800 outline-hidden shadow-2xs"
              >
                <option value="">Avaliação Geral de Perfil</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    Comparar com: {j.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzingAI}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                {isAnalyzingAI ? 'Processando...' : 'Reanalisar perfil'}
              </button>
            </div>
          </div>

          {isAnalyzingAI ? (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-gray-900">Processando análise técnica...</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Cruzando dados de competências com os requisitos cadastrados da vaga.
              </p>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-6">
              {/* Summary & Score Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Resumo do Perfil
                    </span>
                    <h4 className="text-base font-bold text-gray-900">
                      Enquadramento Sugerido: {aiAnalysis.suggestedRoleFit}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Aderência Calculada</span>
                      <ScoreBadge score={aiAnalysis.compatibilityScore} size="md" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-200">
                  {aiAnalysis.summary}
                </p>

                {/* Strengths & Attention Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      Pontos Fortes & Evidências
                    </h5>
                    <ul className="space-y-1.5 text-xs text-emerald-900 list-disc list-inside">
                      {aiAnalysis.strengths.map((s, idx) => (
                        <li key={idx} className="leading-snug">{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200 space-y-2">
                    <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      Pontos de Atenção a Validar
                    </h5>
                    <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
                      {aiAnalysis.attentionPoints.map((a, idx) => (
                        <li key={idx} className="leading-snug">{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cultural Fit Notes */}
                <div className="p-4 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-1">
                  <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-gray-600" />
                    Observações de Alinhamento e Postura
                  </h5>
                  <p className="leading-relaxed">{aiAnalysis.culturalFitNotes}</p>
                </div>
              </div>

              {/* Recommended Interview Questions */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      Roteiro de Perguntas Sugeridas
                    </h4>
                    <p className="text-xs text-gray-500">Perguntas de checagem técnica e comportamental focadas no perfil</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedJobForAI) {
                        setInterviewForm((prev) => ({ ...prev, jobId: selectedJobForAI }));
                      }
                      setIsInterviewModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
                  >
                    Agendar entrevista com roteiro
                  </button>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.recommendedInterviewQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 leading-snug">
                          {idx + 1}. {q.question}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gray-200 text-gray-800 shrink-0">
                          {q.focus}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-200">
                        <strong>Objetivo:</strong> {q.rationale}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Responsible AI Disclaimer & LGPD info */}
                <div className="p-3 bg-gray-100 rounded-md text-[11px] text-gray-600 flex items-start gap-2 border border-gray-200">
                  <ShieldCheck className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Governança e Uso Responsável:</strong> Análise processada por <em>{aiAnalysis.provider}</em>.
                    O RecruitAI RH atua como ferramenta de apoio à decisão; os resultados refletem aderência a critérios técnicos e não substituem a avaliação humana do recrutador.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Nenhum diagnóstico gerado ainda</h4>
              <p className="text-xs text-gray-500">
                Execute a análise para avaliar competências e obter sugestões de perguntas para a entrevista.
              </p>
              <button
                type="button"
                onClick={handleRunAIAnalysis}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700"
              >
                Gerar diagnóstico
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Perfil & Experiência */}
      {activeSubTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Experience & Education */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experiências Profissionais */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-red-600" />
                Histórico Profissional ({candidate.experiences.length})
              </h3>

              {candidate.experiences.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhuma experiência formal mapeada.</p>
              ) : (
                <div className="space-y-4">
                  {candidate.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-md bg-gray-50 border border-gray-200 flex flex-col gap-1"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{exp.role}</h4>
                          <p className="text-xs font-medium text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                          {exp.startDate} - {exp.endDate || (exp.current ? 'Atual' : '')} ({exp.years} {exp.years === 1 ? 'ano' : 'anos'})
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-gray-700 mt-2 leading-relaxed bg-white p-2.5 rounded border border-gray-200">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formação Acadêmica */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-red-600" />
                Formação Acadêmica ({candidate.education.length})
              </h3>

              {candidate.education.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhuma formação cadastrada.</p>
              ) : (
                <div className="space-y-3">
                  {candidate.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{edu.course}</h4>
                        <p className="text-xs text-gray-600">{edu.institution}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="primary">{formatEducationLevel(edu.level)}</Badge>
                        {edu.completionYear && (
                          <span className="text-[11px] text-gray-500 block mt-1">
                            Conclusão: {edu.completionYear}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Skills, Certifications, Languages */}
          <div className="space-y-6">
            {/* Habilidades */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Competências Identificadas ({candidate.skills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((sk) => (
                  <span
                    key={sk.id}
                    className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200"
                  >
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Certificações */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-600" />
                Certificações ({candidate.certifications.length})
              </h3>
              {candidate.certifications.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhuma certificação listada.</p>
              ) : (
                <div className="space-y-2">
                  {candidate.certifications.map((cert) => (
                    <div key={cert.id} className="p-2.5 bg-gray-50 rounded-md border border-gray-200 text-xs">
                      <div className="font-bold text-gray-800">{cert.name}</div>
                      {cert.issuer && <div className="text-[11px] text-gray-500">{cert.issuer} {cert.year ? `(${cert.year})` : ''}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Idiomas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-gray-600" />
                Idiomas ({candidate.languages.length})
              </h3>
              {candidate.languages.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Não especificados.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.languages.map((lang, idx) => (
                    <span key={idx} className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Candidaturas & Matchings */}
      {activeSubTab === 'candidaturas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Vagas e Compatibilidade Calculada</h3>
              <p className="text-xs text-gray-500">Cálculo de aderência (0-100%) baseado nos requisitos de cada vaga</p>
            </div>
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Inscrever em nova vaga
            </button>
          </div>

          {candidateApps.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-xs text-gray-500 mb-3">O candidato ainda não está vinculado a nenhuma vaga aberta.</p>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700"
              >
                Vincular a uma vaga
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidateApps.map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);
                if (!job) return null;
                const matchResult = calculateCandidateMatch(candidate, job);

                return (
                  <div key={app.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{job.title}</h4>
                        <p className="text-xs text-gray-500">
                          {job.department} • {job.location} ({job.workplaceType})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={matchResult.score} size="lg" />
                        <select
                          value={app.stage}
                          onChange={(e) => moveApplicationStage(candidate.id, job.id, e.target.value as CandidateStatus)}
                          className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 outline-hidden"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              Etapa: {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Experiência</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.experienceScore}%</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Habilidades</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.skillsScore}%</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Formação</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.educationScore}%</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Certificações</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.certificationsScore}%</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Idiomas</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.languagesScore}%</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-[11px] text-gray-500 block">Específicos</span>
                        <span className="text-sm font-bold text-gray-900">{matchResult.breakdown.customScore}%</span>
                      </div>
                    </div>

                    {/* Strengths & Attention Points */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200">
                        <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          Pontos Fortes ({matchResult.strengths.length})
                        </h5>
                        <ul className="space-y-1 text-xs text-emerald-900 list-disc list-inside">
                          {matchResult.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200">
                        <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          Pontos de Atenção ({matchResult.attentionPoints.length})
                        </h5>
                        {matchResult.attentionPoints.length === 0 ? (
                          <p className="text-xs text-amber-800 italic">Nenhum ponto crítico detectado.</p>
                        ) : (
                          <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                            {matchResult.attentionPoints.map((a, idx) => (
                              <li key={idx}>{a}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Entrevistas & Avaliações */}
      {activeSubTab === 'entrevistas' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Entrevistas e Pareceres</h3>
              <p className="text-xs text-gray-500">Histórico de sessões com recrutadores e avaliadores técnicos</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
              >
                + Registrar parecer
              </button>
              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
              >
                + Agendar entrevista
              </button>
            </div>
          </div>

          {/* Interviews List */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-red-600" />
              Sessões Agendadas / Realizadas
            </h4>
            {candidateInterviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhuma entrevista registrada para este candidato.</p>
            ) : (
              <div className="space-y-3">
                {candidateInterviews.map((int) => (
                  <div key={int.id} className="p-4 rounded-md bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{int.stage}</span>
                        <Badge variant={int.status === 'realizada' ? 'success' : int.status === 'agendada' ? 'primary' : 'danger'}>
                          {int.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Entrevistador: <strong>{int.interviewer}</strong> • Modalidade: {int.type}
                      </p>
                      {int.feedback && (
                        <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded border border-gray-200">
                          <strong>Feedback:</strong> {int.feedback}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-red-700 block">
                        {new Date(int.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(int.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluations List */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Star className="w-4 h-4 text-amber-500" />
              Pareceres & Avaliações
            </h4>
            {candidateEvals.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhuma avaliação formal registrada.</p>
            ) : (
              <div className="space-y-3">
                {candidateEvals.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Avaliador: {ev.evaluator}</span>
                      <Badge variant={ev.recommendation === 'fortemente_recomendado' || ev.recommendation === 'recomendado' ? 'success' : 'warning'}>
                        {ev.recommendation.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Técnico: <strong>{ev.technicalScore}/5</strong></span>
                      <span>Comportamental: <strong>{ev.behavioralScore}/5</strong></span>
                      <span>Geral: <strong>{ev.overallScore}/5</strong></span>
                    </div>
                    <p className="text-xs text-gray-700 italic bg-white p-2.5 rounded border border-gray-200">
                      "{ev.comments}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Currículo Bruto Extraído */}
      {activeSubTab === 'curriculo_bruto' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Texto Extraído do Documento Original</h3>
              <p className="text-xs text-gray-500">
                Arquivo fonte: <strong>{candidate.resumeFileName || 'Não informado'}</strong>
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
              {candidate.rawText.length} caracteres
            </span>
          </div>

          <div className="p-4 bg-gray-900 text-gray-100 rounded-md font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed select-text border border-gray-800">
            {candidate.rawText || 'Texto bruto não disponível.'}
          </div>
        </div>
      )}

      {/* Tab 5: LGPD & Governança */}
      {activeSubTab === 'lgpd' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Conformidade e Direitos do Titular (LGPD)</h3>
            <p className="text-xs text-gray-500">
              Gerencie a retenção, portabilidade e exclusão dos dados deste candidato em conformidade com a Lei Geral de Proteção de Dados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exportar JSON */}
            <div className="p-5 rounded-lg border border-gray-200 bg-gray-50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-gray-700" />
                  Portabilidade de Dados (Exportar JSON)
                </h4>
                <p className="text-xs text-gray-500">
                  Faça o download dos dados completos em formato padronizado para atendimento aos direitos do titular.
                </p>
              </div>
              <button
                type="button"
                onClick={exportCandidateJson}
                className="mt-4 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-300 transition-colors self-start shadow-2xs"
              >
                Exportar dados do candidato
              </button>
            </div>

            {/* Exclusão Definitiva */}
            <div className="p-5 rounded-lg border border-red-200 bg-red-50/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-red-900 mb-1 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Direito de Exclusão (Esquecimento)
                </h4>
                <p className="text-xs text-red-800">
                  Remove permanentemente o currículo, histórico de candidaturas e avaliações do banco de dados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors self-start shadow-xs"
              >
                Excluir candidato definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Vincular a Vaga */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Vincular Candidato a uma Vaga"
        subtitle={`Selecione a vaga aberta para associar ${candidate.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Escolha a Vaga
            </label>
            <select
              value={selectedJobToApply}
              onChange={(e) => setSelectedJobToApply(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-800 font-medium outline-hidden"
            >
              <option value="">Selecione uma oportunidade...</option>
              {jobs
                .filter((j) => !candidateApps.some((a) => a.jobId === j.id))
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedJobToApply}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
            >
              Confirmar Inscrição
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Agendar Entrevista */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title="Agendar Entrevista"
        subtitle={`Marcar sessão seletiva para ${candidate.name}`}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Vaga Relacionada</label>
            <select
              value={interviewForm.jobId}
              onChange={(e) => setInterviewForm({ ...interviewForm, jobId: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Selecione a vaga...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Data e Horário</label>
            <input
              type="datetime-local"
              value={interviewForm.scheduledAt}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Entrevistador</label>
              <input
                type="text"
                value={interviewForm.interviewer}
                onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Modalidade</label>
              <select
                value={interviewForm.type}
                onChange={(e: any) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
              >
                <option value="online">Online (Vídeo)</option>
                <option value="presencial">Presencial</option>
                <option value="telefone">Telefone</option>
              </select>
            </div>
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
              onClick={handleSchedule}
              disabled={!interviewForm.jobId || !interviewForm.scheduledAt}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
            >
              Agendar Entrevista
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Registrar Avaliação */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title="Registrar Parecer Técnico/Comportamental"
        subtitle={`Avaliação formal para ${candidate.name}`}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Vaga</label>
            <select
              value={evalForm.jobId}
              onChange={(e) => setEvalForm({ ...evalForm, jobId: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Selecione a vaga avaliada...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nota Técnica (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={evalForm.technicalScore}
                onChange={(e) => setEvalForm({ ...evalForm, technicalScore: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Comportamental</label>
              <input
                type="number"
                min="1"
                max="5"
                value={evalForm.behavioralScore}
                onChange={(e) => setEvalForm({ ...evalForm, behavioralScore: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nota Geral</label>
              <input
                type="number"
                min="1"
                max="5"
                value={evalForm.overallScore}
                onChange={(e) => setEvalForm({ ...evalForm, overallScore: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Recomendação Final</label>
            <select
              value={evalForm.recommendation}
              onChange={(e: any) => setEvalForm({ ...evalForm, recommendation: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="fortemente_recomendado">Fortemente Recomendado</option>
              <option value="recomendado">Recomendado</option>
              <option value="com_ressalvas">Recomendado com Ressalvas</option>
              <option value="nao_recomendado">Não Recomendado</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Parecer & Comentários</label>
            <textarea
              rows={3}
              value={evalForm.comments}
              onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
              placeholder="Descreva pontos fortes, observações técnicas e alinhamento cultural..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEvalModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEval}
              disabled={!evalForm.jobId}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md disabled:opacity-50"
            >
              Salvar Parecer
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar Exclusão de Candidato"
        subtitle="Esta ação não pode ser desfeita."
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Você está prestes a remover o registro de <strong>{candidate.name}</strong>, incluindo todas as candidaturas, agendamentos de entrevista e avaliações associadas.
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteCandidate(candidate.id);
                setShowDeleteConfirm(false);
                setActiveTab('candidates');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Sim, Excluir Registro
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
