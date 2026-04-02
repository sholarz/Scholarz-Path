<?php

namespace Tests\Feature;

use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BackendBEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_backend_b_endpoints_smoke_flow(): void
    {
        // 1) POST /api/auth/register
        $registerResponse = $this->postJson('/api/auth/register', [
            'email' => 'smoke-backendb@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'first_name' => 'Smoke',
            'last_name' => 'Tester',
        ]);

        $registerResponse->assertStatus(201)->assertJsonPath('success', true);

        // 2) POST /api/auth/login
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'smoke-backendb@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertOk()->assertJsonPath('success', true);

        // 3) GET /api/scholarships
        $provider = ScholarshipProvider::create([
            'name' => 'Smoke Provider',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Smoke Scholarship',
            'description' => 'For backend b smoke test',
            'amount' => 10000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'application_deadline' => now()->addDays(20)->toDateString(),
            'application_url' => 'https://example.com/smoke',
            'status' => 'active',
        ]);

        $this->getJson('/api/scholarships')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['scholarships', 'pagination'],
            ]);

        // 4) GET /api/scholarships/{id}
        $this->getJson('/api/scholarships/' . $scholarship->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.scholarship.id', $scholarship->id);

        // 5) GET /api/user/profile
        $user = User::create([
            'email' => 'profile-smoke@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Profile',
            'last_name' => 'Smoke',
            'profile_completion_percentage' => 40,
        ]);

        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/user/profile')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'profile-smoke@example.com');
    }
}
