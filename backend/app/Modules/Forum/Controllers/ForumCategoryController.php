<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use Illuminate\Http\JsonResponse;

class ForumCategoryController extends Controller
{
    // GET /api/forum/categories
    public function index(): JsonResponse
    {
        $categories = ForumCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->withCount(['posts' => fn($q) => $q->where('status', 'published')])
            ->get(['id', 'name', 'slug', 'description']);

        return response()->json(['data' => $categories]);
    }
}