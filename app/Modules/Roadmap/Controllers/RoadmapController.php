<?php

namespace App\Modules\Roadmap\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Roadmap list']);
    }

    public function create(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Create roadmap']);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['message' => 'Show roadmap']);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Update roadmap']);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Delete roadmap']);
    }

    public function updateProgress(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Update progress']);
    }
}
