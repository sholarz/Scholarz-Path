<?php

namespace App\Modules\Matching\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Matching\Services\MatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingController extends Controller
{
    public function __construct(private MatchingService $matchingService) {}

    /**
     * POST /api/scholarships/match
     * Run matching algorithm for the authenticated user.
     */
    public function performMatching(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gpa'           => 'sometimes|numeric|min:0|max:4',
            'major'         => 'sometimes|nullable|string|max:255',
            'degree_level'  => 'sometimes|nullable|string|in:high_school,bachelor,master,doctorate,postdoc',
            'nationality'   => 'sometimes|nullable|string|max:10',
            'current_country' => 'sometimes|nullable|string|max:10',
            'languages'     => 'sometimes|nullable|array',
        ]);

        $user = $request->user();

        // Build criteria: prefer explicit request params, fallback to profile
        $profile = $user->profile;
        $criteria = [
            'gpa'             => $validated['gpa'] ?? (float) ($profile?->gpa ?? 0),
            'major'           => $validated['major'] ?? $profile?->major,
            'degree_level'    => $validated['degree_level'] ?? $profile?->degree_level ?? 'bachelor',
            'nationality'     => $validated['nationality'] ?? $profile?->nationality,
            'current_country' => $validated['current_country'] ?? $profile?->current_country,
            'languages'       => $validated['languages'] ?? $user->languages?->map(fn ($l) => [
                'language'          => $l->language,
                'proficiency_level' => $l->proficiency_level,
            ])->toArray() ?? [],
        ];

        $matches = $this->matchingService->findMatches($user, $criteria);

        // Log the search for history
        $this->matchingService->logMatchSearch($user, $criteria, count($matches));

        return response()->json([
            'success' => true,
            'data' => [
                'matches'        => $matches,
                'total_matched'  => count($matches),
                'criteria_used'  => $criteria,
            ],
            'message' => count($matches) . ' scholarship(s) matched your profile.',
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
