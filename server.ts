import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return genAIClient;
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    serverTime: new Date().toISOString(),
  });
});

// AI Endpoint: Analyze Candidate Profile
app.post('/api/ai/analyze-candidate', async (req, res) => {
  try {
    const { candidate, job } = req.body;
    if (!candidate) {
      return res.status(400).json({ error: 'Candidate data is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const prompt = `
Você é um especialista em Recursos Humanos e Triagem de Talentos (RecruitAI RH).
Analise o resumo estruturado do candidato abaixo em relação aos requisitos da vaga (se fornecida).

Regras Éticas Mandatórias:
1. NUNCA utilize termos como "contratar automaticamente", "candidato definitivamente melhor" ou "candidato incapaz".
2. Utilize linguagem profissional: "maior compatibilidade", "pontos fortes", "recomenda-se avaliação humana".
3. Forneça uma análise objetiva, destacando competências técnicas comprovadas e pontos a investigar em entrevista.

Dados do Candidato:
${JSON.stringify(candidate, null, 2)}

Dados da Vaga:
${job ? JSON.stringify(job, null, 2) : 'Avaliação geral de perfil'}

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "summary": "Resumo executivo de 2 a 3 frases sobre o perfil e aderência",
  "compatibilityScore": 85, // número de 0 a 100
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "attentionPoints": ["Ponto a investigar 1", "Ponto a investigar 2"],
  "suggestedRoleFit": "Cargo ou especialidade mais alinhada",
  "culturalFitNotes": "Observações sobre maturidade profissional e fit",
  "recommendedInterviewQuestions": [
    {
      "question": "Texto da pergunta sugerida",
      "focus": "tecnico" | "comportamental" | "experiencia" | "fit",
      "rationale": "Por que fazer esta pergunta"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || '{}';
    const json = JSON.parse(text);
    return res.json({
      ...json,
      candidateId: candidate.id,
      jobId: job?.id,
      generatedAt: new Date().toISOString(),
      provider: 'Google Gemini 2.5 Flash',
    });
  } catch (error: any) {
    console.error('Erro na análise de candidato por IA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de IA' });
  }
});

// AI Endpoint: Analyze Job Requirements
app.post('/api/ai/analyze-job', async (req, res) => {
  try {
    const { title, description, department } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `
Como consultor sênior de RH, analise a seguinte descrição de vaga e sugira competências técnicas e comportamentais ideais para triagem automatizada.

Título: ${title}
Departamento: ${department || 'Não especificado'}
Descrição:
${description}

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "suggestedTitle": "Título sugerido otimizado para atração",
  "suggestedRequiredSkills": ["Skill 1", "Skill 2", "Skill 3"],
  "suggestedDesirableSkills": ["Skill diferencial 1", "Skill diferencial 2"],
  "suggestedWeights": {
    "experience": 30,
    "skills": 30,
    "education": 15,
    "certifications": 10,
    "languages": 5,
    "customCriteria": 10
  },
  "keyInterviewFocusAreas": ["Área de foco 1", "Área de foco 2", "Área de foco 3"],
  "clarityFeedback": "Feedback construtivo sobre a clareza e atratividade da descrição da vaga"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || '{}';
    const json = JSON.parse(text);
    return res.json(json);
  } catch (error: any) {
    console.error('Erro ao analisar vaga com IA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de IA' });
  }
});

// AI Endpoint: Generate Targeted Interview Script
app.post('/api/ai/generate-interview', async (req, res) => {
  try {
    const { candidate, job } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `
Você é um entrevistador técnico e comportamental sênior de RH.
Gere um roteiro de entrevista direcionado para o candidato abaixo na vaga especificada, focando em validar pontos fortes e aprofundar possíveis lacunas técnicas.

Candidato:
${JSON.stringify(candidate, null, 2)}

Vaga:
${JSON.stringify(job, null, 2)}

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "candidateId": "${candidate?.id || ''}",
  "jobId": "${job?.id || ''}",
  "candidateName": "${candidate?.name || ''}",
  "jobTitle": "${job?.title || ''}",
  "overallStrategy": "Estratégia recomendada para conduzir esta entrevista",
  "questions": [
    {
      "id": "q1",
      "category": "tecnica" | "comportamental" | "resolucao_problemas" | "cultura",
      "question": "Texto detalhado da pergunta",
      "expectedAnswerHint": "O que o entrevistador deve observar na resposta do candidato",
      "weight": 25
    }
  ],
  "evaluationRubric": [
    {
      "criterion": "Nome do critério (ex: Domínio de Arquitetura)",
      "maxScore": 5,
      "description": "Explicação do que representa a pontuação máxima"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text?.trim() || '{}';
    const json = JSON.parse(text);
    return res.json({
      ...json,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao gerar entrevista com IA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de IA' });
  }
});

// AI Endpoint: Batch Rank Candidates (Semantic Scoring)
app.post('/api/ai/rank-candidates', async (req, res) => {
  try {
    const { candidates, job, deterministicScores, weights } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `
Como especialista em triagem de RH, avalie a aderência semântica e qualitativa de cada um dos seguintes candidatos para a vaga.

Vaga:
${JSON.stringify(job, null, 2)}

Candidatos a avaliar:
${JSON.stringify(candidates, null, 2)}

Notas determinísticas calculadas:
${JSON.stringify(deterministicScores, null, 2)}

Para cada candidato, forneça uma pontuação qualitativa de IA (aiScore de 0 a 100) e uma justificativa concisa.
Responda ESTRITAMENTE em formato JSON com array de objetos:
[
  {
    "candidateId": "id_do_candidato",
    "aiScore": 85,
    "aiJustification": "Justificativa de 1 frase explicando a aderência qualitativa."
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || '[]';
    const json = JSON.parse(text);
    return res.json(json);
  } catch (error: any) {
    console.error('Erro no ranking em lote por IA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de IA' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RecruitAI RH Server rodando na porta ${PORT}`);
  });
}

startServer();
