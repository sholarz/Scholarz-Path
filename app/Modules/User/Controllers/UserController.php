<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get current user details
     */
    public function getCurrentUser(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'languages');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
                'profile' => $user->profile ? [
                    'first_name' => $user->profile->first_name,
                    'last_name' => $user->profile->last_name,
                    'profile_completion_percentage' => $user->profile->profile_completion_percentage,
                ] : null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /**
     * Update email
     */
    public function updateEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email:rfc,dns|unique:users,email,' . $request->user()->id,
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Email updated successfully'
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'new_password' => 'required|string|min:8|confirmed',
            'new_password_confirmation' => 'required',
        ]);

        $request->user()->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Delete user account
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $request->user()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }
}
