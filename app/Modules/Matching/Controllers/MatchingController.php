<?php

namespace App\Modules\Matching\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Matching\Requests\PerformMatchingRequest;
use App\Modules\Matching\Services\MatchingService;
use App\Modules\Matching\Services\RateLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingController extends Controller
{
    public function __construct(
        private MatchingService $matchingService,
        private RateLimitService $rateLimitService
    ) {}

    /**
     * Perform scholarship matching for user
     */
    public function performMatching(PerformMatchingRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check rate limits for free users
            if ($user->role === 'free') {
                $rateLimitResult = $this->rateLimitService->checkMatchingLimit($user);
                if (!$rateLimitResult['allowed']) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'RATE_LIMIT_EXCEEDED',
                            'message' => 'Matching quota exceeded. Upgrade to Premium for unlimited matching.',
                            'details' => [
                                'remaining_searches' => $rateLimitResult['remaining'],
                                'resets_at' => $rateLimitResult['resets_at'],
                                'upgrade_url' => '/subscriptions/plans'
                            ]
                        ]
                    ], 429);
                }
            }

            // Use custom criteria or user profile
            $criteria = $request->validated() ?: $this->getProfileCriteria($user);

            // Perform matching
            $matches = $this->matchingService->findMatches($user, $criteria);

            // Limit results for free users
            if ($user->role === 'free') {
                $limitedMatches = array_slice($matches, 0, 3);
                $upgradeMessage = count($matches) > 3 
                    ? "Upgrade to Premium to see all " . count($matches) . " matching scholarships!"
                    : null;
            } else {
                $limitedMatches = $matches;
                $upgradeMessage = null;
            }

            // Log the search
            $this->matchingService->logMatchSearch($user, $criteria, count($matches));

            return response()->json([
                'success' => true,
                'data' => [
                    'matches' => $limitedMatches,
                    'total_found' => count($matches),
                    'showing' => count($limitedMatches),
                    'upgrade_message' => $upgradeMessage,
                    'search_metadata' => [
                        'criteria_used' => $criteria,
                        'matched_at' => now()->toISOString()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'MATCHING_ERROR',
                    'message' => 'Unable to perform matching at this time',
                    'details' => config('app.debug') ? $e->getMessage() : null
                ]
            ], 500);
        }
    }

    /**
     * Get user's matching history
     */
    public function getMatchHistory(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $history = $this->matchingService->getMatchHistory($user, [
                'page' => $request->get('page', 1),
                'per_page' => $request->get('per_page', 10)
            ]);

            // Get rate limit info for free users
            $rateLimitInfo = null;
            if ($user->role === 'free') {
                $rateLimitInfo = $this->rateLimitService->getRateLimitInfo($user);
            }

            return response()->json([
                'success' => true,
                'data' => array_filter([
                    'searches' => $history['data'],
                    'pagination' => $history['pagination'],
                    'rate_limit' => $rateLimitInfo
                ])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'HISTORY_ERROR',
                    'message' => 'Unable to retrieve match history'
                ]
            ], 500);
        }
    }

    /**
     * Get detailed match results for a specific search
     */
    public function getMatchDetails(Request $request, string $searchId): JsonResponse
    {
        try {
            $user = $request->user();
            
            $matchDetails = $this->matchingService->getMatchDetails($user, $searchId);
            
            if (!$matchDetails) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'Match search not found'
                    ]
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $matchDetails
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'MATCH_DETAILS_ERROR',
                    'message' => 'Unable to retrieve match details'
                ]
            ], 500);
        }
    }

    /**
     * Re-calculate match scores for existing matches
     */
    public function recalculateMatches(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // This would typically be a background job
            $updatedCount = $this->matchingService->recalculateUserMatches($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'matches_updated' => $updatedCount,
                    'message' => 'Match scores updated successfully'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'RECALCULATION_ERROR',
                    'message' => 'Unable to recalculate matches'
                ]
            ], 500);
        }
    }

    /**
     * Get profile criteria from user's profile
     */
    private function getProfileCriteria($user): array
    {
        $profile = $user->profile;
        
        if (!$profile) {
            throw new \Exception('Please complete your profile before matching');
        }

        return [
            'gpa' => $profile->gpa,
            'major' => $profile->major,
            'degree_level' => $profile->degree_level,
            'nationality' => $profile->nationality,
            'current_country' => $profile->current_country,
            'graduation_year' => $profile->graduation_year,
            'languages' => $user->languages->map(fn($lang) => [
                'language' => $lang->language,
                'proficiency_level' => $lang->proficiency_level
            ])->toArray()
        ];
    }
}