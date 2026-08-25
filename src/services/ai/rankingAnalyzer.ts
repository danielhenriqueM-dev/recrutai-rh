import { Candidate, HybridRankingItem, Job } from '../../types';
import { calculateCandidateMatch } from '../matchingEngine';
import {
  SanitizedCandidateSummary,
  SanitizedJobSummary,
  sanitizeCandidate,
  sanitizeJob,
} from './aiProvider';
import { analyzeCandidateLocal } from './candidateAnalyzer';

/**
 * Calculates hybrid ranking locally combining deterministic score and heuristic semantic score.
 * Formula: finalScore = (matchingScore * 0.7) + (aiScore * 0.3)
 */
export function rankCandidatesHybridLocal(
  candidates: Candidate[],
  job: Job,
  weights = { matching: 0.7, ai: 0.3 }
): HybridRankingItem[] {
  const sanitizedJob = sanitizeJob(job);

  return candidates.map((cand) => {
    // 1. Calculate deterministic matching score (0-100)
    const matchResult = calculateCandidateMatch(cand, job);
    const matchingScore = matchResult.score;

    // 2. Calculate AI / Heuristic semantic score (0-100)
    const sanitizedCand = sanitizeCandidate(cand);
    const aiAnalysis = analyzeCandidateLocal(sanitizedCand, sanitizedJob);
    const aiScore = aiAnalysis.compatibilityScore;

    // 3. Apply hybrid formula
    const finalScore = Math.round(
      matchingScore * weights.matching + aiScore * weights.ai
    );

    let recommendationLevel: HybridRankingItem['recommendationLevel'] = 'compatibilidade_moderada';
    if (finalScore >= 80) {
      recommendationLevel = 'alta_compatibilidade';
    } else if (finalScore >= 65) {
      recommendationLevel = 'boa_compatibilidade';
    } else if (finalScore < 45) {
      recommendationLevel = 'recomenda_avaliacao_humana';
    }

    return {
      candidate: cand,
      matchingScore,
      aiScore,
      finalScore,
      strengths: matchResult.strengths,
      attentionPoints: matchResult.attentionPoints,
      aiJustification: aiAnalysis.summary,
      recommendationLevel,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Main Hybrid Ranking function.
 * Tries server-side batch analysis if available, otherwise executes local hybrid engine.
 */
export async function rankCandidatesHybrid(
  candidates: Candidate[],
  job: Job,
  weights = { matching: 0.7, ai: 0.3 },
  forceLocal = false
): Promise<HybridRankingItem[]> {
  if (forceLocal || candidates.length === 0) {
    return rankCandidatesHybridLocal(candidates, job, weights);
  }

  try {
    const sanitizedCandidates = candidates.map(sanitizeCandidate);
    const sanitizedJob = sanitizeJob(job);
    const deterministicScores: Record<string, number> = {};

    candidates.forEach((c) => {
      const match = calculateCandidateMatch(c, job);
      deterministicScores[c.id] = match.score;
    });

    const res = await fetch('/api/ai/rank-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidates: sanitizedCandidates,
        job: sanitizedJob,
        deterministicScores,
        weights,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data: { candidateId: string; aiScore: number; aiJustification: string }[] = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid format from server');
    }

    const aiScoreMap = new Map(data.map((d) => [d.candidateId, d]));

    return candidates.map((cand) => {
      const match = calculateCandidateMatch(cand, job);
      const matchingScore = match.score;
      const aiData = aiScoreMap.get(cand.id);
      const aiScore = aiData ? aiData.aiScore : matchingScore;
      const finalScore = Math.round(matchingScore * weights.matching + aiScore * weights.ai);

      let recommendationLevel: HybridRankingItem['recommendationLevel'] = 'compatibilidade_moderada';
      if (finalScore >= 80) recommendationLevel = 'alta_compatibilidade';
      else if (finalScore >= 65) recommendationLevel = 'boa_compatibilidade';
      else if (finalScore < 45) recommendationLevel = 'recomenda_avaliacao_humana';

      return {
        candidate: cand,
        matchingScore,
        aiScore,
        finalScore,
        strengths: match.strengths,
        attentionPoints: match.attentionPoints,
        aiJustification: aiData?.aiJustification || `Pontuação híbrida combinando aderência direta de requisitos (${matchingScore}%) e análise semântica (${aiScore}%).`,
        recommendationLevel,
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  } catch (err) {
    // Graceful fallback to deterministic + local heuristic hybrid
    return rankCandidatesHybridLocal(candidates, job, weights);
  }
}
