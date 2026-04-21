<?php

namespace Tests\Feature;

use App\Models\Roadmap;
use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchingRoadmapApiTest extends TestCase
{
    use RefreshDatabase;

    private function createScholarship(array $overrides = []): Scholarship
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Test Provider',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        return Scholarship::create(array_merge([
            'provider_id' => $provider->id,
            'title' => 'API Test Scholarship',
            'description' => 'Scholarship for API tests',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => ['Computer Science'],
            'application_deadline' => now()->addDays(45)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
        ], $overrides));
    }

    public function test_matching_returns_score_breakdown_and_criteria_arrays(): void
    {
        $user = User::factory()->create(['role' => 'premium']);
        $this->createScholarship();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/scholarships/match', [
                'gpa' => 3.5,
                'major' => 'Computer Science',
                'degree_level' => 'bachelor',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_matched', 1);

        $firstMatch = $response->json('data.matches.0');

        $this->assertIsArray($firstMatch['criteria_met']);
        $this->assertIsArray($firstMatch['criteria_missing']);
        $this->assertIsArray($firstMatch['score_breakdown']);
        $this->assertArrayHasKey('gpa', $firstMatch['score_breakdown']);
        $this->assertArrayHasKey('field_of_study', $firstMatch['score_breakdown']);
        $this->assertArrayHasKey('degree_level', $firstMatch['score_breakdown']);
    }

    public function test_free_user_matching_is_limited_to_one_run_per_day(): void
    {
        $user = User::factory()->create(['role' => 'free']);
        $this->createScholarship();

        $payload = [
            'gpa' => 3.2,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
        ];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/scholarships/match', $payload)
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/scholarships/match', $payload)
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'MATCHING_LIMIT_REACHED');
    }

    public function test_roadmap_duplicate_for_same_scholarship_returns_conflict(): void
    {
        $user = User::factory()->create(['role' => 'premium']);
        $scholarship = $this->createScholarship();

        Roadmap::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'title' => 'Existing Roadmap',
            'description' => 'Already active',
            'deadline' => now()->addDays(40)->toDateString(),
            'status' => 'active',
            'progress_percentage' => 20,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/roadmaps', ['scholarship_id' => $scholarship->id])
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'ROADMAP_DUPLICATE');
    }

    public function test_free_user_roadmap_generation_respects_90_day_limit(): void
    {
        $user = User::factory()->create(['role' => 'free']);
        $scholarship = $this->createScholarship();

        Roadmap::create([
            'user_id' => $user->id,
            'scholarship_id' => null,
            'title' => 'Recent Roadmap',
            'description' => 'Generated recently',
            'deadline' => now()->addDays(20)->toDateString(),
            'status' => 'completed',
            'progress_percentage' => 100,
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/roadmaps', ['scholarship_id' => $scholarship->id])
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'ROADMAP_LIMIT_REACHED');
    }
}
