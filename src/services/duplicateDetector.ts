import { Candidate, DuplicateMatch } from '../types';
import { normalizeText } from './candidateParser';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number; // 0 to 1
  reason?: string;
  matchedCandidate?: Candidate;
}

export function checkForDuplicateCandidate(
  candidate: Candidate,
  existingCandidates: Candidate[]
): DuplicateMatch {
  const result = checkDuplicateCandidate(candidate, existingCandidates);
  return {
    isDuplicate: result.isDuplicate,
    confidence: result.confidence,
    reasons: result.reason ? [result.reason] : [],
    existingCandidate: result.matchedCandidate,
  };
}

export function checkDuplicateCandidate(
  newCandidate: Partial<Candidate>,
  existingCandidates: Candidate[],
  similarityThreshold = 0.85
): DuplicateCheckResult {
  const normNewName = normalizeText(newCandidate.name || '');
  const cleanNewEmail = (newCandidate.email || '').toLowerCase().trim();
  const cleanNewPhone = (newCandidate.phone || '').replace(/\D/g, '');
  const newHash = newCandidate.contentHash;

  for (const existing of existingCandidates) {
    // 1. Exact Email Match (High confidence)
    if (cleanNewEmail && existing.email && cleanNewEmail === existing.email.toLowerCase().trim()) {
      return {
        isDuplicate: true,
        confidence: 1.0,
        reason: `E-mail idêntico (${cleanNewEmail}) ao candidato já cadastrado: ${existing.name}`,
        matchedCandidate: existing,
      };
    }

    // 2. Exact Phone Match (if length >= 9)
    const cleanExistingPhone = (existing.phone || '').replace(/\D/g, '');
    if (cleanNewPhone.length >= 9 && cleanExistingPhone.length >= 9) {
      if (cleanNewPhone === cleanExistingPhone || cleanNewPhone.endsWith(cleanExistingPhone.slice(-8))) {
        return {
          isDuplicate: true,
          confidence: 0.95,
          reason: `Telefone correspondente (${existing.phone}) ao candidato: ${existing.name}`,
          matchedCandidate: existing,
        };
      }
    }

    // 3. Exact Content Hash
    if (newHash && existing.contentHash && newHash === existing.contentHash) {
      return {
        isDuplicate: true,
        confidence: 0.98,
        reason: `Conteúdo idêntico do currículo ao candidato já cadastrado: ${existing.name}`,
        matchedCandidate: existing,
      };
    }

    // 4. Name similarity (Levenshtein / Token similarity)
    const normExistingName = normalizeText(existing.name || '');
    if (normNewName && normExistingName) {
      const sim = calculateStringSimilarity(normNewName, normExistingName);
      if (sim >= similarityThreshold) {
        // Also check if city or education matches to strengthen suspicion
        const cityMatch = existing.city && newCandidate.city && normalizeText(existing.city) === normalizeText(newCandidate.city);
        return {
          isDuplicate: true,
          confidence: Math.round(sim * 100) / 100,
          reason: `Nome altamente similar (${Math.round(sim * 100)}%) ao candidato existente "${existing.name}"${cityMatch ? ' na mesma cidade' : ''}`,
          matchedCandidate: existing,
        };
      }
    }
  }

  return { isDuplicate: false, confidence: 0 };
}

export function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  // Jaccard similarity of word tokens
  const words1 = new Set(str1.split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.split(/\s+/).filter(Boolean));

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  const tokenScore = union > 0 ? intersection / union : 0;

  // If words match exactly (e.g. "João Carlos Silva" vs "Silva, João Carlos")
  if (tokenScore >= 0.8) return tokenScore;

  // Levenshtein distance
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  const levScore = 1 - distance / maxLen;

  return Math.max(tokenScore, levScore);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}
