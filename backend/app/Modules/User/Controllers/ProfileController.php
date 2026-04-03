<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use App\Modules\User\Requests\UpdateAcademicProfileRequest;
use App\Modules\User\Requests\UpdateBasicProfileRequest;
use App\Modules\User\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show(Request $request): JsonResponse
    {
        return $this->legacyProfileResponse($request->user()->loadMissing('profile', 'languages'));
    }

    /**
     * Get aggregate profile payload.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('profile', 'languages');

        return response()->json([
            'success' => true,
            'data' => $this->aggregateProfilePayload($user),
        ]);
    }

    /**
     * Get basic profile section.
     */
    public function basic(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'basic' => $this->basicProfilePayload($user),
            ],
        ]);
    }

    /**
     * Get academic profile section.
     */
    public function academic(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'academic' => $this->academicProfilePayload($user),
            ],
        ]);
    }

    /**
     * Get profile status section.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $this->statusProfilePayload($user),
            ],
        ]);
    }

    /**
     * Update user profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        return $this->persistProfile($request->user(), $request->validated(), 'Profile updated successfully');
    }

    /**
     * Update basic profile section.
     */
    public function updateBasic(UpdateBasicProfileRequest $request): JsonResponse
    {
        return $this->persistProfile($request->user(), $request->validated(), 'Basic profile updated successfully');
    }

    /**
     * Update academic profile section.
     */
    public function updateAcademic(UpdateAcademicProfileRequest $request): JsonResponse
    {
        return $this->persistProfile($request->user(), $request->validated(), 'Academic profile updated successfully');
    }

    /**
     * Legacy current user payload.
     */
    private function legacyProfileResponse(User $user): JsonResponse
    {
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
     * Aggregate profile payload.
     */
    private function aggregateProfilePayload(User $user): array
    {
        $profile = $user->profile;

        return [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
            ],
            'profile' => [
                'basic' => $profile ? $profile->basicSection() : $this->defaultBasicProfilePayload(),
                'academic' => $profile ? $profile->academicSection() : $this->defaultAcademicProfilePayload(),
                'status' => $profile ? $profile->statusSection() : $this->defaultStatusProfilePayload(),
            ],
            'languages' => $user->languages->map(fn ($lang) => [
                'id' => $lang->id,
                'language' => $lang->language,
                'proficiency_level' => $lang->proficiency_level,
                'certification' => $lang->certification,
                'score' => $lang->score,
            ])->toArray(),
        ];
    }

    /**
     * Update user profile and recalculate completion state.
     */
    private function persistProfile(User $user, array $data, string $message): JsonResponse
    {
        $profile = $user->profile()->firstOrNew([
            'user_id' => $user->id,
        ]);

        if ($profile->exists) {
            $this->authorize('update', $profile);
        } else {
            $this->authorize('create', UserProfile::class);
        }

        $profile->fill(array_merge(
            Arr::only($profile->getAttributes(), UserProfile::PROFILE_FIELDS),
            $data,
            ['user_id' => $user->id]
        ));
        $profile->refreshProfileProgress();
        $profile->save();

        $user->setRelation('profile', $profile->fresh());
        $user->loadMissing('languages');

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'profile' => [
                    'basic' => $profile->basicSection(),
                    'academic' => $profile->academicSection(),
                    'status' => $profile->statusSection(),
                ],
            ],
        ]);
    }

    private function basicProfilePayload(User $user): array
    {
        return $user->profile ? $user->profile->basicSection() : $this->defaultBasicProfilePayload();
    }

    private function academicProfilePayload(User $user): array
    {
        return $user->profile ? $user->profile->academicSection() : $this->defaultAcademicProfilePayload();
    }

    private function statusProfilePayload(User $user): array
    {
        return $user->profile ? $user->profile->statusSection() : $this->defaultStatusProfilePayload();
    }

    private function defaultBasicProfilePayload(): array
    {
        return array_merge(['id' => null], array_fill_keys(UserProfile::BASIC_FIELDS, null));
    }

    private function defaultAcademicProfilePayload(): array
    {
        return array_merge(['id' => null], array_fill_keys(UserProfile::ACADEMIC_FIELDS, null));
    }

    private function defaultStatusProfilePayload(): array
    {
        return [
            'profile_status' => UserProfile::STATUS_DRAFT,
            'profile_completion_percentage' => 0,
            'basic_completion_percentage' => 0,
            'academic_completion_percentage' => 0,
            'is_basic_complete' => false,
            'is_academic_complete' => false,
            'missing_fields' => [
                'basic' => UserProfile::BASIC_FIELDS,
                'academic' => UserProfile::ACADEMIC_FIELDS,
            ],
        ];
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
