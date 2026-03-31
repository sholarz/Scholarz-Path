<?php

namespace App\Modules\Scholarship\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    /**
     * Get all scholarships with pagination and filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Scholarship::with('provider');

        $status = $request->get('status');
        $allowedStatuses = ['active', 'inactive', 'expired', 'draft'];

        if ($status && in_array($status, $allowedStatuses, true)) {
            $query->where('status', $status);
        } else {
            $query->where('status', 'active')
                ->where('application_deadline', '>', now());
        }

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filter by level
        if ($request->has('level') && $request->level) {
            $query->where('level', $request->level);
        }

        // Filter by featured
        if ($request->has('featured') && $request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // Filter by minimum GPA
        if ($request->has('min_gpa') && $request->min_gpa) {
            $query->where('minimum_gpa', '<=', $request->min_gpa);
        }

        // Search in title and description
        if ($request->has('search') && $request->search) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhere('description', 'like', $searchTerm);
            });
        }

        // Filter by country
        if ($request->has('country') && $request->country) {
            $query->whereJsonContains('target_countries', $request->country);
        }

        // Sort
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        
        if (in_array($sortBy, ['created_at', 'amount', 'application_deadline', 'view_count'])) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Paginate
        $perPage = min($request->get('per_page', 15), 100);
        $scholarships = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'scholarships' => $scholarships->items(),
                'pagination' => [
                    'total' => $scholarships->total(),
                    'per_page' => $scholarships->perPage(),
                    'current_page' => $scholarships->currentPage(),
                    'last_page' => $scholarships->lastPage(),
                    'from' => $scholarships->firstItem(),
                    'to' => $scholarships->lastItem(),
                ]
            ]
        ]);
    }

    /**
     * Get single scholarship
     */
    public function show(string $id): JsonResponse
    {
        $scholarship = Scholarship::with('provider')->findOrFail($id);

        // Increment view count
        $scholarship->increment('view_count');

        return response()->json([
            'success' => true,
            'data' => [
                'scholarship' => $scholarship
            ]
        ]);
    }

    /**
     * Get scholarships by provider
     */
    public function getByProvider(string $providerId): JsonResponse
    {
        $scholarships = Scholarship::with('provider')
            ->where('provider_id', $providerId)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => [
                'scholarships' => $scholarships->items(),
                'pagination' => [
                    'total' => $scholarships->total(),
                    'per_page' => $scholarships->perPage(),
                    'current_page' => $scholarships->currentPage(),
                ]
            ]
        ]);
    }

    /**
     * Bookmark a scholarship
     */
    public function bookmark(Request $request, string $scholarshipId): JsonResponse
    {
        $user = $request->user();
        
        $user->scholarshipMatches()->updateOrCreate(
            ['scholarship_id' => $scholarshipId],
            ['is_bookmarked' => true]
        );

        return response()->json([
            'success' => true,
            'message' => 'Scholarship bookmarked successfully'
        ]);
    }

    /**
     * Remove bookmark
     */
    public function removeBookmark(Request $request, string $scholarshipId): JsonResponse
    {
        $user = $request->user();
        
        $match = $user->scholarshipMatches()
            ->where('scholarship_id', $scholarshipId)
            ->first();

        if ($match) {
            $match->update(['is_bookmarked' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bookmark removed successfully'
        ]);
    }

    /**
     * Get user's bookmarked scholarships
     */
    public function getBookmarks(Request $request): JsonResponse
    {
        $user = $request->user();

        $scholarships = $user->scholarshipMatches()
            ->where('is_bookmarked', true)
            ->with('scholarship.provider')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => [
                'scholarships' => $scholarships->items(),
                'pagination' => [
                    'total' => $scholarships->total(),
                    'per_page' => $scholarships->perPage(),
                    'current_page' => $scholarships->currentPage(),
                ]
            ]
        ]);
    }
}