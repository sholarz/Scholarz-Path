<?php

namespace Tests\Unit\Models;

use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarshipTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test scholarship can be created
     */
    public function test_scholarship_can_be_created(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Test Provider',
            'country' => 'Indonesia',
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Test Scholarship',
            'description' => 'Test Description',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'status' => 'active',
        ]);

        $this->assertNotNull($scholarship->id);
        $this->assertEquals('Test Scholarship', $scholarship->title);
        $this->assertEquals(100000000, $scholarship->amount);
    }

    /**
     * Test scholarship belongs to provider
     */
    public function test_scholarship_belongs_to_provider(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider Name',
            'country' => 'Indonesia',
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship Title',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $this->assertInstanceOf(ScholarshipProvider::class, $scholarship->provider);
        $this->assertEquals($provider->id, $scholarship->provider->id);
    }

    /**
     * Test scholarship can track view count
     */
    public function test_scholarship_can_track_view_count(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
            'view_count' => 0,
        ]);

        $this->assertEquals(0, $scholarship->view_count);

        $scholarship->increment('view_count');

        $this->assertEquals(1, $scholarship->refresh()->view_count);
    }

    /**
     * Test scholarship can track application count
     */
    public function test_scholarship_can_track_application_count(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
            'application_count' => 0,
        ]);

        $this->assertEquals(0, $scholarship->application_count);

        $scholarship->increment('application_count', 5);

        $this->assertEquals(5, $scholarship->refresh()->application_count);
    }

    /**
     * Test scholarship stores JSON requirements
     */
    public function test_scholarship_stores_json_fields(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $requirements = ['Bachelor Degree', 'Minimum GPA 3.0', 'CV'];
        $fields = ['Engineering', 'Computer Science'];

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
            'requirements' => json_encode($requirements),
            'fields_of_study' => json_encode($fields),
        ]);

        $this->assertIsArray(json_decode($scholarship->requirements, true));
        $this->assertIsArray(json_decode($scholarship->fields_of_study, true));
    }

    /**
     * Test scholarship has different types
     */
    public function test_scholarship_has_different_types(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $fullScholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Full Scholarship',
            'type' => 'full',
            'amount' => 100000000,
            'currency' => 'IDR',
        ]);

        $partialScholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Partial Scholarship',
            'type' => 'partial',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $this->assertEquals('full', $fullScholarship->type);
        $this->assertEquals('partial', $partialScholarship->type);
    }

    /**
     * Test scholarship has different levels
     */
    public function test_scholarship_has_different_levels(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $scholarships = [];
        foreach (['bachelor', 'master', 'phd'] as $level) {
            $scholarships[$level] = Scholarship::create([
                'provider_id' => $provider->id,
                'title' => "Scholarship - {$level}",
                'level' => $level,
                'amount' => 50000000,
                'currency' => 'IDR',
            ]);
        }

        $this->assertEquals('bachelor', $scholarships['bachelor']->level);
        $this->assertEquals('master', $scholarships['master']->level);
        $this->assertEquals('phd', $scholarships['phd']->level);
    }

    /**
     * Test scholarship can be featured
     */
    public function test_scholarship_can_be_featured(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $featured = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Featured Scholarship',
            'is_featured' => true,
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $notFeatured = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Regular Scholarship',
            'is_featured' => false,
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $this->assertTrue($featured->is_featured);
        $this->assertFalse($notFeatured->is_featured);
    }

    /**
     * Test scholarship has different statuses
     */
    public function test_scholarship_has_different_statuses(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $active = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Active Scholarship',
            'status' => 'active',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $closed = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Closed Scholarship',
            'status' => 'closed',
            'amount' => 50000000,
            'currency' => 'IDR',
        ]);

        $this->assertEquals('active', $active->status);
        $this->assertEquals('closed', $closed->status);
    }

    /**
     * Test scholarship has UUID primary key
     */
    public function test_scholarship_has_uuid_primary_key(): void
    {
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

        $this->assertNotNull($scholarship->id);
        $this->assertIsString($scholarship->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $scholarship->id
        );
    }

    /**
     * Test scholarship stores application deadline
     */
    public function test_scholarship_stores_application_deadline(): void
    {
        $provider = ScholarshipProvider::create([
            'name' => 'Provider',
            'country' => 'Indonesia',
        ]);

        $deadline = now()->addDays(30)->toDateString();

        $scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Scholarship',
            'amount' => 50000000,
            'currency' => 'IDR',
            'application_deadline' => $deadline,
        ]);

        $this->assertEquals($deadline, $scholarship->application_deadline);
    }
}
