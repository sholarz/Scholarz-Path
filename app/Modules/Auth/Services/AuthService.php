<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Auth\Jobs\SendWelcomeEmailJob;
use App\Modules\Auth\Jobs\SendPasswordResetEmailJob;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * Generate authentication token for user
     */
    public function generateToken(User $user, string $deviceName = 'api'): string
    {
        // Delete existing tokens for this device
        $user->tokens()->where('name', $deviceName)->delete();

        // Create new token
        $token = $user->createToken($deviceName, [
            'role:' . $user->role,
            'subscription:' . ($user->subscription?->status ?? 'free')
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
    public function sendPasswordResetLink(string $email): bool
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return false;
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

        return true;
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
        if ($user->subscription?->isActive()) {
            $subscriptionFeatures = $user->subscription->plan->features ?? [];
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