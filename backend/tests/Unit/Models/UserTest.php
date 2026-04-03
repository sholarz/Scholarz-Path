<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can be created with mass assignment
     */
    public function test_user_can_be_created(): void
    {
        $user = User::create([
            'email' => 'test@example.com',
            'password' => 'password123',
            'role' => 'free',
            'status' => 'active',
        ]);

        $this->assertNotNull($user->id);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('free', $user->role);
    }

    /**
     * Test user has default role
     */
    public function test_user_has_default_role_free(): void
    {
        $user = User::factory()->create();

        $this->assertEquals('free', $user->role);
    }

    /**
     * Test user has default status active
     */
    public function test_user_has_default_status_active(): void
    {
        $user = User::factory()->create();

        $this->assertEquals('active', $user->status);
    }

    /**
     * Test password is hashed
     */
    public function test_user_password_is_hashed(): void
    {
        $plainPassword = 'password123';
        
        $user = User::create([
            'email' => 'test@example.com',
            'password' => $plainPassword,
            'role' => 'free',
        ]);

        $this->assertNotEquals($plainPassword, $user->password);
    }

    /**
     * Test password hidden from serialization
     */
    public function test_user_password_is_hidden(): void
    {
        $user = User::factory()->create();

        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
    }

    /**
     * Test user has UUID primary key
     */
    public function test_user_has_uuid_primary_key(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->id);
        $this->assertIsString($user->id);
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $user->id
        );
    }

    /**
     * Test user can have profile
     */
    public function test_user_has_profile_relationship(): void
    {
        $user = User::factory()->create();
        
        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $this->assertInstanceOf(UserProfile::class, $user->profile);
        $this->assertEquals('John', $user->profile->first_name);
    }

    /**
     * Test user can be soft deleted
     */
    public function test_user_can_be_soft_deleted(): void
    {
        $user = User::factory()->create();
        $userId = $user->id;

        $user->delete();

        $this->assertNotNull($user->deleted_at);
        $this->assertNull(User::find($userId));
        $this->assertNotNull(User::withTrashed()->find($userId));
    }

    /**
     * Test user email is verified
     */
    public function test_user_email_can_be_verified(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);

        $this->assertNull($user->email_verified_at);

        $user->update(['email_verified_at' => now()]);

        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Test user with different roles
     */
    public function test_user_can_have_different_roles(): void
    {
        $freeUser = User::factory()->create(['role' => 'free']);
        $premiumUser = User::factory()->create(['role' => 'premium']);
        $adminUser = User::factory()->create(['role' => 'admin']);

        $this->assertEquals('free', $freeUser->role);
        $this->assertEquals('premium', $premiumUser->role);
        $this->assertEquals('admin', $adminUser->role);
    }

    /**
     * Test user with different statuses
     */
    public function test_user_can_have_different_statuses(): void
    {
        $activeUser = User::factory()->create(['status' => 'active']);
        $inactiveUser = User::factory()->create(['status' => 'inactive']);
        $bannedUser = User::factory()->create(['status' => 'banned']);

        $this->assertEquals('active', $activeUser->status);
        $this->assertEquals('inactive', $inactiveUser->status);
        $this->assertEquals('banned', $bannedUser->status);
    }
}
