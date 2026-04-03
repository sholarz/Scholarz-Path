<?php

namespace Tests\Unit\Services;

use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use App\Models\UserProfile;
use App\Modules\Matching\Services\MatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchingServiceTest extends TestCase
{
    use RefreshDatabase;

    private MatchingService $matchingService;
    private User $user;
    private ScholarshipProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create matching service with dependencies
        $this->matchingService = app(MatchingService::class);
        
        $this->user = User::factory()->create();

        $this->provider = ScholarshipProvider::create([
            'name' => 'Test Provider',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);
    }

    /**
     * Test find matches returns array
     */
    public function test_find_matches_returns_array(): void
    {
        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertIsArray($matches);
    }

    /**
     * Test find matches with no scholarships returns empty array
     */
    public function test_find_matches_with_no_scholarships_returns_empty(): void
    {
        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertCount(0, $matches);
    }

    /**
     * Test find matches with active scholarship
     */
    public function test_find_matches_includes_active_scholarships(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Test Scholarship',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science', 'Engineering']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertGreaterThan(0, $matches);
    }

    /**
     * Test find matches excludes inactive scholarships
     */
    public function test_find_matches_excludes_inactive_scholarships(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Inactive Scholarship',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'closed',  // Inactive
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertCount(0, $matches);
    }

    /**
     * Test find matches excludes past deadline scholarships
     */
    public function test_find_matches_excludes_past_deadline_scholarships(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Past Deadline',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->subDays(1)->toDateString(), // Past deadline
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertCount(0, $matches);
    }

    /**
     * Test match results include required fields
     */
    public function test_match_result_includes_required_fields(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Complete Scholarship',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        $this->assertNotEmpty($matches);
        $match = $matches[0];

        $this->assertArrayHasKey('scholarship', $match);
        $this->assertArrayHasKey('match_score', $match);
        $this->assertArrayHasKey('criteria_met', $match);
        $this->assertArrayHasKey('criteria_missing', $match);
    }

    /**
     * Test match score between 0-100
     */
    public function test_match_score_is_between_0_and_100(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Score Test',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 3.0,
            'fields_of_study' => json_encode(['Engineering']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        if (!empty($matches)) {
            $match = $matches[0];
            $this->assertGreaterThanOrEqual(0, $match['match_score']);
            $this->assertLessThanOrEqual(100, $match['match_score']);
        }
    }

    /**
     * Test match score above 30% threshold
     */
    public function test_only_matches_above_threshold_are_returned(): void
    {
        // Create scholarship with very high requirements (unlikely match)
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'High Requirements',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'phd',
            'minimum_gpa' => 3.9,
            'fields_of_study' => json_encode(['Rocket Science', 'Quantum Physics']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 2.0,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        // All matches should have score >= 30
        foreach ($matches as $match) {
            $this->assertGreaterThanOrEqual(30, $match['match_score']);
        }
    }

    /**
     * Test matches are sorted by score (highest first)
     */
    public function test_matches_are_sorted_by_score_descending(): void
    {
        // Create scholarships with different match potential
        $easyScholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Easy Match',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 1.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $hardScholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Hard Match',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'phd',
            'minimum_gpa' => 3.8,
            'fields_of_study' => json_encode(['Physics', 'Mathematics']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        if (count($matches) > 1) {
            for ($i = 0; $i < count($matches) - 1; $i++) {
                $this->assertGreaterThanOrEqual(
                    $matches[$i + 1]['match_score'],
                    $matches[$i]['match_score']
                );
            }
        }
    }

    /**
     * Test criteria_met is array
     */
    public function test_criteria_met_is_array(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Array Test',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->addDays(30)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        if (!empty($matches)) {
            $match = $matches[0];
            $this->assertIsArray($match['criteria_met']);
            $this->assertIsArray($match['criteria_missing']);
        }
    }

    /**
     * Test scholarship data is included in match result
     */
    public function test_scholarship_data_in_match_result(): void
    {
        $scholarship = Scholarship::create([
            'provider_id' => $this->provider->id,
            'title' => 'Data Test Scholarship',
            'description' => 'Test description',
            'amount' => 150000000,
            'currency' => 'USD',
            'type' => 'partial',
            'level' => 'master',
            'minimum_gpa' => 2.0,
            'fields_of_study' => json_encode(['Computer Science']),
            'application_deadline' => now()->addDays(45)->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
        ]);

        $criteria = [
            'gpa' => 3.5,
            'major' => 'Computer Science',
            'degree_level' => 'master',
            'languages' => [],
        ];

        $matches = $this->matchingService->findMatches($this->user, $criteria);

        if (!empty($matches)) {
            $match = $matches[0];
            $this->assertEquals('Data Test Scholarship', $match['scholarship']['title']);
            $this->assertEquals(150000000, $match['scholarship']['amount']);
            $this->assertEquals('USD', $match['scholarship']['currency']);
            $this->assertEquals('master', $match['scholarship']['level']);
        }
    }
}
