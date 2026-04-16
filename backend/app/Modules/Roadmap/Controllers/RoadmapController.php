<?php

namespace App\Modules\Roadmap\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Modules\Roadmap\Services\RoadmapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
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

        $roadmap = $this->service->generateRoadmap(
            $request->only('scholarship_id'),
            $request->user()->id
        );

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
