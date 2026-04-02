<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Auth\Jobs\SendWelcomeEmailJob;
use App\Modules\Auth\Jobs\SendPasswordResetEmailJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * Generate authentication token for user
     */
    public function generateToken(User $user, string $deviceName = 'api'): string
    {
        $subscriptionStatus = 'free';
        if (Schema::hasTable('user_subscriptions')) {
            $subscriptionStatus = $user->subscription?->status ?? 'free';
        }

        // Delete existing tokens for this device
        $user->tokens()->where('name', $deviceName)->delete();

        // Create new token
        $token = $user->createToken($deviceName, [
            'role:' . $user->role,
            'subscription:' . $subscriptionStatus
        ]);

        return $token->plainTextToken;
    }

    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail(User $user): void
    {
        SendWelcomeEmailJob::dispatch($user);
    }

    /**
     * Send password reset link
     */
    public function sendPasswordResetLink(string $email): string
    {
        $normalizedEmail = strtolower(trim($email));
        $requestCountKey = 'password_reset_request_count:'.sha1($normalizedEmail);

        $maxRequests = (int) config('auth.passwords.users.max_requests', 3);
        $requestWindowMinutes = (int) config('auth.passwords.users.request_window_minutes', 1440);
        $currentCount = (int) Cache::get($requestCountKey, 0);

        if ($maxRequests > 0 && $currentCount >= $maxRequests) {
            return 'limit_reached';
        }

        if ($requestWindowMinutes > 0) {
            Cache::put($requestCountKey, $currentCount + 1, now()->addMinutes($requestWindowMinutes));
        } else {
            Cache::forever($requestCountKey, $currentCount + 1);
        }

        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return 'ignored';
        }

        // Generate reset token
        $token = Str::random(60);
        
        // Store reset token in database
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'email' => $email,
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        // Send reset email
        SendPasswordResetEmailJob::dispatch($user, $token);

        return 'sent';
    }

    /**
     * Reset user password
     */
    public function resetPassword(string $token, string $email, string $password): bool
    {
        // Find reset record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$resetRecord || !Hash::check($token, $resetRecord->token)) {
            return false;
        }

        // Check if token is not expired (1 hour)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return false;
        }

        // Update user password
        $user = User::where('email', $email)->first();
        if ($user) {
            $user->update([
                'password' => Hash::make($password),
                'email_verified_at' => $user->email_verified_at ?? now()
            ]);

            // Delete reset record
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            // Revoke all existing tokens
            $user->tokens()->delete();

            // Allow future password reset requests after successful reset.
            Cache::forget('password_reset_request_count:'.sha1(strtolower(trim($email))));

            return true;
        }

        return false;
    }

    /**
     * Verify user email
     */
    public function verifyEmail(string $token): bool
    {
        // Find verification record
        $verificationRecord = DB::table('email_verifications')
            ->where('token', $token)
            ->first();

        if (!$verificationRecord) {
            return false;
        }

        // Check if token is not expired (24 hours)
        if (now()->diffInHours($verificationRecord->created_at) > 24) {
            DB::table('email_verifications')->where('token', $token)->delete();
            return false;
        }

        // Update user email verification
        $user = User::where('email', $verificationRecord->email)->first();
        if ($user && !$user->email_verified_at) {
            $user->update([
                'email_verified_at' => now()
            ]);

            // Delete verification record
            DB::table('email_verifications')->where('token', $token)->delete();

            return true;
        }

        return false;
    }

    /**
     * Check if user has valid session
     */
    public function validateToken(string $token): ?User
    {
        $accessToken = PersonalAccessToken::findToken($token);
        
        if (!$accessToken) {
            return null;
        }

        return $accessToken->tokenable;
    }

    /**
     * Get user permissions based on role and subscription
     */
    public function getUserPermissions(User $user): array
    {
        $basePermissions = match($user->role) {
            'admin' => [
                'admin_dashboard', 'manage_users', 'manage_scholarships',
                'moderate_forum', 'view_analytics', 'system_config'
            ],
            'premium' => [
                'unlimited_matching', 'unlimited_roadmaps', 'advanced_filters',
                'export_data', 'priority_support'
            ],
            'free' => [
                'basic_matching', 'limited_roadmaps', 'forum_access',
                'scholarship_browsing'
            ],
            default => ['guest_browsing']
        };

        // Add subscription-based permissions
        if (Schema::hasTable('user_subscriptions') && $user->subscription?->isActive()) {
            $subscriptionFeatures = $user->subscription?->plan?->features ?? [];
            $basePermissions = array_merge($basePermissions, $subscriptionFeatures);
        }

        return array_unique($basePermissions);
    }

    /**
     * Log authentication activity
     */
    public function logAuthActivity(User $user, string $action, array $metadata = []): void
    {
        $user->activityLogs()->create([
            'action' => $action,
            'description' => "User {$action}",
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'metadata' => $metadata
        ]);
    }
}