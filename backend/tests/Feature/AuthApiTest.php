<?php

namespace Tests\Feature;

use App\Modules\Auth\Jobs\SendPasswordResetEmailJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Prevent queued email jobs from executing in feature tests.
        Queue::fake();
        Cache::flush();
    }

    public function test_register_returns_token_and_user_data(): void
    {
        $payload = [
            'email' => 'backendb@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'first_name' => 'Backend',
            'last_name' => 'Tester',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'backendb@example.com')
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'email', 'role', 'profile'],
                    'token',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('users', ['email' => 'backendb@example.com']);
    }

    public function test_register_validates_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'not-an-email',
            'password' => 'short',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'password_confirmation']);
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::create([
            'email' => 'login@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'email', 'role'],
                    'token',
                    'expires_at',
                ],
                'message',
            ]);
    }

    public function test_login_returns_401_for_invalid_credentials(): void
    {
        User::create([
            'email' => 'invalid-login@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'invalid-login@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'AUTHENTICATION_ERROR');
    }

    public function test_forgot_password_dispatches_email_job_and_stores_reset_token(): void
    {
        $user = User::create([
            'email' => 'forgot@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'If an account exists, a password reset link has been sent')
            ->assertJsonPath('warning', null);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);

        Queue::assertPushed(SendPasswordResetEmailJob::class);
    }

    public function test_user_can_reset_password_and_login_with_new_password(): void
    {
        $user = User::create([
            'email' => 'reset-flow@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk();

        $rawToken = null;
        Queue::assertPushed(SendPasswordResetEmailJob::class, function ($job) use ($user, &$rawToken) {
            if ($job->user->email !== $user->email) {
                return false;
            }

            $rawToken = $job->token;

            return true;
        });

        $this->assertNotNull($rawToken);

        $this->postJson('/api/auth/reset-password', [
            'token' => $rawToken,
            'email' => $user->email,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])
            ->assertStatus(401)
            ->assertJsonPath('success', false);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'NewPassword123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_forgot_password_allows_only_three_requests_per_user(): void
    {
        $user = User::create([
            'email' => 'cooldown@example.com',
            'password' => Hash::make('password123'),
            'role' => 'free',
            'status' => 'active',
        ]);

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/forgot-password', [
                'email' => $user->email,
            ])->assertOk();
        }

        Queue::assertPushed(SendPasswordResetEmailJob::class, 3);

        // Fourth request is accepted with generic response and warning, but no email is dispatched.
        $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ])
            ->assertOk()
            ->assertJsonPath('warning', 'You have reached the maximum reset-link requests (3). Please use your latest email link.');

        Queue::assertPushed(SendPasswordResetEmailJob::class, 3);
    }
}
