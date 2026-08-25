import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  Candidate,
  Job,
  Application,
  Interview,
  Evaluation,
  AuditLog,
  SystemSettings,
  RankingResult,
  CandidateStatus,
  AICandidateAnalysis,
  AIJobAnalysis,
  AIInterviewScript,
  HybridRankingItem,
} from '../types';
import { storageService, DEFAULT_SETTINGS } from '../services/storage';
import { seedDatabase } from '../data/seedData';
import { calculateCandidateMatch } from '../services/matchingEngine';
import { checkDuplicateCandidate } from '../services/duplicateDetector';
import { analyzeCandidate } from '../services/ai/candidateAnalyzer';
import { analyzeJob } from '../services/ai/jobAnalyzer';
import { generateInterviewQuestions } from '../services/ai/interviewGenerator';
import { rankCandidatesHybrid as runRankCandidatesHybrid } from '../services/ai/rankingAnalyzer';

export type ActiveTab =
  | 'dashboard'
  | 'candidates'
  | 'candidate_detail'
  | 'jobs'
  | 'job_detail'
  | 'job_create'
  | 'job_ranking'
  | 'pipeline'
  | 'interviews'
  | 'talent_pool'
  | 'import_resume'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Data States
  candidates: Candidate[];
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
  evaluations: Evaluation[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  loading: boolean;
  isServerAIOnline: boolean;

  // Navigation & Selection States
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  editingJobId: string | null;
  setEditingJobId: (id: string | null) => void;
  selectedJobForRanking: string | null;
  setSelectedJobForRanking: (id: string | null) => void;

  // Actions - Candidates
  createCandidate: (candidate: Candidate, overrideDuplicate?: boolean) => Promise<{ success: boolean; isDuplicate?: boolean; reason?: string }>;
  updateCandidate: (id: string, data: Partial<Candidate>) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  importCandidatesBatch: (newCandidates: Candidate[]) => Promise<{ imported: number; duplicates: number; errors: number }>;

  // Actions - Jobs
  createJob: (job: Job) => Promise<Job>;
  updateJob: (id: string, data: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  duplicateJob: (id: string) => Promise<Job>;

  // Actions - Applications & Pipeline
  moveApplicationStage: (candidateId: string, jobId: string, newStage: CandidateStatus) => Promise<void>;
  applyCandidateToJob: (candidateId: string, jobId: string) => Promise<Application>;
  getJobRankings: (jobId: string) => RankingResult[];
  recalculateAllRankingsForJob: (jobId: string) => Promise<RankingResult[]>;

  // Actions - AI Intelligence Layer
  analyzeCandidateProfile: (candidateId: string, jobId?: string) => Promise<AICandidateAnalysis>;
  analyzeJobDescription: (jobDraft: { title: string; description: string; department?: string }) => Promise<AIJobAnalysis>;
  generateInterviewScript: (candidateId: string, jobId: string) => Promise<AIInterviewScript>;
  rankCandidatesWithAI: (jobId: string) => Promise<HybridRankingItem[]>;

  // Actions - Interviews & Evaluations
  scheduleInterview: (interview: Omit<Interview, 'id' | 'createdAt'>) => Promise<void>;
  updateInterview: (id: string, data: Partial<Interview>) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;
  addEvaluation: (evalData: Omit<Evaluation, 'id' | 'createdAt'>) => Promise<void>;

  // System & Settings
  saveSettings: (settings: SystemSettings) => void;
  reloadSeedData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<{ success: boolean; message: string }>;

  // UI helpers
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isServerAIOnline, setIsServerAIOnline] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [selectedJobForRanking, setSelectedJobForRanking] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all data from repository
  const refreshData = useCallback(async () => {
    try {
      const [c, j, a, i, e, l] = await Promise.all([
        storageService.candidates.getAll(),
        storageService.jobs.getAll(),
        storageService.applications.getAll(),
        storageService.interviews.getAll(),
        storageService.evaluations.getAll(),
        storageService.auditLogs.getAll(),
      ]);
      setCandidates(c);
      setJobs(j);
      setApplications(a);
      setInterviews(i);
      setEvaluations(e);
      setAuditLogs(l);
      setSettings(storageService.getSettings());
    } catch (err) {
      console.error('Erro ao carregar dados do repositório:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & seed check
  useEffect(() => {
    const init = async () => {
      await seedDatabase(false);
      await refreshData();
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsServerAIOnline(Boolean(data.aiAvailable));
        }
      } catch {
        setIsServerAIOnline(false);
      }
    };
    init();

    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('recruitai_storage_change', handleStorageChange);
    return () => window.removeEventListener('recruitai_storage_change', handleStorageChange);
  }, [refreshData]);

  // Candidate Actions
  const createCandidate = async (candidate: Candidate, overrideDuplicate = false) => {
    if (settings.enableDuplicateDetection && !overrideDuplicate) {
      const dupCheck = checkDuplicateCandidate(candidate, candidates, settings.duplicateSimilarityThreshold);
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          isDuplicate: true,
          reason: dupCheck.reason,
        };
      }
    }

    await storageService.candidates.create(candidate);
    await storageService.logAudit('CANDIDATE_CREATED', 'candidate', `Candidato cadastrado: ${candidate.name}`, candidate.id);
    showToast('success', 'Candidato Cadastrado', `${candidate.name} foi adicionado ao banco de talentos.`);
    
    // Auto matching if enabled
    if (settings.autoMatchingOnUpload && jobs.length > 0) {
      for (const job of jobs.filter((j) => j.status === 'aberta')) {
        const ranking = calculateCandidateMatch(candidate, job);
        if (ranking.score >= 50) {
          await storageService.applications.create({
            id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            candidateId: candidate.id,
            jobId: job.id,
            stage: 'triagem',
            appliedAt: new Date().toISOString(),
            stageUpdatedAt: new Date().toISOString(),
            score: ranking.score,
            rankingResult: ranking,
            notes: `Triagem automática por compatibilidade (${ranking.score}%).`,
          });
        }
      }
    }

    await refreshData();
    return { success: true };
  };

  const updateCandidate = async (id: string, data: Partial<Candidate>) => {
    await storageService.candidates.update(id, data);
    await storageService.logAudit('CANDIDATE_UPDATED', 'candidate', `Candidato atualizado: ${data.name || id}`, id);
    showToast('success', 'Atualizado', 'Dados do candidato foram atualizados com sucesso.');
    await refreshData();
  };

  const deleteCandidate = async (id: string) => {
    const cand = candidates.find((c) => c.id === id);
    await storageService.candidates.delete(id);
    // Also delete linked applications and interviews (LGPD compliance)
    const apps = applications.filter((a) => a.candidateId === id);
    for (const app of apps) {
      await storageService.applications.delete(app.id);
    }
    const ints = interviews.filter((i) => i.candidateId === id);
    for (const interview of ints) {
      await storageService.interviews.delete(interview.id);
    }
    await storageService.logAudit('CANDIDATE_DELETED_LGPD', 'candidate', `Candidato removido (Direito LGPD): ${cand?.name || id}`, id);
    showToast('info', 'Candidato Excluído', 'Registro e histórico excluídos com conformidade LGPD.');
    await refreshData();
  };

  const importCandidatesBatch = async (newCandidates: Candidate[]) => {
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const cand of newCandidates) {
      try {
        if (settings.enableDuplicateDetection) {
          const dup = checkDuplicateCandidate(cand, candidates, settings.duplicateSimilarityThreshold);
          if (dup.isDuplicate) {
            duplicates++;
            continue;
          }
        }
        await storageService.candidates.create(cand);
        imported++;
      } catch {
        errors++;
      }
    }

    await storageService.logAudit('BATCH_IMPORT', 'system', `Importação em lote: ${imported} adicionados, ${duplicates} duplicados ignorados.`);
    await refreshData();
    return { imported, duplicates, errors };
  };

  // Job Actions
  const createJob = async (job: Job) => {
    const created = await storageService.jobs.create(job);
    await storageService.logAudit('JOB_CREATED', 'job', `Vaga aberta: ${job.title} (${job.department})`, job.id);
    showToast('success', 'Vaga Criada', `A vaga "${job.title}" está disponível.`);
    
    // Auto-calculate matching against all existing talent pool
    for (const cand of candidates) {
      const ranking = calculateCandidateMatch(cand, created);
      if (ranking.score >= 50) {
        await storageService.applications.create({
          id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          candidateId: cand.id,
          jobId: created.id,
          stage: 'novo',
          appliedAt: new Date().toISOString(),
          stageUpdatedAt: new Date().toISOString(),
          score: ranking.score,
          rankingResult: ranking,
        });
      }
    }

    await refreshData();
    return created;
  };

  const updateJob = async (id: string, data: Partial<Job>) => {
    await storageService.jobs.update(id, data);
    await storageService.logAudit('JOB_UPDATED', 'job', `Vaga atualizada: ${data.title || id}`, id);
    showToast('success', 'Vaga Atualizada', 'Informações da vaga salvas com sucesso.');
    await refreshData();
  };

  const deleteJob = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    await storageService.jobs.delete(id);
    await storageService.logAudit('JOB_DELETED', 'job', `Vaga encerrada e excluída: ${job?.title || id}`, id);
    showToast('info', 'Vaga Excluída', `Vaga "${job?.title}" removida do sistema.`);
    await refreshData();
  };

  const duplicateJob = async (id: string) => {
    const original = jobs.find((j) => j.id === id);
    if (!original) throw new Error('Vaga não encontrada');

    const duplicated: Job = {
      ...original,
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: `${original.title} (Cópia)`,
      status: 'rascunho',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await storageService.jobs.create(duplicated);
    await storageService.logAudit('JOB_DUPLICATED', 'job', `Vaga duplicada a partir de ${original.title}: ${duplicated.title}`, created.id);
    showToast('success', 'Vaga Duplicada', `Nova cópia criada como rascunho: "${duplicated.title}".`);
    await refreshData();
    return created;
  };

  // Pipeline & Application Actions
  const moveApplicationStage = async (candidateId: string, jobId: string, newStage: CandidateStatus) => {
    const app = applications.find((a) => a.candidateId === candidateId && a.jobId === jobId);
    const candidate = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);

    if (app) {
      await storageService.applications.update(app.id, {
        stage: newStage,
        stageUpdatedAt: new Date().toISOString(),
      });
    } else {
      const ranking = job && candidate ? calculateCandidateMatch(candidate, job) : undefined;
      await storageService.applications.create({
        id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        candidateId,
        jobId,
        stage: newStage,
        appliedAt: new Date().toISOString(),
        stageUpdatedAt: new Date().toISOString(),
        score: ranking?.score,
        rankingResult: ranking,
      });
    }

    // Also update candidate main status if applicable
    await storageService.candidates.update(candidateId, { status: newStage });
    await storageService.logAudit(
      'STAGE_MOVED',
      'application',
      `Candidato ${candidate?.name || candidateId} movido para "${newStage.toUpperCase()}" na vaga ${job?.title || jobId}`,
      candidateId
    );

    showToast('info', 'Etapa Atualizada', `Candidato avançou para a fase de ${newStage}.`);
    await refreshData();
  };

  const applyCandidateToJob = async (candidateId: string, jobId: string): Promise<Application> => {
    const existing = applications.find((a) => a.candidateId === candidateId && a.jobId === jobId);
    if (existing) {
      return existing;
    }

    const candidate = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);
    const ranking = candidate && job ? calculateCandidateMatch(candidate, job) : undefined;

    const newApp: Application = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      candidateId,
      jobId,
      stage: 'triagem',
      appliedAt: new Date().toISOString(),
      stageUpdatedAt: new Date().toISOString(),
      score: ranking?.score,
      rankingResult: ranking,
    };

    await storageService.applications.create(newApp);
    await storageService.logAudit('CANDIDATE_APPLIED', 'application', `Candidato ${candidate?.name} vinculado à vaga ${job?.title}`, candidateId);
    showToast('success', 'Candidatura Vinculada', `${candidate?.name} foi associado à vaga.`);
    await refreshData();
    return newApp;
  };

  const getJobRankings = (jobId: string): RankingResult[] => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    return candidates
      .map((cand) => calculateCandidateMatch(cand, job))
      .sort((a, b) => b.score - a.score);
  };

  const recalculateAllRankingsForJob = async (jobId: string): Promise<RankingResult[]> => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const rankings: RankingResult[] = [];
    for (const cand of candidates) {
      const result = calculateCandidateMatch(cand, job);
      rankings.push(result);

      // update application score if exists
      const app = applications.find((a) => a.candidateId === cand.id && a.jobId === jobId);
      if (app) {
        await storageService.applications.update(app.id, {
          score: result.score,
          rankingResult: result,
        });
      }
    }

    showToast('success', 'Ranking Recalculado', `Compatibilidade calculada para ${candidates.length} candidatos.`);
    await refreshData();
    return rankings.sort((a, b) => b.score - a.score);
  };

  // AI Intelligence Layer Actions
  const analyzeCandidateProfile = async (candidateId: string, jobId?: string): Promise<AICandidateAnalysis> => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error('Candidato não encontrado');
    }
    const job = jobId ? jobs.find((j) => j.id === jobId) : undefined;
    const forceLocal = !settings.enableAI || settings.aiMode === 'deterministic_only';

    const result = await analyzeCandidate(candidate, job, forceLocal);
    await storageService.logAudit(
      'AI_CANDIDATE_ANALYZED',
      'candidate',
      `Análise de perfil inteligente executada para ${candidate.name} (${result.provider})`,
      candidateId
    );
    return result;
  };

  const analyzeJobDescription = async (jobDraft: {
    title: string;
    description: string;
    department?: string;
  }): Promise<AIJobAnalysis> => {
    const forceLocal = !settings.enableAI || settings.aiMode === 'deterministic_only';
    const result = await analyzeJob(jobDraft, forceLocal);
    return result;
  };

  const generateInterviewScript = async (candidateId: string, jobId: string): Promise<AIInterviewScript> => {
    const candidate = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);
    if (!candidate || !job) {
      throw new Error('Candidato ou vaga inválidos para geração de roteiro');
    }

    const forceLocal = !settings.enableAI || settings.aiMode === 'deterministic_only';
    const script = await generateInterviewQuestions(candidate, job, forceLocal);

    await storageService.logAudit(
      'AI_INTERVIEW_GENERATED',
      'interview',
      `Roteiro de entrevista gerado para ${candidate.name} na vaga ${job.title}`,
      candidateId
    );
    return script;
  };

  const rankCandidatesWithAI = async (jobId: string): Promise<HybridRankingItem[]> => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const forceLocal = !settings.enableAI || settings.aiMode === 'deterministic_only';
    const weights = {
      matching: settings.matchingWeight || 0.7,
      ai: settings.aiWeight || 0.3,
    };

    const hybridResults = await runRankCandidatesHybrid(candidates, job, weights, forceLocal);

    await storageService.logAudit(
      'AI_HYBRID_RANKING',
      'job',
      `Ranking Híbrido (${Math.round(weights.matching * 100)}% Algoritmo + ${Math.round(weights.ai * 100)}% IA) calculado para vaga ${job.title}`,
      job.id
    );

    return hybridResults;
  };

  // Interview & Evaluation Actions
  const scheduleInterview = async (data: Omit<Interview, 'id' | 'createdAt'>) => {
    const interview: Interview = {
      ...data,
      id: 'int_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    await storageService.interviews.create(interview);
    
    // update stage to 'entrevista'
    await moveApplicationStage(data.candidateId, data.jobId, 'entrevista');
    showToast('success', 'Entrevista Agendada', `Entrevista marcada para ${new Date(data.scheduledAt).toLocaleDateString('pt-BR')}.`);
    await refreshData();
  };

  const updateInterview = async (id: string, data: Partial<Interview>) => {
    await storageService.interviews.update(id, data);
    showToast('success', 'Entrevista Atualizada', 'Informações da entrevista atualizadas.');
    await refreshData();
  };

  const deleteInterview = async (id: string) => {
    await storageService.interviews.delete(id);
    showToast('info', 'Entrevista Cancelada', 'Registro de entrevista removido.');
    await refreshData();
  };

  const addEvaluation = async (evalData: Omit<Evaluation, 'id' | 'createdAt'>) => {
    const evaluation: Evaluation = {
      ...evalData,
      id: 'eval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    await storageService.evaluations.create(evaluation);
    showToast('success', 'Avaliação Registrada', 'Parecer técnico/comportamental salvo.');
    await refreshData();
  };

  // System & Settings Actions
  const saveSettings = (newSettings: SystemSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('success', 'Configurações Salvas', 'Parâmetros do sistema foram atualizados.');
  };

  const reloadSeedData = async () => {
    setLoading(true);
    await seedDatabase(true);
    await refreshData();
    showToast('info', 'Dados de Demonstração', 'Base inicial de 10 candidatos e 3 vagas restaurada.');
  };

  const clearAllData = async () => {
    setLoading(true);
    await storageService.resetAllData();
    await refreshData();
    showToast('warning', 'Dados Limpos', 'Todos os dados locais foram apagados.');
  };

  const exportBackup = async () => {
    return storageService.exportAllData();
  };

  const importBackup = async (json: string) => {
    const res = await storageService.importData(json);
    if (res.success) {
      await refreshData();
      showToast('success', 'Backup Restaurado', res.message);
    } else {
      showToast('error', 'Falha na Restauração', res.message);
    }
    return res;
  };

  return (
    <AppContext.Provider
      value={{
        candidates,
        jobs,
        applications,
        interviews,
        evaluations,
        auditLogs,
        settings,
        loading,
        activeTab,
        setActiveTab,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedJobId,
        setSelectedJobId,
        editingJobId,
        setEditingJobId,
        selectedJobForRanking,
        setSelectedJobForRanking,
        createCandidate,
        updateCandidate,
        deleteCandidate,
        importCandidatesBatch,
        createJob,
        updateJob,
        deleteJob,
        duplicateJob,
        moveApplicationStage,
        applyCandidateToJob,
        getJobRankings,
        recalculateAllRankingsForJob,
        analyzeCandidateProfile,
        analyzeJobDescription,
        generateInterviewScript,
        rankCandidatesWithAI,
        isServerAIOnline,
        scheduleInterview,
        updateInterview,
        deleteInterview,
        addEvaluation,
        saveSettings,
        reloadSeedData,
        clearAllData,
        exportBackup,
        importBackup,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
