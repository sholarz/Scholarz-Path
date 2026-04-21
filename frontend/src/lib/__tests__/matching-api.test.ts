import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
}));

vi.mock('../api-client', () => ({
  apiGet: vi.fn(),
  apiPost: apiPostMock,
}));

import { performMatching } from '../matching-api';

describe('matching-api', () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it('normalizes matching response and usage metadata', async () => {
    apiPostMock.mockResolvedValueOnce({
      matches: [
        {
          scholarship: {
            id: 'sch-1',
            title: 'Merit Scholarship',
            application_deadline: '2026-08-20',
            level: 'bachelor',
            target_countries: ['ID'],
          },
          match_score: 88.5,
          score_breakdown: {
            gpa: { points: 20, max: 20, met: true, reason: 'GPA requirement met' },
          },
          criteria_met: ['GPA requirement met'],
          criteria_missing: [],
          recommendations: 'Excellent match',
        },
      ],
      total_matched: 1,
      criteria_used: { gpa: 3.6 },
      usage: {
        is_premium: false,
        daily_limit: 1,
        used_today: 1,
        remaining_today: 0,
        result_limit: 3,
      },
      missing_profile_fields: ['nationality'],
    });

    const result = await performMatching({
      gpa: 3.6,
      degreeLevel: 'bachelor',
      currentCountry: 'ID',
      languages: [{ language: 'English', proficiencyLevel: 'advanced' }],
    });

    expect(apiPostMock).toHaveBeenCalledWith('/scholarships/match', {
      gpa: 3.6,
      degree_level: 'bachelor',
      current_country: 'ID',
      languages: [{ language: 'English', proficiency_level: 'advanced' }],
    });

    expect(result.totalMatched).toBe(1);
    expect(result.matches[0].matchScore).toBe(88.5);
    expect(result.matches[0].scoreBreakdown?.gpa.met).toBe(true);
    expect(result.usage?.dailyLimit).toBe(1);
    expect(result.missingProfileFields).toEqual(['nationality']);
  });
});
