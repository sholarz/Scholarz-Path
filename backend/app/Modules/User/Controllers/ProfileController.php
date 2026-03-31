<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'languages');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
                'profile' => $user->profile ? [
                    'id' => $user->profile->id,
                    'first_name' => $user->profile->first_name,
                    'last_name' => $user->profile->last_name,
                    'phone' => $user->profile->phone,
                    'date_of_birth' => $user->profile->date_of_birth,
                    'nationality' => $user->profile->nationality,
                    'current_country' => $user->profile->current_country,
                    'gpa' => $user->profile->gpa,
                    'major' => $user->profile->major,
                    'degree_level' => $user->profile->degree_level,
                    'graduation_year' => $user->profile->graduation_year,
                    'profile_completion_percentage' => $user->profile->profile_completion_percentage,
                ] : null,
                'languages' => $user->languages->map(fn ($lang) => [
                    'id' => $lang->id,
                    'language' => $lang->language,
                    'proficiency_level' => $lang->proficiency_level,
                    'certification' => $lang->certification,
                    'score' => $lang->score,
                ])->toArray(),
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'nationality' => 'sometimes|nullable|string|max:100',
            'current_country' => 'sometimes|nullable|string|max:100',
            'gpa' => 'sometimes|nullable|numeric|min:0|max:4',
            'major' => 'sometimes|nullable|string|max:200',
            'degree_level' => 'sometimes|nullable|in:high_school,bachelor,master,doctorate',
            'graduation_year' => 'sometimes|nullable|integer|min:1950|max:2100',
        ]);

        $user = $request->user();
        
        if (!$user->profile) {
            $user->profile()->create($validated);
        } else {
            $user->profile->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'profile' => $user->profile->fresh()
            ]
        ]);
    }

    /**
     * Add language to profile
     */
    public function addLanguage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'required|string|max:100',
            'proficiency_level' => 'required|in:beginner,intermediate,advanced,native',
            'certification' => 'sometimes|nullable|string|max:200',
            'score' => 'sometimes|nullable|string|max:50',
        ]);

        $user = $request->user();
        
        $language = $user->languages()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Language added successfully',
            'data' => [
                'language' => $language
            ]
        ], 201);
    }

    /**
     * Update language
     */
    public function updateLanguage(Request $request, string $languageId): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'sometimes|string|max:100',
            'proficiency_level' => 'sometimes|in:beginner,intermediate,advanced,native',
            'certification' => 'sometimes|nullable|string|max:200',
            'score' => 'sometimes|nullable|string|max:50',
        ]);

        $user = $request->user();
        $language = $user->languages()->findOrFail($languageId);
        
        $language->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Language updated successfully',
            'data' => [
                'language' => $language
            ]
        ]);
    }

    /**
     * Delete language
     */
    public function deleteLanguage(Request $request, string $languageId): JsonResponse
    {
        $user = $request->user();
        $language = $user->languages()->findOrFail($languageId);
        
        $language->delete();

        return response()->json([
            'success' => true,
            'message' => 'Language deleted successfully'
        ]);
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
        ]);

        // TODO: Implement file upload to storage
        // This is a placeholder for now

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully'
        ]);
    }
}
