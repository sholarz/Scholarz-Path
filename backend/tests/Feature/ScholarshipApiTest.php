<?php

namespace Tests\Feature;

use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarshipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_scholarship_index_returns_paginated_data(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'LPDP',
            'website' => 'https://lpdp.kemenkeu.go.id',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'LPDP Full Scholarship',
            'description' => 'Scholarship for master degree',
            'amount' => 500000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'master',
            'target_countries' => json_encode(['Indonesia']),
            'eligible_nationalities' => json_encode(['Indonesia']),
            'fields_of_study' => json_encode(['All']),
            'minimum_gpa' => 3.25,
            'language_requirements' => json_encode(['english' => 'IELTS 6.5']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
            'is_featured' => true,
        ]);

        $response = $this->getJson('/api/scholarships');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'scholarships',
                    'pagination' => ['total', 'per_page', 'current_page', 'last_page'],
                ],
            ]);
    }

    public function test_public_scholarship_detail_returns_data_and_increments_view_count(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Kemendikbud',
            'website' => 'https://kemdikbud.go.id',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Beasiswa Unggulan',
            'description' => 'Scholarship description',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'merit',
            'level' => 'bachelor',
            'application_deadline' => now()->addDays(20)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
            'view_count' => 0,
        ]);

        $response = $this->getJson("/api/scholarships/{$scholarship->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.scholarship.id', $scholarship->id);

        $this->assertEquals(1, $scholarship->fresh()->view_count);
    }

    public function test_public_scholarship_detail_returns_404_for_missing_id(): void
    {
        $response = $this->getJson('/api/scholarships/550e8400-e29b-41d4-a716-446655440000');

        $response->assertStatus(404);
    }

    public function test_bookmark_endpoint_requires_authentication(): void
    {
        $response = $this->postJson('/api/scholarships/550e8400-e29b-41d4-a716-446655440000/bookmark');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_bookmark_and_remove_bookmark(): void
    {
        $user = User::factory()->create();

        $provider = ScholarshipProvider::create([
            'name' => 'UI',
            'website' => 'https://ui.ac.id',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'UI Fellowship',
            'description' => 'Scholarship description',
            'amount' => 80000000,
            'currency' => 'IDR',
            'type' => 'partial',
            'level' => 'master',
            'application_deadline' => now()->addDays(40)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/scholarships/{$scholarship->id}/bookmark")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('scholarship_matches', [
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'is_bookmarked' => true,
        ]);

        $this->deleteJson("/api/scholarships/{$scholarship->id}/bookmark")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('scholarship_matches', [
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'is_bookmarked' => false,
        ]);
    }

    public function test_authenticated_user_can_get_bookmarks(): void
    {
        $user = User::factory()->create();

        $provider = ScholarshipProvider::create([
            'name' => 'ITB',
            'website' => 'https://itb.ac.id',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'ITB Scholarship',
            'description' => 'Scholarship description',
            'amount' => 70000000,
            'currency' => 'IDR',
            'type' => 'partial',
            'level' => 'bachelor',
            'application_deadline' => now()->addDays(15)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
        ]);

        $user->scholarshipMatches()->create([
            'scholarship_id' => $scholarship->id,
            'match_score' => 85,
            'is_bookmarked' => true,
        ]);

        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/scholarships/bookmarks')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'scholarships',
                    'pagination' => ['total', 'per_page', 'current_page'],
                ],
            ]);
    }
}
