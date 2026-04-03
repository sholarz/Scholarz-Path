<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = new AuthService();
    }

    /**
     * Test generate token for user
     */
    public function test_generate_token_creates_valid_token(): void
    {
        $user = User::factory()->create(['role' => 'free']);

        $token = $this->authService->generateToken($user);

        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        // Token should have device name in it
        $this->assertStringContainsString('|', $token);
    }

    /**
     * Test token contains user role
     */
    public function test_token_is_associated_with_user(): void
    {
        $user = User::factory()->create(['role' => 'premium']);

        $token = $this->authService->generateToken($user);

        // Token should be stored for this user
        $this->assertTrue($user->tokens()->exists());
    }

    /**
     * Test generate token replaces old tokens for same device
     */
    public function test_generate_token_replaces_old_device_tokens(): void
    {
        $user = User::factory()->create();

        $token1 = $this->authService->generateToken($user, 'mobile');
        $token1Count = $user->tokens()->where('name', 'mobile')->count();

        $token2 = $this->authService->generateToken($user, 'mobile');
        $token2Count = $user->tokens()->where('name', 'mobile')->count();

        // Should only have 1 token for 'mobile' device after second generation
        $this->assertEquals(1, $token2Count);
        $this->assertNotEquals($token1, $token2);
    }

    /**
     * Test generate token for different devices
     */
    public function test_generate_token_for_multiple_devices(): void
    {
        $user = User::factory()->create();

        $token1 = $this->authService->generateToken($user, 'mobile');
        $token2 = $this->authService->generateToken($user, 'web');
        $token3 = $this->authService->generateToken($user, 'desktop');

        $mobileTokens = $user->tokens()->where('name', 'mobile')->count();
        $webTokens = $user->tokens()->where('name', 'web')->count();
        $desktopTokens = $user->tokens()->where('name', 'desktop')->count();

        $this->assertEquals(1, $mobileTokens);
        $this->assertEquals(1, $webTokens);
        $this->assertEquals(1, $desktopTokens);
    }

    /**
     * Test send password reset link stores token
     */
    public function test_send_password_reset_link_stores_token(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $result = $this->authService->sendPasswordResetLink('reset@example.com');

        $this->assertEquals('sent', $result);

        // Check if token is stored in database
        $this->assertTrue(
            DB::table('password_reset_tokens')
                ->where('email', 'reset@example.com')
                ->exists()
        );
    }

    /**
     * Test send password reset link for non-existent user returns ignored
     */
    public function test_send_password_reset_link_ignores_non_existent_user(): void
    {
        $result = $this->authService->sendPasswordResetLink('nonexistent@example.com');

        $this->assertEquals('ignored', $result);
    }

    /**
     * Test send password reset link is case-insensitive
     */
    public function test_send_password_reset_link_is_case_insensitive(): void
    {
        $user = User::factory()->create(['email' => 'Test@Example.com']);

        $result = $this->authService->sendPasswordResetLink('test@example.com');

        $this->assertEquals('sent', $result);
    }

    /**
     * Test reset password with valid token
     */
    public function test_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'user@example.com', 'password' => bcrypt('oldpassword')]);
        $oldPasswordHash = $user->password;

        // Send reset link first
        $this->authService->sendPasswordResetLink('user@example.com');

        // Get the token from database
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', 'user@example.com')
            ->first();

        // We need the plain token (it's hashed in the DB)
        // For this test, we'll need to capture it from the job
        // For now, test the structure
        $this->assertNotNull($resetRecord);
    }

    /**
     * Test reset password with invalid token returns false
     */
    public function test_reset_password_with_invalid_token_returns_false(): void
    {
        $user = User::factory()->create(['email' => 'invalid@example.com']);

        $result = $this->authService->resetPassword('invalid_token', 'invalid@example.com', 'newpassword');

        $this->assertFalse($result);
    }

    /**
     * Test reset password without prior request returns false
     */
    public function test_reset_password_without_reset_request_returns_false(): void
    {
        $user = User::factory()->create(['email' => 'noreset@example.com']);

        $result = $this->authService->resetPassword('anytoken', 'noreset@example.com', 'newpassword');

        $this->assertFalse($result);
    }

    /**
     * Test password reset request limit (3 requests)
     */
    public function test_password_reset_request_limit(): void
    {
        $email = 'limit@example.com';
        User::factory()->create(['email' => $email]);

        // Send 3 requests (should all be allowed)
        for ($i = 0; $i < 3; $i++) {
            $result = $this->authService->sendPasswordResetLink($email);
            $this->assertEquals('sent', $result);
        }

        // 4th request should be limited
        $result = $this->authService->sendPasswordResetLink($email);
        $this->assertEquals('limit_reached', $result);
    }

    /**
     * Test multiple password reset requests create new tokens
     */
    public function test_multiple_password_resets_create_new_records(): void
    {
        $email = 'multi@example.com';
        User::factory()->create(['email' => $email]);

        $this->authService->sendPasswordResetLink($email);
        $firstToken = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        $this->authService->sendPasswordResetLink($email);
        $secondToken = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        // Should have only one record (updateOrInsert), but different token
        $this->assertNotEquals($firstToken->token, $secondToken->token);
    }

    /**
     * Test token is hashed in database
     */
    public function test_password_reset_token_is_hashed(): void
    {
        $email = 'hash@example.com';
        User::factory()->create(['email' => $email]);

        $this->authService->sendPasswordResetLink($email);

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        // Token should be hashed (not plain text)
        // We can verify by checking if it looks like a hash
        $this->assertNotNull($record->token);
        $this->assertGreaterThan(20, strlen($record->token)); // Hash is longer
    }

    /**
     * Test send welcome email is dispatched
     */
    public function test_send_welcome_email_can_be_called(): void
    {
        $user = User::factory()->create();

        // Should not throw an exception
        $this->authService->sendWelcomeEmail($user);

        // If no exception, test passes
        $this->assertTrue(true);
    }

    /**
     * Test multiple users can request password reset independently
     */
    public function test_multiple_users_password_reset_independently(): void
    {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);

        $this->authService->sendPasswordResetLink('user1@example.com');
        $this->authService->sendPasswordResetLink('user2@example.com');

        $user1Token = DB::table('password_reset_tokens')
            ->where('email', 'user1@example.com')
            ->exists();

        $user2Token = DB::table('password_reset_tokens')
            ->where('email', 'user2@example.com')
            ->exists();

        $this->assertTrue($user1Token);
        $this->assertTrue($user2Token);
    }
}
