import {
  AICandidateAnalysis,
  Candidate,
  Job,
} from '../../types';
import {
  SanitizedCandidateSummary,
  SanitizedJobSummary,
  sanitizeCandidate,
  sanitizeJob,
} from './aiProvider';

/**
 * Local heuristic engine to analyze candidate profile against job specifications.
 * Ensures 100% offline capability, instant execution and adherence to responsible RH language.
 */
export function analyzeCandidateLocal(
  candidate: SanitizedCandidateSummary,
  job?: SanitizedJobSummary
): AICandidateAnalysis {
  const strengths: string[] = [];
  const attentionPoints: string[] = [];
  let score = 50;

  if (job) {
    // Experience check
    if (candidate.totalExperienceYears >= job.minExperienceYears) {
      strengths.push(
        `Tempo de experiência aderente (${candidate.totalExperienceYears} anos vs ${job.minExperienceYears} anos requeridos).`
      );
      score += 15;
    } else {
      const diff = job.minExperienceYears - candidate.totalExperienceYears;
      attentionPoints.push(
        `Experiência de ${candidate.totalExperienceYears} anos está ${diff} ano(s) abaixo do requisito ideal da vaga.`
      );
      score -= 10;
    }

    // Skills check
    const candSkillsLower = candidate.skills.map((s) => s.toLowerCase());
    const matchedRequired = job.requiredSkills.filter((req) =>
      candSkillsLower.some((cs) => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs))
    );
    const missingRequired = job.requiredSkills.filter(
      (req) => !matchedRequired.includes(req)
    );

    if (matchedRequired.length > 0) {
      strengths.push(
        `Domínio comprovado de requisitos fundamentais: ${matchedRequired.join(', ')}.`
      );
      score += Math.min(25, matchedRequired.length * 8);
    }

    if (missingRequired.length > 0) {
      attentionPoints.push(
        `Requisitos mandatórios a validar em entrevista técnica: ${missingRequired.join(', ')}.`
      );
      score -= Math.min(20, missingRequired.length * 6);
    }

    // Desirable skills check
    const matchedDesirable = job.desirableSkills.filter((des) =>
      candSkillsLower.some((cs) => cs.includes(des.toLowerCase()) || des.toLowerCase().includes(cs))
    );
    if (matchedDesirable.length > 0) {
      strengths.push(
        `Competências adicionais valorizadas identificadas: ${matchedDesirable.join(', ')}.`
      );
      score += Math.min(15, matchedDesirable.length * 5);
    }

    // Certifications & Education
    if (candidate.certifications.length > 0) {
      strengths.push(
        `Possui certificações complementares atestadas: ${candidate.certifications.join(', ')}.`
      );
      score += 10;
    }
  } else {
    // Standalone candidate assessment
    score = Math.min(95, 60 + candidate.totalExperienceYears * 3 + candidate.skills.length * 2);
    strengths.push(`Trajetória profissional sólida com ${candidate.totalExperienceYears} anos de vivência no mercado.`);
    if (candidate.skills.length > 0) {
      strengths.push(`Portfólio diversificado de competências: ${candidate.skills.slice(0, 5).join(', ')}.`);
    }
  }

  const boundedScore = Math.max(20, Math.min(98, Math.round(score)));

  // Generate targeted interview questions based on the gaps or strong points
  const questions: AICandidateAnalysis['recommendedInterviewQuestions'] = [];

  if (job && job.requiredSkills.length > 0) {
    questions.push({
      question: `Poderia detalhar um projeto complexo em que você aplicou ${job.requiredSkills[0]} na prática e quais foram os resultados mensuráveis?`,
      focus: 'tecnico',
      rationale: `Validar profundidade prática no requisito chave ${job.requiredSkills[0]}.`,
    });
  } else {
    questions.push({
      question: 'Descreva qual foi o maior desafio técnico ou operacional em seus últimos projetos e como superou.',
      focus: 'experiencia',
      rationale: 'Avaliar capacidade de resolução e resiliência.',
    });
  }

  questions.push({
    question: 'Como você organiza prioridades quando precisa atender entregas concorrentes com prazos apertados?',
    focus: 'comportamental',
    rationale: 'Avaliar maturidade na gestão de tempo e comunicação proativa.',
  });

  questions.push({
    question: 'Que ambiente de trabalho e estilo de liderança proporcionam o seu melhor desempenho profissional?',
    focus: 'fit',
    rationale: 'Verificar alinhamento cultural e expectativas com o time.',
  });

  return {
    candidateId: candidate.id,
    jobId: job?.id,
    summary: `Perfil com ${candidate.totalExperienceYears} anos de experiência acumulada e foco em ${candidate.skills.slice(0, 4).join(', ') || 'atuação técnica'}. Apresenta ${boundedScore >= 75 ? 'alta aderência' : boundedScore >= 50 ? 'compatibilidade moderada' : 'pontos relevantes de alinhamento'} para avaliação pela equipe de recrutamento.`,
    compatibilityScore: boundedScore,
    strengths,
    attentionPoints,
    suggestedRoleFit: candidate.recentRoles[0]?.role || (job?.title ? `Candidato para ${job.title}` : 'Especialista Técnico'),
    culturalFitNotes: 'Demonstra perfil com histórico estruturado. Recomenda-se aprofundar alinhamento com os valores de colaboração e agilidade da empresa.',
    recommendedInterviewQuestions: questions,
    generatedAt: new Date().toISOString(),
    provider: 'Local Intelligent Heuristic Engine',
  };
}

/**
 * Main candidate analyzer function.
 * Tries server-side Gemini API first; falls back gracefully to local heuristic analysis.
 */
export async function analyzeCandidate(
  candidate: Candidate,
  job?: Job,
  forceLocal = false
): Promise<AICandidateAnalysis> {
  const sanitizedCand = sanitizeCandidate(candidate);
  const sanitizedJob = job ? sanitizeJob(job) : undefined;

  if (forceLocal) {
    return analyzeCandidateLocal(sanitizedCand, sanitizedJob);
  }

  try {
    const res = await fetch('/api/ai/analyze-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate: sanitizedCand,
        job: sanitizedJob,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.summary) {
      return {
        ...data,
        provider: 'Gemini 2.5 Flash Server',
      };
    }
    throw new Error('Invalid response structure from server AI');
  } catch (error) {
    // Transparent, graceful fallback to local heuristic engine
    const localResult = analyzeCandidateLocal(sanitizedCand, sanitizedJob);
    return {
      ...localResult,
      provider: 'Local Engine (Modo Offline / Fallback Seguro)',
    };
  }
}
