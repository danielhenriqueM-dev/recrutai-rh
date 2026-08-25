export type CandidateStatus =
  | 'novo'
  | 'triagem'
  | 'pre_selecionado'
  | 'entrevista'
  | 'teste'
  | 'aprovado'
  | 'contratado'
  | 'reprovado';

export interface CandidateSkill {
  id: string;
  name: string;
  level?: 'iniciante' | 'intermediario' | 'avancado' | 'especialista';
  category?: 'tecnica' | 'comportamental' | 'ferramenta' | 'idioma' | 'outro';
}

export interface CandidateExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  years: number;
  description: string;
}

export type EducationLevel =
  | 'fundamental'
  | 'ensino_medio'
  | 'tecnico'
  | 'graduacao'
  | 'pos_graduacao'
  | 'mestrado'
  | 'doutorado';

export interface CandidateEducation {
  id: string;
  level: EducationLevel;
  course: string;
  institution: string;
  completionYear?: number;
  status: 'completo' | 'em_andamento' | 'incompleto';
}

export interface CandidateCertification {
  id: string;
  name: string;
  issuer?: string;
  year?: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  education: CandidateEducation[];
  experiences: CandidateExperience[];
  skills: CandidateSkill[];
  certifications: CandidateCertification[];
  languages: string[];
  totalExperienceYears: number;
  rawText: string;
  resumeFileName?: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  notes?: string;
  duplicateWarning?: boolean;
  duplicateOfId?: string;
  contentHash?: string;
}

export type JobStatus = 'rascunho' | 'aberta' | 'pausada' | 'encerrada';
export type JobWorkplaceType = 'presencial' | 'remoto' | 'hibrido';

export interface JobCustomCriterion {
  id: string;
  title: string;
  type: 'obrigatorio' | 'desejavel';
  description?: string;
}

export interface MatchingWeights {
  experience: number;      // e.g. 30
  skills: number;          // e.g. 30
  education: number;       // e.g. 15
  certifications: number;  // e.g. 10
  languages: number;       // e.g. 5
  customCriteria: number;  // e.g. 10
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  workplaceType: JobWorkplaceType;
  salaryRange?: string;
  description: string;
  minExperienceYears: number;
  minEducationLevel: EducationLevel;
  requiredSkills: string[];
  desirableSkills: string[];
  requiredCertifications: string[];
  desirableCertifications: string[];
  languages: string[];
  customCriteria: JobCustomCriterion[];
  weights: MatchingWeights;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionMatchDetail {
  criterion: string;
  type: 'obrigatorio' | 'desejavel';
  met: boolean;
  matchedText?: string;
  details?: string;
}

export interface ScoreBreakdown {
  experienceScore: number;
  skillsScore: number;
  educationScore: number;
  certificationsScore: number;
  languagesScore: number;
  customScore: number;
}

export interface RankingResult {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  score: number; // 0-100
  mandatoryMet: boolean;
  mandatoryCriteria: CriterionMatchDetail[];
  desirableCriteria: CriterionMatchDetail[];
  breakdown: ScoreBreakdown;
  strengths: string[];
  attentionPoints: string[];
  summary: string;
  calculatedAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  stage: CandidateStatus;
  appliedAt: string;
  stageUpdatedAt: string;
  score?: number;
  rankingResult?: RankingResult;
  notes?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  applicationId?: string;
  scheduledAt: string;
  interviewer: string;
  type: 'presencial' | 'online' | 'telefone';
  status: 'agendada' | 'realizada' | 'cancelada';
  rating?: number; // 1 to 5
  feedback?: string;
  stage: string;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  jobId: string;
  evaluator: string;
  technicalScore: number; // 1-5
  behavioralScore: number; // 1-5
  overallScore: number; // 1-5
  comments: string;
  recommendation: 'fortemente_recomendado' | 'recomendado' | 'com_ressalvas' | 'nao_recomendado';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'candidate' | 'job' | 'application' | 'interview' | 'evaluation' | 'system';
  entityId?: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface SystemSettings {
  companyName: string;
  defaultWeights: MatchingWeights;
  autoMatchingOnUpload: boolean;
  lgpdRetentionDays: number;
  enableDuplicateDetection: boolean;
  duplicateSimilarityThreshold: number; // 0.8
  enableAI: boolean;
  aiMode: 'hybrid' | 'deterministic_only' | 'gemini_server';
  aiWeight: number; // e.g. 0.3 (30%)
  matchingWeight: number; // e.g. 0.7 (70%)
}

export interface AICandidateAnalysis {
  candidateId: string;
  jobId?: string;
  summary: string;
  compatibilityScore: number; // 0-100
  strengths: string[];
  attentionPoints: string[];
  suggestedRoleFit: string;
  culturalFitNotes: string;
  recommendedInterviewQuestions: {
    question: string;
    focus: 'tecnico' | 'comportamental' | 'experiencia' | 'fit';
    rationale: string;
  }[];
  generatedAt: string;
  provider: string;
}

export interface AIJobAnalysis {
  suggestedTitle?: string;
  suggestedRequiredSkills: string[];
  suggestedDesirableSkills: string[];
  suggestedWeights: MatchingWeights;
  keyInterviewFocusAreas: string[];
  clarityFeedback: string;
}

export interface AIInterviewQuestionItem {
  id: string;
  category: 'tecnica' | 'comportamental' | 'resolucao_problemas' | 'cultura';
  question: string;
  expectedAnswerHint: string;
  weight: number;
}

export interface AIInterviewScript {
  candidateId: string;
  jobId: string;
  candidateName: string;
  jobTitle: string;
  overallStrategy: string;
  questions: AIInterviewQuestionItem[];
  evaluationRubric: {
    criterion: string;
    maxScore: number;
    description: string;
  }[];
  generatedAt: string;
}

export interface HybridRankingItem {
  candidate: Candidate;
  matchingScore: number; // 0-100 (deterministic)
  aiScore: number;       // 0-100 (semantic)
  finalScore: number;    // hybrid combination (e.g. 70/30)
  strengths: string[];
  attentionPoints: string[];
  aiJustification: string;
  recommendationLevel: 'alta_compatibilidade' | 'boa_compatibilidade' | 'compatibilidade_moderada' | 'recomenda_avaliacao_humana';
}

export interface DuplicateMatch {
  isDuplicate: boolean;
  reasons: string[];
  confidence: number;
  existingCandidate?: Candidate;
}

export type AppSettings = SystemSettings & {
  autoAnonymizeRejected?: boolean;
};

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recrutador' | 'gestor';
}
