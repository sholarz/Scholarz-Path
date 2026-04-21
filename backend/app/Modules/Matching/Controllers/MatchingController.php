<?php

namespace App\Modules\Matching\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MatchSearch;
use App\Modules\Matching\Services\MatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingController extends Controller
{
    private const FREE_DAILY_MATCH_LIMIT = 1;
    private const FREE_MAX_MATCH_RESULTS = 3;

    public function __construct(private MatchingService $matchingService) {}

    /**
     * POST /api/scholarships/match
     * Run matching algorithm for the authenticated user.
     */
    public function performMatching(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gpa'           => 'sometimes|numeric|min:0|max:4',
            'field_of_study' => 'sometimes|nullable|string|max:255',
            'major'         => 'sometimes|nullable|string|max:255',
            'degree_level'  => 'sometimes|nullable|string|in:sma,s1,s2,s3,high_school,bachelor,master,doctorate,postdoc',
            'nationality'   => 'sometimes|nullable|string|max:10',
            'current_country' => 'sometimes|nullable|string|max:10',
            'languages'     => 'sometimes|nullable|array',
        ]);

        $user = $request->user();

        $isPremiumOrAdmin = in_array($user->role, ['premium', 'admin'], true);
        $todayUsage = MatchSearch::where('user_id', $user->id)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        if (!$isPremiumOrAdmin && $todayUsage >= self::FREE_DAILY_MATCH_LIMIT) {
            return response()->json([
                'success' => false,
                'message' => 'Free plan limit reached: you can run scholarship matching once per day. Upgrade to Premium for unlimited matching.',
                'error' => [
                    'code' => 'MATCHING_LIMIT_REACHED',
                    'details' => [
                        'daily_limit' => self::FREE_DAILY_MATCH_LIMIT,
                        'used_today' => $todayUsage,
                    ],
                ],
            ], 429);
        }

        // Build criteria: prefer explicit request params, fallback to profile
        $profile = $user->profile;
        $criteria = [
            'gpa'             => $validated['gpa'] ?? (float) ($profile?->gpa ?? 0),
            'major'           => $validated['field_of_study'] ?? $validated['major'] ?? $profile?->field_of_study ?? $profile?->major,
            'degree_level'    => $validated['degree_level'] ?? $profile?->degree_level ?? 'bachelor',
            'nationality'     => $validated['nationality'] ?? $profile?->nationality,
            'current_country' => $validated['current_country'] ?? $profile?->current_country,
            'languages'       => $validated['languages'] ?? $user->languages?->map(fn ($l) => [
                'language'          => $l->language,
                'proficiency_level' => $l->proficiency_level,
            ])->toArray() ?? [],
        ];

        $matches = $this->matchingService->findMatches($user, $criteria);
        if (!$isPremiumOrAdmin) {
            $matches = array_slice($matches, 0, self::FREE_MAX_MATCH_RESULTS);
        }

        // Log the search for history
        $this->matchingService->logMatchSearch($user, $criteria, count($matches));

        $missingProfileFields = [];
        if (!$profile?->gpa) {
            $missingProfileFields[] = 'gpa';
        }
        if (!$profile?->field_of_study && !$profile?->major) {
            $missingProfileFields[] = 'field_of_study';
        }
        if (!$profile?->degree_level) {
            $missingProfileFields[] = 'degree_level';
        }
        if (!$profile?->nationality) {
            $missingProfileFields[] = 'nationality';
        }
        if (!$profile?->current_country) {
            $missingProfileFields[] = 'current_country';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'matches'        => $matches,
                'total_matched'  => count($matches),
                'criteria_used'  => $criteria,
                'usage'          => [
                    'is_premium' => $isPremiumOrAdmin,
                    'daily_limit' => $isPremiumOrAdmin ? null : self::FREE_DAILY_MATCH_LIMIT,
                    'used_today' => $todayUsage + 1,
                    'remaining_today' => $isPremiumOrAdmin ? null : max(0, self::FREE_DAILY_MATCH_LIMIT - ($todayUsage + 1)),
                    'result_limit' => $isPremiumOrAdmin ? null : self::FREE_MAX_MATCH_RESULTS,
                ],
                'missing_profile_fields' => $missingProfileFields,
            ],
            'message' => count($matches) > 0
                ? count($matches) . ' scholarship(s) matched your profile.'
                : 'No eligible scholarships found with your current profile and criteria.',
        ]);
    }

    /**
     * GET /api/scholarships/matches/history
     * Retrieve the user's past match searches.
     */
    public function getMatchHistory(Request $request): JsonResponse
    {
        $options = [
            'per_page' => min((int) $request->get('per_page', 10), 50),
            'page'     => (int) $request->get('page', 1),
        ];

        $history = $this->matchingService->getMatchHistory($request->user(), $options);

        return response()->json([
            'success' => true,
            'data'    => $history,
        ]);
    }
}
