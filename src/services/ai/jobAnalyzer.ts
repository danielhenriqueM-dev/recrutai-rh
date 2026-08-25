import { AIJobAnalysis, Job, MatchingWeights } from '../../types';
import { sanitizeJob } from './aiProvider';

/**
 * Local rule-based analyzer for job descriptions.
 * Extracts key technical terms, balances weights, and creates focus areas.
 */
export function analyzeJobLocal(jobDraft: {
  title: string;
  description: string;
  department?: string;
}): AIJobAnalysis {
  const text = `${jobDraft.title} ${jobDraft.description}`.toLowerCase();

  // Knowledge base of common skills & keywords in Portuguese/English
  const commonTech = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL',
    'Docker', 'AWS', 'Kubernetes', 'Git', 'Figma', 'UX/UI', 'Scrum',
    'Kanban', 'REST APIs', 'GraphQL', 'Tailwind', 'Next.js', 'C#', '.NET',
    'Excel', 'Power BI', 'Vendas', 'Negociação', 'Atendimento', 'Liderança',
  ];

  const detected: string[] = [];
  for (const tech of commonTech) {
    if (text.includes(tech.toLowerCase())) {
      detected.push(tech);
    }
  }

  // If none detected from list, add generic relevant skills based on title
  if (detected.length === 0) {
    if (text.includes('front') || text.includes('web')) {
      detected.push('React', 'TypeScript', 'CSS', 'Git');
    } else if (text.includes('back') || text.includes('dados') || text.includes('software')) {
      detected.push('Node.js', 'SQL', 'APIs REST', 'Git');
    } else {
      detected.push('Comunicação', 'Resolução de Problemas', 'Gestão de Tempo');
    }
  }

  const required = detected.slice(0, Math.min(4, Math.ceil(detected.length * 0.6)));
  const desirable = detected.slice(required.length);

  // Balanced default weights
  const suggestedWeights: MatchingWeights = {
    experience: 30,
    skills: 30,
    education: 15,
    certifications: 10,
    languages: 5,
    customCriteria: 10,
  };

  const clarityFeedback = jobDraft.description.length < 100
    ? 'A descrição está concisa. Recomenda-se detalhar as responsabilidades do dia a dia e o impacto esperado da posição para atrair candidatos mais qualificados.'
    : 'A descrição da vaga apresenta clareza e escopo bem delimitado para triagem automatizada.';

  return {
    suggestedTitle: jobDraft.title,
    suggestedRequiredSkills: required,
    suggestedDesirableSkills: desirable.length > 0 ? desirable : ['Boa Comunicação Interpessoal', 'Metodologias Ágeis'],
    suggestedWeights,
    keyInterviewFocusAreas: [
      'Domínio prático das competências técnicas essenciais',
      'Capacidade de adaptação a novos desafios e stack tecnológica',
      'Alinhamento com a cultura da equipe e ritmo de entregas',
    ],
    clarityFeedback,
  };
}

/**
 * Main job analyzer. Calls backend Gemini API with transparent local fallback.
 */
export async function analyzeJob(
  jobDraft: {
    title: string;
    description: string;
    department?: string;
  },
  forceLocal = false
): Promise<AIJobAnalysis> {
  if (forceLocal) {
    return analyzeJobLocal(jobDraft);
  }

  try {
    const res = await fetch('/api/ai/analyze-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobDraft),
    });

    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.suggestedRequiredSkills) {
      return data;
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    return analyzeJobLocal(jobDraft);
  }
}
