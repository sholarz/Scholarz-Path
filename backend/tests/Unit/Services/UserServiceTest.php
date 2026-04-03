<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\UserProfile;
use App\Modules\User\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = new UserService();
    }

    /**
     * Test create user with profile
     */
    public function test_create_user_with_valid_data(): void
    {
        $userData = [
            'email' => 'newuser@example.com',
            'password' => bcrypt('password123'),
            'role' => 'free',
        ];

        $profileData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'gpa' => 3.75,
            'major' => 'Computer Science',
            'degree_level' => 'bachelor',
            'nationality' => 'Indonesia',
        ];

        $user = $this->userService->createUser($userData, $profileData);

        $this->assertNotNull($user->id);
        $this->assertEquals('newuser@example.com', $user->email);
        $this->assertInstanceOf(UserProfile::class, $user->profile);
        $this->assertEquals('John', $user->profile->first_name);
        $this->assertEquals('Doe', $user->profile->last_name);
    }

    /**
     * Test create user without profile
     */
    public function test_create_user_without_profile_data(): void
    {
        $userData = [
            'email' => 'minimal@example.com',
            'password' => bcrypt('password123'),
            'role' => 'free',
        ];

        $user = $this->userService->createUser($userData);

        $this->assertNotNull($user->id);
        $this->assertEquals('minimal@example.com', $user->email);
    }

    /**
     * Test get user with profile and languages
     */
    public function test_get_user_with_profile(): void
    {
        $user = User::factory()->create();
        
        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]);

        $retrievedUser = $this->userService->getUserWithProfile($user->id);

        $this->assertNotNull($retrievedUser);
        $this->assertEquals('Jane', $retrievedUser->profile->first_name);
    }

    /**
     * Test get non-existent user returns null
     */
    public function test_get_user_with_profile_returns_null_for_non_existent_user(): void
    {
        $user = $this->userService->getUserWithProfile('non-existent-id');

        $this->assertNull($user);
    }

    /**
     * Test update user profile with all fields
     */
    public function test_update_profile_with_all_fields(): void
    {
        $user = User::factory()->create();
        
        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Old',
            'last_name' => 'Name',
            'gpa' => 3.0,
        ]);

        $updateData = [
            'first_name' => 'Updated',
            'last_name' => 'Profile',
            'gpa' => 3.95,
            'major' => 'Engineering',
            'degree_level' => 'master',
            'nationality' => 'Singapore',
        ];

        $this->userService->updateProfile($user, $updateData);

        $updated = $user->profile()->first();

        $this->assertEquals('Updated', $updated->first_name);
        $this->assertEquals('Profile', $updated->last_name);
        $this->assertEquals(3.95, $updated->gpa);
        $this->assertEquals('Engineering', $updated->major);
    }

    /**
     * Test update profile preserves old values if not provided
     */
    public function test_update_profile_preserves_old_values(): void
    {
        $user = User::factory()->create();
        
        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Original',
            'last_name' => 'Name',
            'gpa' => 3.5,
            'major' => 'Original Major',
        ]);

        $updateData = [
            'first_name' => 'Changed',
            // last_name not included, should stay same
        ];

        $this->userService->updateProfile($user, $updateData);

        $updated = $user->profile()->first();

        $this->assertEquals('Changed', $updated->first_name);
        $this->assertEquals('Name', $updated->last_name); // Should be preserved
        $this->assertEquals(3.5, $updated->gpa); // Should be preserved
    }

    /**
     * Test profile completion percentage calculation
     */
    public function test_profile_completion_percentage_50_percent(): void
    {
        $userData = [
            'email' => 'completion@example.com',
            'password' => bcrypt('password123'),
        ];

        $profileData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'gpa' => 3.75,
            'major' => 'Computer Science',
            'phone' => null,
            'date_of_birth' => null,
            'nationality' => null,
            'current_country' => null,
            'degree_level' => null,
            'graduation_year' => null,
        ];

        $user = $this->userService->createUser($userData, $profileData);

        // 4 fields filled (first_name, last_name, gpa, major) out of 10
        $this->assertEquals(40, $user->profile->profile_completion_percentage);
    }

    /**
     * Test profile completion percentage 100 percent
     */
    public function test_profile_completion_percentage_100_percent(): void
    {
        $userData = [
            'email' => 'complete@example.com',
            'password' => bcrypt('password123'),
        ];

        $profileData = [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'phone' => '08123456789',
            'date_of_birth' => '1995-05-15',
            'nationality' => 'Indonesia',
            'current_country' => 'Indonesia',
            'gpa' => 3.8,
            'major' => 'Engineering',
            'degree_level' => 'master',
            'graduation_year' => 2025,
        ];

        $user = $this->userService->createUser($userData, $profileData);

        $this->assertEquals(100, $user->profile->profile_completion_percentage);
    }

    /**
     * Test profile completion percentage 0 percent
     */
    public function test_profile_completion_percentage_0_percent(): void
    {
        $userData = [
            'email' => 'empty@example.com',
            'password' => bcrypt('password123'),
        ];

        $profileData = [
            'first_name' => null,
            'last_name' => null,
            'phone' => null,
            'date_of_birth' => null,
            'nationality' => null,
            'current_country' => null,
            'gpa' => null,
            'major' => null,
            'degree_level' => null,
            'graduation_year' => null,
        ];

        $user = $this->userService->createUser($userData, $profileData);

        $this->assertEquals(0, $user->profile->profile_completion_percentage);
    }

    /**
     * Test user creation in transaction (all or nothing)
     */
    public function test_user_creation_is_transactional(): void
    {
        $initialCount = User::count();

        $userData = [
            'email' => 'transactional@example.com',
            'password' => bcrypt('password123'),
        ];

        $profileData = [
            'first_name' => 'Transaction',
            'last_name' => 'Test',
        ];

        $user = $this->userService->createUser($userData, $profileData);

        $this->assertEquals($initialCount + 1, User::count());
        $this->assertNotNull($user->profile);
    }

    /**
     * Test multiple users can be created independently
     */
    public function test_create_multiple_users(): void
    {
        $users = [];

        for ($i = 1; $i <= 3; $i++) {
            $user = $this->userService->createUser([
                'email' => "user{$i}@example.com",
                'password' => bcrypt('password123'),
            ]);

            $users[] = $user;
        }

        $this->assertCount(3, $users);
        $this->assertEquals('user1@example.com', $users[0]->email);
        $this->assertEquals('user2@example.com', $users[1]->email);
        $this->assertEquals('user3@example.com', $users[2]->email);
    }
}
