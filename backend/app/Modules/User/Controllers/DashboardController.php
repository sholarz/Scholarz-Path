<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Models\ScholarshipMatch;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     *
     * Aggregated dashboard data for the authenticated user:
     *  - top_matches      : top 5 matched scholarships by score
     *  - readiness_score  : overall profile readiness %
     *  - upcoming_deadlines: bookmarked scholarships with nearest deadlines
     *  - active_tasks     : pending tasks due within the next 7 days
     *  - active_roadmaps  : count and list of active roadmaps
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile', 'languages', 'scholarshipMatches.scholarship.provider']);

        // --- Top Matches ---
        $topMatches = $user->scholarshipMatches()
            ->where('match_score', '>', 0)
            ->orderByDesc('match_score')
            ->with('scholarship:id,title,level,application_deadline,amount,currency,type')
            ->limit(5)
            ->get()
            ->map(fn ($m) => [
                'scholarship'  => $m->scholarship,
                'match_score'  => $m->match_score,
                'is_bookmarked' => (bool) $m->is_bookmarked,
            ]);

        // --- Readiness Score (profile completion %) ---
        $readinessScore = $user->profile?->profile_completion_percentage ?? 0;

        // --- Upcoming Deadlines (bookmarked scholarships with soonest deadlines) ---
        $upcomingDeadlines = $user->scholarshipMatches()
            ->where('is_bookmarked', true)
            ->with(['scholarship' => fn ($q) => $q
                ->where('application_deadline', '>=', now())
                ->orderBy('application_deadline')
                ->select('id', 'title', 'application_deadline', 'level'),
            ])
            ->get()
            ->filter(fn ($m) => $m->scholarship !== null)
            ->sortBy(fn ($m) => $m->scholarship->application_deadline)
            ->values()
            ->take(5)
            ->map(fn ($m) => [
                'scholarship_id'       => $m->scholarship->id,
                'title'                => $m->scholarship->title,
                'application_deadline' => $m->scholarship->application_deadline,
                'days_until_deadline'  => now()->diffInDays($m->scholarship->application_deadline, false),
            ]);

        // --- Active Tasks (due within 7 days, not completed) ---
        $activeTasks = DailyTask::whereHas('roadmap', fn ($q) =>
            $q->where('user_id', $user->id)->where('status', 'active')
        )
            ->where('status', 'pending')
            ->whereDate('due_date', '<=', Carbon::today()->addDays(7))
            ->whereDate('due_date', '>=', Carbon::today())
            ->with('roadmap:id,title,scholarship_id')
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        // --- Active Roadmaps ---
        $activeRoadmaps = Roadmap::where('user_id', $user->id)
            ->where('status', 'active')
            ->select('id', 'title', 'deadline', 'progress_percentage', 'scholarship_id')
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'                  => $r->id,
                'title'               => $r->title,
                'deadline'            => $r->deadline,
                'progress_percentage' => $r->progress_percentage ?? 0,
                'days_until_deadline' => now()->diffInDays($r->deadline, false),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'top_matches'        => $topMatches,
                'readiness_score'    => $readinessScore,
                'upcoming_deadlines' => $upcomingDeadlines,
                'active_tasks'       => $activeTasks,
                'active_roadmaps'    => $activeRoadmaps,
                'active_roadmap_count' => $activeRoadmaps->count(),
            ],
        ]);
    }
}
