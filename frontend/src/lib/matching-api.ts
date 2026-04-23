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
  usage?: {
    usedToday: number;
    dailyLimit: number | null;
  };
}

interface ProfileMeResponse {
  profile?: {
    basic?: {
      nationality?: string | null;
      current_country?: string | null;
    };
    academic?: {
      gpa?: string | number | null;
      major?: string | null;
      field_of_study?: string | null;
      degree_level?: MatchCriteria['degreeLevel'] | null;
    };
  };
  languages?: Array<{
    language?: string | null;
    proficiency_level?: string | null;
  }>;
}

interface PreferencesResponse {
  fields_of_study?: string[] | null;
}

async function getProfileMatchCriteria(): Promise<MatchCriteria> {
  try {
    const [me, prefsWrapped] = await Promise.all([
      apiGet<ProfileMeResponse>('/profile/me'),
      apiGet<{ data?: PreferencesResponse } | PreferencesResponse>('/preferences').catch(() => ({} as PreferencesResponse)),
    ]);

    const prefs = (prefsWrapped as { data?: PreferencesResponse }).data ?? (prefsWrapped as PreferencesResponse);
    const academic = me.profile?.academic;
    const basic = me.profile?.basic;

    const profileCriteria: MatchCriteria = {};

    if (academic?.gpa != null && String(academic.gpa).trim() !== '') {
      const parsedGpa = Number(academic.gpa);
      if (!Number.isNaN(parsedGpa)) profileCriteria.gpa = parsedGpa;
    }

    profileCriteria.major =
      academic?.field_of_study?.trim() ||
      academic?.major?.trim() ||
      prefs.fields_of_study?.[0]?.trim() ||
      undefined;

    if (academic?.degree_level) profileCriteria.degreeLevel = academic.degree_level;
    if (basic?.nationality) profileCriteria.nationality = basic.nationality;
    if (basic?.current_country) profileCriteria.currentCountry = basic.current_country;

    const languages = (me.languages ?? [])
      .filter(l => l.language && l.proficiency_level)
      .map(l => ({
        language: l.language as string,
        proficiencyLevel: l.proficiency_level as string,
      }));

    if (languages.length > 0) {
      profileCriteria.languages = languages;
    }

    return profileCriteria;
  } catch {
    // Matching should still run even if profile hydration fails.
    return {};
  }
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
  const profileCriteria = await getProfileMatchCriteria();
  const mergedCriteria: MatchCriteria = { ...profileCriteria, ...criteria };

  // Convert camelCase to snake_case for backend
  const payload: Record<string, unknown> = {};
  if (mergedCriteria.gpa != null) payload.gpa = mergedCriteria.gpa;
  if (mergedCriteria.major) payload.major = mergedCriteria.major;
  if (mergedCriteria.degreeLevel) payload.degree_level = mergedCriteria.degreeLevel;
  if (mergedCriteria.nationality) payload.nationality = mergedCriteria.nationality;
  if (mergedCriteria.currentCountry) payload.current_country = mergedCriteria.currentCountry;
  if (mergedCriteria.languages) {
    payload.languages = mergedCriteria.languages.map(l => ({
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
    usage?: {
      used_today: number;
      daily_limit: number | null;
    };
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
    criteriaUsed: mergedCriteria,
    usage: raw.usage
      ? {
          usedToday: raw.usage.used_today,
          dailyLimit: raw.usage.daily_limit,
        }
      : undefined,
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
