/**
 * matching-api.ts
 * API calls for the scholarship matching system.
 */

import { apiGet, apiPost } from './api-client';
import type { Scholarship } from './scholarship-api';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface MatchCriteria {
  gpa?: number;
  major?: string;
  degreeLevel?: 'high_school' | 'bachelor' | 'master' | 'doctorate' | 'postdoc';
  nationality?: string;
  currentCountry?: string;
  languages?: Array<{
    language: string;
    proficiencyLevel: string;
  }>;
}

export interface ScholarshipMatch {
  scholarship: Pick<
    Scholarship,
    'id' | 'title' | 'amount' | 'currency' | 'type' | 'applicationDeadline' | 'targetCountries' | 'level'
  > & {
    provider?: { name: string; logoUrl?: string | null } | null;
  };
  matchScore: number;
  criteriaMet: string[];
  criteriaMissing: string[];
  recommendations: string;
}

export interface MatchResultsResponse {
  matches: ScholarshipMatch[];
  totalMatched: number;
  criteriaUsed: MatchCriteria;
}

export interface MatchHistoryEntry {
  id: string;
  searchCriteria: MatchCriteria;
  resultsCount: number;
  createdAt: string;
}

export interface MatchHistoryResponse {
  data: MatchHistoryEntry[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────
// API functions
// ─────────────────────────────────────────

/**
 * Run matching for the authenticated user.
 * Optionally pass criteria to override profile data.
 * POST /api/scholarships/match
 */
export async function performMatching(
  criteria: MatchCriteria = {}
): Promise<MatchResultsResponse> {
  // Convert camelCase to snake_case for backend
  const payload: Record<string, unknown> = {};
  if (criteria.gpa != null) payload.gpa = criteria.gpa;
  if (criteria.major) payload.major = criteria.major;
  if (criteria.degreeLevel) payload.degree_level = criteria.degreeLevel;
  if (criteria.nationality) payload.nationality = criteria.nationality;
  if (criteria.currentCountry) payload.current_country = criteria.currentCountry;
  if (criteria.languages) {
    payload.languages = criteria.languages.map(l => ({
      language: l.language,
      proficiency_level: l.proficiencyLevel,
    }));
  }

  const raw = await apiPost<{
    matches: Array<{
      scholarship: Record<string, unknown>;
      match_score: number;
      criteria_met: string[];
      criteria_missing: string[];
      recommendations: string;
    }>;
    total_matched: number;
    criteria_used: Record<string, unknown>;
  }>('/scholarships/match', payload);

  // Normalize response keys
  return {
    matches: raw.matches.map(m => ({
      scholarship: m.scholarship as unknown as ScholarshipMatch['scholarship'],
      matchScore: m.match_score,
      criteriaMet: m.criteria_met,
      criteriaMissing: m.criteria_missing,
      recommendations: m.recommendations,
    })),
    totalMatched: raw.total_matched,
    criteriaUsed: criteria,
  };
}

/**
 * Get user's past matching searches.
 * GET /api/scholarships/matches/history
 */
export async function getMatchHistory(
  page = 1,
  perPage = 10
): Promise<MatchHistoryResponse> {
  return apiGet<MatchHistoryResponse>(
    `/scholarships/matches/history?page=${page}&per_page=${perPage}`
  );
}
