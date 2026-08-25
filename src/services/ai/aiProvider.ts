import {
  Candidate,
  Job,
  AICandidateAnalysis,
  AIJobAnalysis,
  AIInterviewScript,
  HybridRankingItem,
} from '../../types';

export interface SanitizedCandidateSummary {
  id: string;
  name: string;
  totalExperienceYears: number;
  skills: string[];
  educationLevels: string[];
  certifications: string[];
  languages: string[];
  recentRoles: { role: string; years: number }[];
}

export interface SanitizedJobSummary {
  id: string;
  title: string;
  department: string;
  minExperienceYears: number;
  minEducationLevel: string;
  requiredSkills: string[];
  desirableSkills: string[];
  requiredCertifications: string[];
  desirableCertifications: string[];
  languages: string[];
  customCriteria: string[];
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  analyzeCandidate(
    candidate: SanitizedCandidateSummary,
    job?: SanitizedJobSummary
  ): Promise<AICandidateAnalysis>;
  analyzeJob(jobDraft: {
    title: string;
    description: string;
    department?: string;
  }): Promise<AIJobAnalysis>;
  generateInterviewQuestions(
    candidate: SanitizedCandidateSummary,
    job: SanitizedJobSummary
  ): Promise<AIInterviewScript>;
  rankCandidatesHybrid(
    candidates: SanitizedCandidateSummary[],
    job: SanitizedJobSummary,
    deterministicScores: Record<string, number>,
    weights?: { matching: number; ai: number }
  ): Promise<HybridRankingItem[]>;
}

/**
 * Sanitizes candidate data to comply strictly with LGPD and reduce token usage.
 * NEVER sends CPF, phone, email, full address or full CV text.
 */
export function sanitizeCandidate(candidate: Candidate): SanitizedCandidateSummary {
  return {
    id: candidate.id,
    name: candidate.name,
    totalExperienceYears: candidate.totalExperienceYears || 0,
    skills: (candidate.skills || []).map((s) => s.name),
    educationLevels: (candidate.education || []).map((e) => `${e.course} (${e.level})`),
    certifications: (candidate.certifications || []).map((c) => c.name),
    languages: candidate.languages || [],
    recentRoles: (candidate.experiences || []).slice(0, 3).map((e) => ({
      role: e.role,
      years: e.years,
    })),
  };
}

/**
 * Sanitizes job data for AI processing.
 */
export function sanitizeJob(job: Job): SanitizedJobSummary {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    minExperienceYears: job.minExperienceYears,
    minEducationLevel: job.minEducationLevel,
    requiredSkills: job.requiredSkills || [],
    desirableSkills: job.desirableSkills || [],
    requiredCertifications: job.requiredCertifications || [],
    desirableCertifications: job.desirableCertifications || [],
    languages: job.languages || [],
    customCriteria: (job.customCriteria || []).map((c) => `${c.title} (${c.type})`),
  };
}
