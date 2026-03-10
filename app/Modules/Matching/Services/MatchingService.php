<?php

namespace App\Modules\Matching\Services;

use App\Models\User;
use App\Models\Scholarship;
use App\Models\ScholarshipMatch;
use App\Models\MatchSearch;
use App\Modules\Matching\Engines\MatchingEngine;
use App\Modules\Matching\Engines\ScoringEngine;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class MatchingService
{
    public function __construct(
        private MatchingEngine $matchingEngine,
        private ScoringEngine $scoringEngine
    ) {}

    /**
     * Find matching scholarships for user with given criteria
     */
    public function findMatches(User $user, array $criteria): array
    {
        // Get active scholarships
        $scholarships = Scholarship::with(['provider'])
            ->where('status', 'active')
            ->where('application_deadline', '>', now())
            ->get();

        $matches = [];

        foreach ($scholarships as $scholarship) {
            $matchResult = $this->evaluateMatch($criteria, $scholarship);
            
            // Only include if match score is above threshold (e.g., 30%)
            if ($matchResult['match_score'] >= 30) {
                $matches[] = [
                    'scholarship' => [
                        'id' => $scholarship->id,
                        'title' => $scholarship->title,
                        'provider' => [
                            'name' => $scholarship->provider->name,
                            'logo_url' => $scholarship->provider->logo_url
                        ],
                        'amount' => $scholarship->amount,
                        'currency' => $scholarship->currency,
                        'type' => $scholarship->type,
                        'application_deadline' => $scholarship->application_deadline->toDateString(),
                        'target_countries' => $scholarship->target_countries,
                        'level' => $scholarship->level
                    ],
                    'match_score' => round($matchResult['match_score'], 1),
                    'criteria_met' => $matchResult['criteria_met'],
                    'criteria_missing' => $matchResult['criteria_missing'],
                    'recommendations' => $this->generateRecommendations($matchResult)
                ];

                // Store match in database for future reference
                $this->storeMatch($user, $scholarship, $matchResult);
            }
        }

        // Sort by match score (highest first)
        usort($matches, fn($a, $b) => $b['match_score'] <=> $a['match_score']);

        return $matches;
    }

    /**
     * Evaluate how well a scholarship matches the given criteria
     */
    private function evaluateMatch(array $criteria, Scholarship $scholarship): array
    {
        $score = 0;
        $maxPoints = 0;
        $criteriaMet = [];
        $criteriaMissing = [];

        // GPA Matching (20 points)
        $maxPoints += 20;
        if (!$scholarship->minimum_gpa || $criteria['gpa'] >= $scholarship->minimum_gpa) {
            $score += 20;
            $criteriaMet[] = "GPA requirement (" . ($scholarship->minimum_gpa ?? 'No minimum') . ")";
        } else {
            $criteriaMissing[] = "GPA requirement (need " . $scholarship->minimum_gpa . ", have " . $criteria['gpa'] . ")";
        }

        // Field of Study Matching (25 points)
        $maxPoints += 25;
        if ($this->matchesFieldOfStudy($criteria['major'], $scholarship->fields_of_study)) {
            $score += 25;
            $criteriaMet[] = "Field of study match";
        } else {
            $criteriaMissing[] = "Field of study alignment";
        }

        // Degree Level Matching (20 points)
        $maxPoints += 20;
        if ($this->matchesDegreeLevel($criteria['degree_level'], $scholarship->level)) {
            $score += 20;
            $criteriaMet[] = "Degree level match";
        } else {
            $criteriaMissing[] = "Degree level mismatch";
        }

        // Country/Nationality Matching (15 points)
        $maxPoints += 15;
        $countryMatch = $this->matchesCountryCriteria($criteria, $scholarship);
        if ($countryMatch['eligible']) {
            $score += 15;
            $criteriaMet[] = $countryMatch['reason'];
        } else {
            $criteriaMissing[] = $countryMatch['reason'];
        }

        // Language Requirements (10 points)
        $maxPoints += 10;
        $languageMatch = $this->matchesLanguageRequirements($criteria['languages'] ?? [], $scholarship->language_requirements);
        if ($languageMatch['met']) {
            $score += 10;
            $criteriaMet[] = "Language requirement met";
        } else {
            $criteriaMissing[] = $languageMatch['missing'];
        }

        // Deadline Proximity Bonus (10 points)
        $maxPoints += 10;
        $deadlineScore = $this->calculateDeadlineScore($scholarship->application_deadline);
        $score += $deadlineScore;
        if ($deadlineScore > 5) {
            $criteriaMet[] = "Application deadline is manageable";
        }

        $matchScore = ($score / $maxPoints) * 100;

        return [
            'match_score' => $matchScore,
            'criteria_met' => $criteriaMet,
            'criteria_missing' => $criteriaMissing,
            'raw_score' => $score,
            'max_points' => $maxPoints
        ];
    }

    /**
     * Check if user's major matches scholarship's field requirements
     */
    private function matchesFieldOfStudy(?string $userMajor, ?array $scholarshipFields): bool
    {
        if (!$scholarshipFields || empty($scholarshipFields)) {
            return true; // No specific requirement
        }

        if (!$userMajor) {
            return false;
        }

        // Simple matching - could be enhanced with fuzzy matching
        $userMajorLower = strtolower($userMajor);
        
        foreach ($scholarshipFields as $field) {
            if (str_contains($userMajorLower, strtolower($field)) || 
                str_contains(strtolower($field), $userMajorLower)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check degree level compatibility
     */
    private function matchesDegreeLevel(string $userLevel, string $scholarshipLevel): bool
    {
        $levelHierarchy = [
            'high_school' => 1,
            'bachelor' => 2,
            'master' => 3,
            'doctorate' => 4,
            'postdoc' => 5
        ];

        return $levelHierarchy[$userLevel] === $levelHierarchy[$scholarshipLevel];
    }

    /**
     * Check country/nationality eligibility
     */
    private function matchesCountryCriteria(array $criteria, Scholarship $scholarship): array
    {
        // Target countries
        if ($scholarship->target_countries && !empty($scholarship->target_countries)) {
            if (!in_array($criteria['current_country'] ?? $criteria['nationality'], $scholarship->target_countries)) {
                return [
                    'eligible' => false,
                    'reason' => 'Not available in your target country'
                ];
            }
        }

        // Eligible nationalities
        if ($scholarship->eligible_nationalities && !empty($scholarship->eligible_nationalities)) {
            if (!in_array('*', $scholarship->eligible_nationalities) && 
                !in_array($criteria['nationality'], $scholarship->eligible_nationalities)) {
                return [
                    'eligible' => false,
                    'reason' => 'Nationality requirement not met'
                ];
            }
        }

        return [
            'eligible' => true,
            'reason' => 'Geographic eligibility confirmed'
        ];
    }

    /**
     * Check language requirements
     */
    private function matchesLanguageRequirements(array $userLanguages, ?array $requiredLanguages): array
    {
        if (!$requiredLanguages || empty($requiredLanguages)) {
            return ['met' => true];
        }

        $levelMap = ['beginner' => 1, 'intermediate' => 2, 'advanced' => 3, 'native' => 4];
        
        foreach ($requiredLanguages as $language => $requiredLevel) {
            $userLang = collect($userLanguages)->firstWhere('language', $language);
            
            if (!$userLang) {
                return [
                    'met' => false,
                    'missing' => "{$language} proficiency required"
                ];
            }

            $userLevelValue = $levelMap[$userLang['proficiency_level']] ?? 0;
            $requiredLevelValue = $levelMap[$requiredLevel] ?? 0;

            if ($userLevelValue < $requiredLevelValue) {
                return [
                    'met' => false,
                    'missing' => "{$language} {$requiredLevel} level required"
                ];
            }
        }

        return ['met' => true];
    }

    /**
     * Calculate deadline score based on time remaining
     */
    private function calculateDeadlineScore(\DateTime $deadline): float
    {
        $daysUntilDeadline = now()->diffInDays($deadline, false);
        
        if ($daysUntilDeadline < 0) {
            return 0; // Past deadline
        } elseif ($daysUntilDeadline < 7) {
            return 2; // Very urgent
        } elseif ($daysUntilDeadline < 30) {
            return 6; // Urgent
        } elseif ($daysUntilDeadline < 90) {
            return 10; // Good timing
        } else {
            return 8; // Plenty of time
        }
    }

    /**
     * Generate AI-powered recommendations based on match result
     */
    private function generateRecommendations(array $matchResult): string
    {
        $score = $matchResult['match_score'];
        $missing = $matchResult['criteria_missing'];
        
        if ($score >= 90) {
            return "Excellent match! This scholarship aligns perfectly with your profile. Apply as soon as possible.";
        } elseif ($score >= 75) {
            return "Strong match! " . (empty($missing) ? "Your profile meets all requirements." : 
                "Consider addressing: " . implode(', ', array_slice($missing, 0, 2)) . ".");
        } elseif ($score >= 60) {
            return "Good potential match. Focus on improving: " . implode(', ', array_slice($missing, 0, 2)) . ".";
        } elseif ($score >= 40) {
            return "Moderate match. You may want to strengthen your profile in these areas: " . 
                implode(', ', array_slice($missing, 0, 3)) . ".";
        } else {
            return "Lower compatibility. Consider building experience in: " . 
                implode(', ', array_slice($missing, 0, 2)) . ".";
        }
    }

    /**
     * Store match result in database
     */
    private function storeMatch(User $user, Scholarship $scholarship, array $matchResult): void
    {
        ScholarshipMatch::updateOrCreate(
            [
                'user_id' => $user->id,
                'scholarship_id' => $scholarship->id
            ],
            [
                'match_score' => $matchResult['match_score'],
                'criteria_met' => $matchResult['criteria_met'],
                'criteria_missing' => $matchResult['criteria_missing'],
                'recommendations' => $this->generateRecommendations($matchResult)
            ]
        );
    }

    /**
     * Log match search for rate limiting and analytics
     */
    public function logMatchSearch(User $user, array $criteria, int $resultsCount): void
    {
        MatchSearch::create([
            'user_id' => $user->id,
            'search_criteria' => $criteria,
            'results_count' => $resultsCount
        ]);
    }

    /**
     * Get user's match history
     */
    public function getMatchHistory(User $user, array $options = []): array
    {
        $searches = MatchSearch::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($options['per_page'] ?? 10, ['*'], 'page', $options['page'] ?? 1);

        return [
            'data' => $searches->items(),
            'pagination' => [
                'current_page' => $searches->currentPage(),
                'per_page' => $searches->perPage(),
                'total' => $searches->total(),
                'total_pages' => $searches->lastPage(),
            ]
        ];
    }

    /**
     * Get detailed match results for a specific search
     */
    public function getMatchDetails(User $user, string $searchId): ?array
    {
        $search = MatchSearch::where('user_id', $user->id)
            ->where('id', $searchId)
            ->first();

        if (!$search) {
            return null;
        }

        // Re-run matching with the same criteria
        return $this->findMatches($user, $search->search_criteria);
    }

    /**
     * Recalculate all matches for a user (useful when profile changes)
     */
    public function recalculateUserMatches(User $user): int
    {
        // This would typically be implemented as a background job
        $profile = $user->profile;
        if (!$profile) {
            return 0;
        }

        $criteria = [
            'gpa' => $profile->gpa,
            'major' => $profile->major,
            'degree_level' => $profile->degree_level,
            'nationality' => $profile->nationality,
            'current_country' => $profile->current_country,
        ];

        // Delete old matches
        ScholarshipMatch::where('user_id', $user->id)->delete();

        // Recalculate
        $matches = $this->findMatches($user, $criteria);
        
        return count($matches);
    }
}