<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Requests\RegisterRequest;
use App\Modules\Auth\Services\AuthService;
use App\Modules\User\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private UserService $userService
    ) {}

    /**
     * User login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only(['email', 'password']);
            
            if (!Auth::attempt($credentials)) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.']
                ]);
            }

            $user = Auth::user();
            $token = $this->authService->generateToken($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'role' => $user->role,
                        'profile' => $user->profile ? [
                            'first_name' => $user->profile->first_name,
                            'last_name' => $user->profile->last_name,
                            'profile_completion_percentage' => $user->profile->profile_completion_percentage,
                        ] : null
                    ],
                    'token' => $token,
                    'expires_at' => now()->addDays(30)->toISOString()
                ],
                'message' => 'Login successful'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTHENTICATION_ERROR',
                    'message' => 'Invalid credentials',
                    'details' => $e->errors()
                ]
            ], 401);
        }
    }

    /**
     * User registration
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $firstName = $request->first_name;
            $lastName = $request->last_name;

            if ($request->filled('name')) {
                $nameParts = preg_split('/\s+/', trim($request->name)) ?: [];
                $firstName = $nameParts[0] ?? 'User';
                $lastName = implode(' ', array_slice($nameParts, 1)) ?: 'User';
            }

            $userData = [
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'free',
            ];

            $user = $this->userService->createUser($userData, [
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);

            $token = $this->authService->generateToken($user);

            // Send welcome email
            $this->authService->sendWelcomeEmail($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                    'token' => $token,
                ],
                'message' => 'Registration successful'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'REGISTRATION_ERROR',
                    'message' => 'Registration failed',
                    'details' => $e->getMessage()
                ]
            ], 422);
        }
    }

    /**
     * User logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'LOGOUT_ERROR',
                    'message' => 'Logout failed'
                ]
            ], 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $newToken = $this->authService->generateToken($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $newToken,
                    'expires_at' => now()->addDays(30)->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TOKEN_REFRESH_ERROR',
                    'message' => 'Token refresh failed'
                ]
            ], 401);
        }
    }

    /**
     * Forgot password
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        try {
            $this->authService->sendPasswordResetLink($request->email);

            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PASSWORD_RESET_ERROR',
                    'message' => 'Failed to send password reset link'
                ]
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $result = $this->authService->resetPassword(
                $request->token,
                $request->email,
                $request->password
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password reset successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN',
                    'message' => 'Invalid or expired reset token'
                ]
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PASSWORD_RESET_ERROR',
                    'message' => 'Password reset failed'
                ]
            ], 500);
        }
    }

    /**
     * Verify email
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $result = $this->authService->verifyEmail($request->token);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Email verified successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN',
                    'message' => 'Invalid or expired verification token'
                ]
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'EMAIL_VERIFICATION_ERROR',
                    'message' => 'Email verification failed'
                ]
            ], 500);
        }
    }

    /**
     * Get Google OAuth redirect URL
     */
    public function googleRedirect(): JsonResponse
    {
        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret')) || blank(config('services.google.redirect'))) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'GOOGLE_OAUTH_NOT_CONFIGURED',
                    'message' => 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URL in backend .env.',
                ]
            ], 503);
        }

        $redirectUrl = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'redirect_url' => $redirectUrl,
            ]
        ]);
    }

    /**
     * Handle Google OAuth callback
     */
    public function googleCallback(Request $request): JsonResponse|RedirectResponse
    {
        try {
            if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret')) || blank(config('services.google.redirect'))) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'GOOGLE_OAUTH_NOT_CONFIGURED',
                        'message' => 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URL in backend .env.',
                    ]
                ], 503);
            }

            $googleUser = Socialite::driver('google')->stateless()->user();

            $email = $googleUser->getEmail();
            if (!$email) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'GOOGLE_EMAIL_MISSING',
                        'message' => 'Google account has no email.'
                    ]
                ], 422);
            }

            $user = User::query()
                ->where('provider', 'google')
                ->where('provider_id', $googleUser->getId())
                ->first();

            if (!$user) {
                $user = User::where('email', $email)->first();
            }

            if (!$user) {
                $nameParts = preg_split('/\s+/', trim($googleUser->getName() ?? '')) ?: [];
                $firstName = $nameParts[0] ?? 'User';
                $lastName = implode(' ', array_slice($nameParts, 1)) ?: 'User';

                $user = $this->userService->createUser([
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                    'role' => 'free',
                    'email_verified_at' => now(),
                    'provider' => 'google',
                    'provider_id' => $googleUser->getId(),
                ], [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                ]);
            } else {
                $user->update([
                    'provider' => $user->provider ?? 'google',
                    'provider_id' => $user->provider_id ?? $googleUser->getId(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);

                if (!$user->profile && $googleUser->getName()) {
                    $nameParts = preg_split('/\s+/', trim($googleUser->getName())) ?: [];
                    $firstName = $nameParts[0] ?? 'User';
                    $lastName = implode(' ', array_slice($nameParts, 1)) ?: 'User';
                    $user->profile()->create([
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'profile_completion_percentage' => 20,
                    ]);
                }
            }

            $token = $this->authService->generateToken($user);

            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $redirectUrl = $frontendUrl . '/auth/google/callback#token=' . urlencode($token);

            if (!$request->expectsJson()) {
                return redirect()->away($redirectUrl);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'role' => $user->role,
                        'profile' => $user->profile ? [
                            'first_name' => $user->profile->first_name,
                            'last_name' => $user->profile->last_name,
                            'profile_completion_percentage' => $user->profile->profile_completion_percentage,
                        ] : null
                    ],
                    'token' => $token,
                    'expires_at' => now()->addDays(30)->toISOString()
                ],
                'message' => 'Google login successful'
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'GOOGLE_AUTH_ERROR',
                    'message' => 'Google authentication failed',
                    'details' => $exception->getMessage(),
                ]
            ], 500);
        }
    }
}