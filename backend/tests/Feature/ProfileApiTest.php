<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserLanguage;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_profile_with_languages(): void
    {
        $user = User::factory()->create();

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Putri',
            'last_name' => 'Zahara',
            'phone' => '08123456789',
            'nationality' => 'Indonesia',
            'current_country' => 'Indonesia',
            'gpa' => 3.80,
            'major' => 'Informatics',
            'degree_level' => 'bachelor',
            'graduation_year' => 2026,
            'profile_completion_percentage' => 90,
        ]);

        UserLanguage::create([
            'user_id' => $user->id,
            'language' => 'English',
            'proficiency_level' => 'advanced',
            'certification' => 'IELTS',
            'score' => '7.0',
        ]);

        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/user/profile')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.profile.first_name', 'Putri')
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'email',
                    'role',
                    'profile' => ['first_name', 'last_name', 'profile_completion_percentage'],
                    'languages',
                ],
            ]);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create();

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Old',
            'last_name' => 'Name',
            'profile_completion_percentage' => 20,
        ]);

        $this->actingAs($user, 'sanctum');

        $payload = [
            'first_name' => 'New',
            'last_name' => 'Profile',
            'major' => 'Computer Science',
            'degree_level' => 'master',
            'gpa' => 3.9,
        ];

        $this->putJson('/api/profile', $payload)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Profile updated successfully');

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'first_name' => 'New',
            'last_name' => 'Profile',
            'major' => 'Computer Science',
            'degree_level' => 'master',
        ]);
    }

    public function test_authenticated_user_can_add_language(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/profile/languages', [
            'language' => 'Japanese',
            'proficiency_level' => 'intermediate',
            'certification' => 'JLPT',
            'score' => 'N3',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Language added successfully');

        $this->assertDatabaseHas('user_languages', [
            'user_id' => $user->id,
            'language' => 'Japanese',
            'proficiency_level' => 'intermediate',
        ]);
    }
}
