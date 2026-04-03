<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_me_returns_aggregated_sections(): void
    {
        $user = $this->createUserWithProfile();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/profile/me');

        $response->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'email', 'role', 'status', 'email_verified_at'],
                    'profile' => [
                        'basic',
                        'academic',
                        'status',
                    ],
                    'languages',
                ],
            ]);
    }

    public function test_basic_profile_endpoint_updates_basic_section_and_status(): void
    {
        $user = $this->createUser();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/me/basic', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+1234567890',
            'date_of_birth' => '1999-01-02',
            'nationality' => 'ID',
            'current_country' => 'ID',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.basic.first_name', 'John')
            ->assertJsonPath('data.profile.status.profile_status', 'in_progress');

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'profile_status' => 'in_progress',
        ]);
    }

    public function test_academic_profile_endpoint_updates_academic_section(): void
    {
        $user = $this->createUserWithProfile();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/me/academic', [
            'gpa' => 3.85,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'graduation_year' => 2027,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.academic.major', 'Computer Science')
            ->assertJsonPath('data.profile.status.profile_status', 'completed');

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'profile_status' => 'completed',
        ]);
    }

    public function test_profile_policy_allows_only_owner_or_admin(): void
    {
        $owner = $this->createUserWithProfile();
        $otherUser = $this->createUser();

        $profile = $owner->profile()->first();

        $this->assertTrue(Gate::forUser($owner)->allows('view', $profile));
        $this->assertTrue(Gate::forUser($owner)->allows('update', $profile));
        $this->assertFalse(Gate::forUser($otherUser)->allows('view', $profile));
        $this->assertFalse(Gate::forUser($otherUser)->allows('update', $profile));
    }

    public function test_update_basic_rejects_invalid_payload(): void
    {
        $user = $this->createUser();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/me/basic', [
            'first_name' => str_repeat('A', 101),
            'date_of_birth' => 'not-a-date',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'date_of_birth']);
    }

    public function test_inactive_user_cannot_create_profile_via_basic_endpoint(): void
    {
        $inactiveUser = $this->createUser([
            'status' => 'inactive',
        ]);

        Sanctum::actingAs($inactiveUser);

        $response = $this->putJson('/api/profile/me/basic', [
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('user_profiles', [
            'user_id' => $inactiveUser->id,
        ]);
    }

    private function createUser(array $attributes = []): User
    {
        return User::create(array_merge([
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'role' => 'free',
            'status' => 'active',
            'email_verified_at' => now(),
        ], $attributes));
    }

    private function createUserWithProfile(): User
    {
        $user = $this->createUser();

        $profile = $user->profile()->create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'phone' => '+1234567890',
            'date_of_birth' => '1998-01-01',
            'nationality' => 'ID',
            'current_country' => 'ID',
            'gpa' => 3.50,
            'major' => 'Information Systems',
            'degree_level' => 'bachelor',
            'graduation_year' => 2026,
        ]);

        $profile->refreshProfileProgress();
        $profile->save();

        return $user->load('profile');
    }
}