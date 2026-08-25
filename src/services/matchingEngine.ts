import {
  Candidate,
  Job,
  RankingResult,
  ScoreBreakdown,
  CriterionMatchDetail,
  EducationLevel,
} from '../types';
import { normalizeText } from './candidateParser';

const EDUCATION_HIERARCHY: Record<EducationLevel, number> = {
  fundamental: 1,
  ensino_medio: 2,
  tecnico: 3,
  graduacao: 4,
  pos_graduacao: 5,
  mestrado: 6,
  doutorado: 7,
};

export function calculateCandidateMatch(candidate: Candidate, job: Job): RankingResult {
  const weights = job.weights || {
    experience: 30,
    skills: 30,
    education: 15,
    certifications: 10,
    languages: 5,
    customCriteria: 10,
  };

  const totalWeight =
    weights.experience +
    weights.skills +
    weights.education +
    weights.certifications +
    weights.languages +
    weights.customCriteria || 100;

  const mandatoryCriteria: CriterionMatchDetail[] = [];
  const desirableCriteria: CriterionMatchDetail[] = [];
  const strengths: string[] = [];
  const attentionPoints: string[] = [];

  const candSkillsNorm = candidate.skills.map((s) => normalizeText(s.name));
  const candRawNorm = normalizeText(candidate.rawText || '');
  const candCertsNorm = candidate.certifications.map((c) => normalizeText(c.name));
  const candLangsNorm = candidate.languages.map((l) => normalizeText(l));

  // Helper to check if text contains keyword
  const containsKeyword = (keyword: string): boolean => {
    const norm = normalizeText(keyword);
    if (!norm) return false;
    if (candSkillsNorm.some((s) => s.includes(norm) || norm.includes(s))) return true;
    if (candCertsNorm.some((c) => c.includes(norm) || norm.includes(c))) return true;
    if (candLangsNorm.some((l) => l.includes(norm) || norm.includes(l))) return true;
    return candRawNorm.includes(norm);
  };

  // 1. EXPERIENCE MATCH (0 - 100)
  let experienceScore = 100;
  const minYears = job.minExperienceYears || 0;
  const candYears = candidate.totalExperienceYears || 0;

  if (minYears > 0) {
    if (candYears >= minYears) {
      experienceScore = 100;
      strengths.push(`Experiência comprovada de ${candYears} anos (mínimo exigido: ${minYears} anos).`);
      mandatoryCriteria.push({
        criterion: `Experiência mínima de ${minYears} anos`,
        type: 'obrigatorio',
        met: true,
        details: `Candidato possui ${candYears} anos`,
      });
    } else {
      experienceScore = Math.max(0, Math.round((candYears / minYears) * 80));
      attentionPoints.push(`Possui ${candYears} anos de experiência (vaga solicita ${minYears} anos).`);
      mandatoryCriteria.push({
        criterion: `Experiência mínima de ${minYears} anos`,
        type: 'obrigatorio',
        met: false,
        details: `Candidato possui ${candYears} anos (abaixo do requisito)`,
      });
    }
  } else {
    experienceScore = 100;
    if (candYears > 0) {
      strengths.push(`${candYears} anos de experiência acumulada.`);
    }
  }

  // 2. EDUCATION MATCH (0 - 100)
  let educationScore = 100;
  const jobMinLevel = job.minEducationLevel || 'ensino_medio';
  const jobRank = EDUCATION_HIERARCHY[jobMinLevel] || 2;

  let candMaxRank = 0;
  let candTopEduLabel = 'Não informada';

  for (const edu of candidate.education) {
    const rank = EDUCATION_HIERARCHY[edu.level] || 1;
    if (rank > candMaxRank) {
      candMaxRank = rank;
      candTopEduLabel = `${edu.course} (${formatEducationLevel(edu.level)})`;
    }
  }

  if (candMaxRank >= jobRank) {
    educationScore = 100;
    strengths.push(`Formação acadêmica compatível: ${candTopEduLabel}.`);
    mandatoryCriteria.push({
      criterion: `Formação mínima: ${formatEducationLevel(jobMinLevel)}`,
      type: 'obrigatorio',
      met: true,
      details: candTopEduLabel,
    });
  } else {
    educationScore = Math.max(20, Math.round((candMaxRank / jobRank) * 70));
    attentionPoints.push(`Formação acadêmica (${candTopEduLabel}) abaixo do recomendado (${formatEducationLevel(jobMinLevel)}).`);
    mandatoryCriteria.push({
      criterion: `Formação mínima: ${formatEducationLevel(jobMinLevel)}`,
      type: 'obrigatorio',
      met: false,
      details: `Possui ${candTopEduLabel}`,
    });
  }

  // 3. SKILLS MATCH (Required + Desirable) (0 - 100)
  let skillsScore = 100;
  const reqSkills = job.requiredSkills || [];
  const desSkills = job.desirableSkills || [];

  let reqSkillsMet = 0;
  for (const skill of reqSkills) {
    const met = containsKeyword(skill);
    if (met) {
      reqSkillsMet++;
      strengths.push(`Habilidade obrigatória identificada: ${skill}.`);
    } else {
      attentionPoints.push(`Habilidade obrigatória não identificada: ${skill}.`);
    }
    mandatoryCriteria.push({
      criterion: `Habilidade obrigatória: ${skill}`,
      type: 'obrigatorio',
      met,
    });
  }

  let desSkillsMet = 0;
  for (const skill of desSkills) {
    const met = containsKeyword(skill);
    if (met) {
      desSkillsMet++;
      strengths.push(`Habilidade desejável identificada: ${skill}.`);
    }
    desirableCriteria.push({
      criterion: `Habilidade desejável: ${skill}`,
      type: 'desejavel',
      met,
    });
  }

  const reqSkillRatio = reqSkills.length > 0 ? reqSkillsMet / reqSkills.length : 1;
  const desSkillRatio = desSkills.length > 0 ? desSkillsMet / desSkills.length : 1;

  if (reqSkills.length > 0 && desSkills.length > 0) {
    skillsScore = Math.round(reqSkillRatio * 75 + desSkillRatio * 25);
  } else if (reqSkills.length > 0) {
    skillsScore = Math.round(reqSkillRatio * 100);
  } else if (desSkills.length > 0) {
    skillsScore = Math.round(desSkillRatio * 100);
  } else {
    skillsScore = 100;
  }

  // 4. CERTIFICATIONS MATCH (0 - 100)
  let certsScore = 100;
  const reqCerts = job.requiredCertifications || [];
  const desCerts = job.desirableCertifications || [];

  let reqCertsMet = 0;
  for (const cert of reqCerts) {
    const met = containsKeyword(cert);
    if (met) {
      reqCertsMet++;
      strengths.push(`Certificação obrigatória encontrada: ${cert}.`);
    } else {
      attentionPoints.push(`Certificação obrigatória não encontrada: ${cert}.`);
    }
    mandatoryCriteria.push({
      criterion: `Certificação obrigatória: ${cert}`,
      type: 'obrigatorio',
      met,
    });
  }

  let desCertsMet = 0;
  for (const cert of desCerts) {
    const met = containsKeyword(cert);
    if (met) {
      desCertsMet++;
      strengths.push(`Certificação desejável encontrada: ${cert}.`);
    }
    desirableCriteria.push({
      criterion: `Certificação desejável: ${cert}`,
      type: 'desejavel',
      met,
    });
  }

  if (reqCerts.length > 0 || desCerts.length > 0) {
    const reqRatio = reqCerts.length > 0 ? reqCertsMet / reqCerts.length : 1;
    const desRatio = desCerts.length > 0 ? desCertsMet / desCerts.length : 1;
    certsScore = reqCerts.length > 0 ? Math.round(reqRatio * 80 + desRatio * 20) : Math.round(desRatio * 100);
  } else {
    certsScore = 100;
  }

  // 5. LANGUAGES MATCH (0 - 100)
  let languagesScore = 100;
  const reqLangs = job.languages || [];
  let langsMet = 0;

  for (const lang of reqLangs) {
    const met = containsKeyword(lang);
    if (met) {
      langsMet++;
      strengths.push(`Idioma identificado: ${lang}.`);
    } else {
      attentionPoints.push(`Idioma ${lang} não claramente mencionado no currículo.`);
    }
    desirableCriteria.push({
      criterion: `Idioma: ${lang}`,
      type: 'desejavel',
      met,
    });
  }

  if (reqLangs.length > 0) {
    languagesScore = Math.round((langsMet / reqLangs.length) * 100);
  } else {
    languagesScore = 100;
  }

  // 6. CUSTOM CRITERIA MATCH (0 - 100)
  let customScore = 100;
  const customList = job.customCriteria || [];
  let customMet = 0;

  for (const crit of customList) {
    const met = containsKeyword(crit.title);
    if (crit.type === 'obrigatorio') {
      if (met) {
        customMet++;
        strengths.push(`Critério específico atendido: ${crit.title}.`);
      } else {
        attentionPoints.push(`Critério obrigatório não atendido: ${crit.title}.`);
      }
      mandatoryCriteria.push({
        criterion: crit.title,
        type: 'obrigatorio',
        met,
        details: crit.description,
      });
    } else {
      if (met) {
        customMet++;
        strengths.push(`Critério adicional atendido: ${crit.title}.`);
      }
      desirableCriteria.push({
        criterion: crit.title,
        type: 'desejavel',
        met,
        details: crit.description,
      });
    }
  }

  if (customList.length > 0) {
    customScore = Math.round((customMet / customList.length) * 100);
  } else {
    customScore = 100;
  }

  // 7. WEIGHTED OVERALL SCORE
  const weightedScore =
    (experienceScore * weights.experience +
      skillsScore * weights.skills +
      educationScore * weights.education +
      certsScore * weights.certifications +
      languagesScore * weights.languages +
      customScore * weights.customCriteria) /
    totalWeight;

  const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  // Check if all mandatory criteria are met
  const allMandatoryMet = mandatoryCriteria.every((c) => c.met);

  // Generate objective summary
  const summary = `Candidato obteve pontuação calculada de ${finalScore}%. ${
    allMandatoryMet
      ? 'Atende a todos os critérios obrigatórios estabelecidos pelo RH.'
      : 'Possui pendências em requisitos obrigatórios definidos para a vaga.'
  } ${strengths.length} pontos fortes mapeados e ${attentionPoints.length} pontos de atenção.`;

  const breakdown: ScoreBreakdown = {
    experienceScore,
    skillsScore,
    educationScore,
    certificationsScore: certsScore,
    languagesScore,
    customScore,
  };

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    jobId: job.id,
    jobTitle: job.title,
    score: finalScore,
    mandatoryMet: allMandatoryMet,
    mandatoryCriteria,
    desirableCriteria,
    breakdown,
    strengths,
    attentionPoints,
    summary,
    calculatedAt: new Date().toISOString(),
  };
}

export function rankCandidatesForJob(
  candidates: Candidate[],
  job: Job
): {
  candidate: Candidate;
  score: number;
  mandatoryMet: boolean;
  breakdown: ScoreBreakdown;
  strengths: string[];
  attentionPoints: string[];
  summary: string;
}[] {
  return candidates
    .map((candidate) => {
      const match = calculateCandidateMatch(candidate, job);
      return {
        candidate,
        score: match.score,
        mandatoryMet: match.mandatoryMet,
        breakdown: match.breakdown,
        strengths: match.strengths,
        attentionPoints: match.attentionPoints,
        summary: match.summary,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function formatEducationLevel(level: EducationLevel | string): string {
  const map: Record<string, string> = {
    fundamental: 'Ensino Fundamental',
    ensino_medio: 'Ensino Médio',
    tecnico: 'Ensino Técnico',
    graduacao: 'Graduação Superior',
    pos_graduacao: 'Pós-Graduação / MBA',
    mestrado: 'Mestrado',
    doutorado: 'Doutorado',
  };
  return map[level] || level;
}
