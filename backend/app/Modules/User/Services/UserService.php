<?php

namespace App\Modules\User\Services;

use App\Models\User;
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
                $user->profile()->create([
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
                    'profile_completion_percentage' => $this->calculateCompletionPercentage($profileData),
                ]);
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
            if ($user->profile) {
                $user->profile->update([
                    'first_name' => $profileData['first_name'] ?? $user->profile->first_name,
                    'last_name' => $profileData['last_name'] ?? $user->profile->last_name,
                    'phone' => $profileData['phone'] ?? $user->profile->phone,
                    'date_of_birth' => $profileData['date_of_birth'] ?? $user->profile->date_of_birth,
                    'nationality' => $profileData['nationality'] ?? $user->profile->nationality,
                    'current_country' => $profileData['current_country'] ?? $user->profile->current_country,
                    'gpa' => $profileData['gpa'] ?? $user->profile->gpa,
                    'major' => $profileData['major'] ?? $user->profile->major,
                    'degree_level' => $profileData['degree_level'] ?? $user->profile->degree_level,
                    'graduation_year' => $profileData['graduation_year'] ?? $user->profile->graduation_year,
                    'profile_completion_percentage' => $this->calculateCompletionPercentage($profileData),
                ]);
            }
        });
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateCompletionPercentage(array $profileData): int
    {
        $fields = [
            'first_name', 'last_name', 'phone', 'date_of_birth',
            'nationality', 'current_country', 'gpa', 'major',
            'degree_level', 'graduation_year'
        ];

        $completedFields = 0;
        foreach ($fields as $field) {
            if (!empty($profileData[$field])) {
                $completedFields++;
            }
        }

        return (int)($completedFields / count($fields) * 100);
    }
}
