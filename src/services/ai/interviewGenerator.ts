import { Candidate, AIInterviewScript, AIInterviewQuestionItem, Job } from '../../types';
import { sanitizeCandidate, sanitizeJob } from './aiProvider';

/**
 * Local generator for structured interview scripts.
 */
export function generateInterviewQuestionsLocal(
  candidate: Candidate,
  job: Job
): AIInterviewScript {
  const candSkillsLower = candidate.skills.map((s) => s.name.toLowerCase());
  const missingRequired = job.requiredSkills.filter(
    (req) => !candSkillsLower.some((cs) => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs))
  );
  const matchedRequired = job.requiredSkills.filter(
    (req) => candSkillsLower.some((cs) => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs))
  );

  const questions: AIInterviewQuestionItem[] = [];

  // Technical Questions
  if (matchedRequired.length > 0) {
    questions.push({
      id: 'q_tech_1',
      category: 'tecnica',
      question: `Observamos em seu histórico sólida experiência com ${matchedRequired[0]}. Como você costuma estruturar a arquitetura e garantir a escalabilidade/qualidade de código usando essa tecnologia?`,
      expectedAnswerHint: `Espera-se explicação clara de boas práticas, padrões de projeto e tratamento de erros no ecossistema ${matchedRequired[0]}.`,
      weight: 25,
    });
  }

  if (missingRequired.length > 0) {
    questions.push({
      id: 'q_tech_gap',
      category: 'tecnica',
      question: `A vaga exige proficiência em ${missingRequired[0]}. Você já teve contato prévio ou projetos correlatos nessa ferramenta? Como é sua curva de aprendizado para novas tecnologias?`,
      expectedAnswerHint: `Avaliar honestidade intelectual, vontade de aprender e capacidade de transferir conhecimentos de ferramentas correlatas.`,
      weight: 20,
    });
  } else {
    questions.push({
      id: 'q_tech_general',
      category: 'tecnica',
      question: `Poderia nos contar sobre um bug crítico ou gargalo de desempenho que você precisou investigar e solucionar recentemente? Qual foi sua metodologia de diagnóstico?`,
      expectedAnswerHint: `Demonstrar raciocínio analítico estruturado e uso eficiente de métricas/logs.`,
      weight: 20,
    });
  }

  // Behavioral & Conflict
  questions.push({
    id: 'q_behav_1',
    category: 'comportamental',
    question: `Conte-nos sobre uma ocasião em que você discordou tecnicamente ou estrategicamente de uma decisão da liderança ou de um colega. Como conduziu a conversa e qual foi o desfecho?`,
    expectedAnswerHint: `Procurar maturidade emocional, capacidade de argumentar com dados sem hostilidade e compromisso com o resultado coletivo.`,
    weight: 20,
  });

  // Problem Solving
  questions.push({
    id: 'q_solve_1',
    category: 'resolucao_problemas',
    question: `Imagine que no meio de uma entrega prioritária para esta vaga (${job.title}), um requisito fundamental mude drasticamente a 3 dias do prazo final. Como você reagiria e articularia com o time?`,
    expectedAnswerHint: `Avaliar adaptação à mudança, transparência com stakeholders e habilidade de renegociar escopo viável.`,
    weight: 20,
  });

  // Cultural Fit
  questions.push({
    id: 'q_cult_1',
    category: 'cultura',
    question: `O que mais te chamou a atenção na oportunidade em nosso time e como você enxerga a evolução da sua carreira conosco nos próximos 2 anos?`,
    expectedAnswerHint: `Avaliar motivação intrínseca, pesquisa prévia sobre a empresa e ambições alinhadas ao estágio do departamento ${job.department}.`,
    weight: 15,
  });

  return {
    candidateId: candidate.id,
    jobId: job.id,
    candidateName: candidate.name,
    jobTitle: job.title,
    overallStrategy: `Roteiro focado em testar a profundidade prática nas tecnologias dominadas (${matchedRequired.join(', ') || 'geral'}), investigar a flexibilidade para absorver ${missingRequired.join(', ') || 'novos requisitos'} e medir alinhamento cultural com o time de ${job.department}.`,
    questions,
    evaluationRubric: [
      {
        criterion: 'Domínio Técnico & Profundidade',
        maxScore: 5,
        description: 'Capacidade de explicar conceitos avançados, fundamentar decisões e demonstrar domínio real.',
      },
      {
        criterion: 'Resolução de Problemas & Raciocínio',
        maxScore: 5,
        description: 'Estruturação lógica, gestão de imprevistos e tomada de decisão sob pressão.',
      },
      {
        criterion: 'Comunicação & Clareza',
        maxScore: 5,
        description: 'Articulação de ideias, concisão, escuta ativa e facilidade de diálogo.',
      },
      {
        criterion: 'Fit Cultural & Alinhamento de Valores',
        maxScore: 5,
        description: 'Espírito de equipe, ética, adaptabilidade e motivação com a missão da empresa.',
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Main interview script generator. Calls backend or uses local generator.
 */
export async function generateInterviewQuestions(
  candidate: Candidate,
  job: Job,
  forceLocal = false
): Promise<AIInterviewScript> {
  if (forceLocal) {
    return generateInterviewQuestionsLocal(candidate, job);
  }

  try {
    const sanitizedCand = sanitizeCandidate(candidate);
    const sanitizedJob = sanitizeJob(job);

    const res = await fetch('/api/ai/generate-interview', {
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

    const data: AIInterviewScript = await res.json();
    if (data && data.questions && data.questions.length > 0) {
      return data;
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    return generateInterviewQuestionsLocal(candidate, job);
  }
}
