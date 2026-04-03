<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\Models\Scholarship;
use App\Models\ScholarshipMatch;
use App\Models\ScholarshipProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarshipMatchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test scholarship match can be created
     */
    public function test_scholarship_match_can_be_created(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 85,
        ]);

        $this->assertNotNull($match->id);
        $this->assertEquals(85, $match->match_score);
    }

    /**
     * Test scholarship match belongs to user
     */
    public function test_scholarship_match_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 75,
        ]);

        $this->assertInstanceOf(User::class, $match->user);
        $this->assertEquals($user->id, $match->user->id);
    }

    /**
     * Test scholarship match belongs to scholarship
     */
    public function test_scholarship_match_belongs_to_scholarship(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 80,
        ]);

        $this->assertInstanceOf(Scholarship::class, $match->scholarship);
        $this->assertEquals($scholarship->id, $match->scholarship->id);
    }

    /**
     * Test scholarship match can track bookmark status
     */
    public function test_scholarship_match_can_track_bookmark_status(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 70,
            'is_bookmarked' => false,
        ]);

        $this->assertFalse($match->is_bookmarked);

        $match->update(['is_bookmarked' => true]);

        $this->assertTrue($match->refresh()->is_bookmarked);
    }

    /**
     * Test scholarship match score is stored
     */
    public function test_scholarship_match_score_is_stored(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        foreach ([30, 50, 75, 95] as $score) {
            $match = ScholarshipMatch::create([
                'user_id' => $user->id,
                'scholarship_id' => $scholarship->id,
                'match_score' => $score,
            ]);

            $this->assertEquals($score, $match->match_score);
        }
    }

    /**
     * Test scholarship match can store analysis data
     */
    public function test_scholarship_match_can_store_analysis_data(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $analysis = [
            'gpa_match' => true,
            'field_match' => true,
            'location_match' => false,
            'missing_criteria' => ['IELTS 7.0'],
        ];

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 85,
            'matching_criteria' => json_encode($analysis),
        ]);

        $stored = json_decode($match->matching_criteria, true);

        $this->assertIsArray($stored);
        $this->assertTrue($stored['gpa_match']);
        $this->assertFalse($stored['location_match']);
    }

    /**
     * Test scholarship match can store reasons
     */
    public function test_scholarship_match_can_store_reasons(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 80,
            'match_reasons' => 'Strong academic profile and relevant field of study',
        ]);

        $this->assertEquals('Strong academic profile and relevant field of study', $match->match_reasons);
    }

    /**
     * Test multiple matches for same user and scholarship
     */
    public function test_user_can_have_multiple_matches_with_same_scholarship(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match1 = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 75,
        ]);

        $match2 = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 85,
        ]);

        $matches = ScholarshipMatch::where('user_id', $user->id)
            ->where('scholarship_id', $scholarship->id)
            ->get();

        $this->assertCount(2, $matches);
    }

    /**
     * Test scholarship match has UUID primary key
     */
    public function test_scholarship_match_has_uuid_primary_key(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $match = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 80,
        ]);

        $this->assertNotNull($match->id);
        $this->assertIsString($match->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $match->id
        );
    }

    /**
     * Test match scores in valid range
     */
    public function test_match_scores_are_in_valid_range(): void
    {
        $user = User::factory()->create();
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);
        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        // Test min and max scores
        $minMatch = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 0,
        ]);

        $maxMatch = ScholarshipMatch::create([
            'user_id' => $user->id,
            'scholarship_id' => $scholarship->id,
            'match_score' => 100,
        ]);

        $this->assertEquals(0, $minMatch->match_score);
        $this->assertEquals(100, $maxMatch->match_score);
    }
}
