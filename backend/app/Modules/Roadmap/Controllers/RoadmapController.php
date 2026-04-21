<?php

namespace App\Modules\Roadmap\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Modules\Roadmap\Services\RoadmapService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
    private const FREE_ROADMAP_INTERVAL_DAYS = 90;

    public function __construct(private RoadmapService $service) {}

    // GET /api/roadmaps — all roadmaps for current user
    public function index(Request $request): JsonResponse
    {
        $roadmaps = Roadmap::where('user_id', $request->user()->id)
            ->with('dailyTasks')
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $roadmaps]);
    }

    // POST /api/roadmaps — generate roadmap from scholarship
    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'scholarship_id' => 'required|uuid|exists:scholarships,id',
        ]);

        $user = $request->user();
        $isPremiumOrAdmin = in_array($user->role, ['premium', 'admin'], true);

        $existingForScholarship = Roadmap::where('user_id', $user->id)
            ->where('scholarship_id', $request->input('scholarship_id'))
            ->where('status', 'active')
            ->latest()
            ->first();

        if ($existingForScholarship) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active roadmap for this scholarship.',
                'error' => [
                    'code' => 'ROADMAP_DUPLICATE',
                    'details' => ['roadmap_id' => $existingForScholarship->id],
                ],
            ], 409);
        }

        if (!$isPremiumOrAdmin) {
            $latestRoadmap = Roadmap::where('user_id', $user->id)
                ->latest('created_at')
                ->first();

            if ($latestRoadmap) {
                $daysSinceLastRoadmap = Carbon::parse($latestRoadmap->created_at)->diffInDays(now());
                if ($daysSinceLastRoadmap < self::FREE_ROADMAP_INTERVAL_DAYS) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Free plan limit reached: you can generate one roadmap every 90 days. Upgrade to Premium for unlimited roadmap generation.',
                        'error' => [
                            'code' => 'ROADMAP_LIMIT_REACHED',
                            'details' => [
                                'interval_days' => self::FREE_ROADMAP_INTERVAL_DAYS,
                                'days_since_last' => $daysSinceLastRoadmap,
                                'days_remaining' => self::FREE_ROADMAP_INTERVAL_DAYS - $daysSinceLastRoadmap,
                            ],
                        ],
                    ], 429);
                }
            }
        }

        try {
            $roadmap = $this->service->generateRoadmap(
                $request->only('scholarship_id'),
                $user->id
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'error' => [
                    'code' => 'ROADMAP_INVALID_INPUT',
                ],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data'    => $roadmap,
            'message' => 'Roadmap generated successfully.',
        ], 201);
    }

    // GET /api/tasks/daily — today's tasks for user
    public function getDailyTasks(Request $request): JsonResponse
    {
        $tasks = $this->service->getDailyTasks($request->user()->id);
        return response()->json(['success' => true, 'data' => $tasks]);
    }

    // PUT /api/tasks/{id}/complete
    public function completeTask(Request $request, string $id): JsonResponse
    {
        $task = DailyTask::whereHas('roadmap', fn($q) =>
            $q->where('user_id', $request->user()->id)
        )->findOrFail($id);

        $task->update(['status' => 'completed']);

        // Update roadmap progress
        $roadmap = $task->roadmap;
        $total = $roadmap->dailyTasks()->count();
        $completed = $roadmap->dailyTasks()->where('status', 'completed')->count();
        $roadmap->update(['progress_percentage' => (int) (($completed / $total) * 100)]);

        return response()->json([
            'success' => true,
            'data'    => $task,
            'message' => 'Task marked as completed.',
        ]);
    }

    // PUT /api/tasks/{id}/skip
    public function skipTask(Request $request, string $id): JsonResponse
    {
        $task = DailyTask::whereHas('roadmap', fn($q) =>
            $q->where('user_id', $request->user()->id)
        )->findOrFail($id);

        $task->update(['status' => 'skipped']);

        return response()->json([
            'success' => true,
            'data'    => $task,
            'message' => 'Task skipped.',
        ]);
    }

    // GET /api/roadmaps/{id}
    public function show(Request $request, string $id): JsonResponse
    {
        $roadmap = Roadmap::with('dailyTasks')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $roadmap]);
    }

    // PUT /api/roadmaps/{id}
    public function update(Request $request, string $id): JsonResponse
    {
        $roadmap = Roadmap::where('user_id', $request->user()->id)->findOrFail($id);
        $roadmap->update($request->only('title', 'description'));

        return response()->json([
            'success' => true,
            'data'    => $roadmap,
            'message' => 'Roadmap updated.',
        ]);
    }

    // DELETE /api/roadmaps/{id}
    public function destroy(Request $request, string $id): JsonResponse
    {
        Roadmap::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'data'    => null,
            'message' => 'Roadmap deleted.',
        ]);
    }

    // PUT /api/roadmaps/{id}/progress
    public function updateProgress(Request $request, string $id): JsonResponse
    {
        $roadmap = Roadmap::where('user_id', $request->user()->id)->findOrFail($id);
        $roadmap->update(['progress_percentage' => $request->input('progress_percentage')]);

        return response()->json(['success' => true, 'data' => $roadmap]);
    }
}
