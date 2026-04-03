<?php

namespace App\Modules\User\Services;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;

class UserService
{
    /**
     * Create a new user with profile
     */
    public function createUser(array $userData, array $profileData = []): User
    {
        return DB::transaction(function () use ($userData, $profileData) {
            // Create user
            $user = User::create($userData);

            // Create user profile
            if (!empty($profileData)) {
                $profile = $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => $profileData['first_name'] ?? '',
                    'last_name' => $profileData['last_name'] ?? '',
                    'phone' => $profileData['phone'] ?? null,
                    'date_of_birth' => $profileData['date_of_birth'] ?? null,
                    'nationality' => $profileData['nationality'] ?? null,
                    'current_country' => $profileData['current_country'] ?? null,
                    'gpa' => $profileData['gpa'] ?? null,
                    'major' => $profileData['major'] ?? null,
                    'degree_level' => $profileData['degree_level'] ?? null,
                    'graduation_year' => $profileData['graduation_year'] ?? null,
                    'profile_completion_percentage' => 0,
                    'profile_status' => UserProfile::STATUS_DRAFT,
                ]);

                $profile->refreshProfileProgress();
                $profile->save();
            }

            return $user->load('profile');
        });
    }

    /**
     * Get user with profile
     */
    public function getUserWithProfile(string $userId): ?User
    {
        return User::with('profile', 'languages')
            ->find($userId);
    }

    /**
     * Update user profile
     */
    public function updateProfile(User $user, array $profileData): void
    {
        DB::transaction(function () use ($user, $profileData) {
            $profile = $user->profile()->firstOrNew([
                'user_id' => $user->id,
            ]);

            $profile->fill([
                'first_name' => $profileData['first_name'] ?? $profile->first_name,
                'last_name' => $profileData['last_name'] ?? $profile->last_name,
                'phone' => $profileData['phone'] ?? $profile->phone,
                'date_of_birth' => $profileData['date_of_birth'] ?? $profile->date_of_birth,
                'nationality' => $profileData['nationality'] ?? $profile->nationality,
                'current_country' => $profileData['current_country'] ?? $profile->current_country,
                'gpa' => $profileData['gpa'] ?? $profile->gpa,
                'major' => $profileData['major'] ?? $profile->major,
                'degree_level' => $profileData['degree_level'] ?? $profile->degree_level,
                'graduation_year' => $profileData['graduation_year'] ?? $profile->graduation_year,
            ]);

            $profile->refreshProfileProgress();
            $profile->save();
        });
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateCompletionPercentage(array $profileData): int
    {
        $completedFields = 0;

        foreach (UserProfile::PROFILE_FIELDS as $field) {
            if (!empty($profileData[$field])) {
                $completedFields++;
            }
        }

        return (int)($completedFields / count(UserProfile::PROFILE_FIELDS) * 100);
    }
}
