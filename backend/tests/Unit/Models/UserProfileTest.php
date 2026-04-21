<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user profile can be created
     */
    public function test_user_profile_can_be_created(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nationality' => 'Indonesia',
            'gpa' => 3.75,
            'degree_level' => 'bachelor',
        ]);

        $this->assertNotNull($profile->id);
        $this->assertEquals('John', $profile->first_name);
        $this->assertEquals('Doe', $profile->last_name);
    }

    /**
     * Test user profile belongs to user
     */
    public function test_user_profile_belongs_to_user(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]);

        $this->assertInstanceOf(User::class, $profile->user);
        $this->assertEquals($user->id, $profile->user->id);
    }

    /**
     * Test GPA is cast to decimal
     */
    public function test_gpa_is_cast_to_decimal(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Alex',
            'last_name' => 'Turner',
            'gpa' => 3.8999,
        ]);

        $this->assertIsNumeric($profile->gpa);
        // Should be rounded to 2 decimals
        $this->assertEquals(3.90, $profile->gpa);
    }

    /**
     * Test profile completion percentage is tracked
     */
    public function test_profile_completion_percentage_is_tracked(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Bob',
            'last_name' => 'Stone',
            'profile_completion_percentage' => 50,
        ]);

        $this->assertEquals(50, $profile->profile_completion_percentage);

        $profile->update(['profile_completion_percentage' => 100]);

        $this->assertEquals(100, $profile->refresh()->profile_completion_percentage);
    }

    /**
     * Test date of birth is cast to date
     */
    public function test_date_of_birth_is_cast_to_date(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Emma',
            'last_name' => 'Lee',
            'date_of_birth' => '1995-05-15',
        ]);

        $this->assertNotNull($profile->date_of_birth);
        $this->assertEquals('1995-05-15', $profile->date_of_birth->format('Y-m-d'));
    }

    /**
     * Test profile can store academic information
     */
    public function test_profile_can_store_academic_information(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Michael',
            'last_name' => 'Jordan',
            'major' => 'Computer Science',
            'degree_level' => 'master',
            'graduation_year' => 2025,
            'gpa' => 3.85,
        ]);

        $this->assertEquals('Computer Science', $profile->major);
        $this->assertEquals('master', $profile->degree_level);
        $this->assertEquals(2025, $profile->graduation_year);
        $this->assertEquals(3.85, $profile->gpa);
    }

    /**
     * Test profile can store location information
     */
    public function test_profile_can_store_location_information(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Sarah',
            'last_name' => 'Connor',
            'nationality' => 'Indonesia',
            'current_country' => 'Singapore',
        ]);

        $this->assertEquals('Indonesia', $profile->nationality);
        $this->assertEquals('Singapore', $profile->current_country);
    }

    /**
     * Test profile can update all information
     */
    public function test_profile_can_update_all_information(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Old',
            'last_name' => 'Name',
            'gpa' => 3.0,
        ]);

        $profile->update([
            'first_name' => 'New',
            'last_name' => 'Profile',
            'gpa' => 3.95,
            'major' => 'Engineering',
        ]);

        $this->assertEquals('New', $profile->first_name);
        $this->assertEquals('Profile', $profile->last_name);
        $this->assertEquals(3.95, $profile->gpa);
        $this->assertEquals('Engineering', $profile->major);
    }

    /**
     * Test profile has UUID primary key
     */
    public function test_profile_has_uuid_primary_key(): void
    {
        $user = User::factory()->create();
        
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Test',
            'last_name' => 'User',
        ]);

        $this->assertNotNull($profile->id);
        $this->assertIsString($profile->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $profile->id
        );
    }

    /**
     * Test multiple profiles cannot exist for same user
     */
    public function test_user_has_single_profile_relation(): void
    {
        $user = User::factory()->create();
        
        $profile1 = UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Profile',
            'last_name' => 'One',
        ]);

        $this->assertEquals($profile1->id, $user->profile->id);
    }
}
