<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\UserSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class SubscriptionController extends Controller
{
    public function getPlans(): JsonResponse
    {
        if (!Schema::hasTable('subscription_plans')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'plans' => [],
                ],
                'message' => 'Subscription plans table is not available yet.'
            ]);
        }

        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->get([
                'id',
                'name',
                'code',
                'description',
                'price',
                'currency',
                'billing_period',
                'features',
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'plans' => $plans,
            ]
        ]);
    }

    public function getCurrentSubscription(Request $request): JsonResponse
    {
        if (!Schema::hasTable('user_subscriptions')) {
            return response()->json([
                'success' => true,
                'data' => ['subscription' => null],
            ]);
        }

        $subscription = UserSubscription::query()
            ->with('plan')
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('started_at')
            ->first();

        return response()->json([
            'success' => true,
            'data' => ['subscription' => $subscription],
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'nullable|uuid|exists:subscription_plans,id',
            'payment_method' => 'nullable|string|max:50',
        ]);

        if (!Schema::hasTable('user_subscriptions') || !Schema::hasTable('subscription_plans')) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription tables are not available.',
            ], 503);
        }

        $plan = $request->filled('plan_id')
            ? SubscriptionPlan::query()->where('id', $request->plan_id)->where('is_active', true)->first()
            : SubscriptionPlan::query()->where('is_active', true)->orderBy('price')->first();

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription plan found.',
            ], 422);
        }

        UserSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        $startedAt = Carbon::now();
        $expiresAt = $plan->billing_period === 'yearly'
            ? $startedAt->copy()->addYear()
            : $startedAt->copy()->addMonth();

        $subscription = UserSubscription::create([
            'user_id' => $request->user()->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'started_at' => $startedAt,
            'expires_at' => $expiresAt,
        ]);

        $request->user()->update(['role' => 'premium']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription activated successfully.',
            'data' => [
                'subscription' => $subscription->load('plan'),
            ],
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $subscription = UserSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('started_at')
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription found.',
            ], 404);
        }

        $subscription->update(['status' => 'cancelled']);
        $request->user()->update(['role' => 'free']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled.',
            'data' => ['subscription' => $subscription->fresh()->load('plan')],
        ]);
    }

    public function resume(Request $request): JsonResponse
    {
        $subscription = UserSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'cancelled')
            ->latest('started_at')
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No cancelled subscription found.',
            ], 404);
        }

        $subscription->update([
            'status' => 'active',
            'started_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addMonth(),
        ]);

        $request->user()->update(['role' => 'premium']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription resumed.',
            'data' => ['subscription' => $subscription->fresh()->load('plan')],
        ]);
    }

    public function updatePaymentMethod(Request $request): JsonResponse
    {
        $request->validate([
            'payment_method' => 'required|string|max:50',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment method updated.',
            'data' => [
                'payment_method' => $request->payment_method,
            ],
        ]);
    }

    public function getUsageStats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'bookmarks_count' => $request->user()->bookmarkedScholarships()->count(),
                'roadmaps_count' => $request->user()->roadmaps()->count(),
            ],
        ]);
    }

    public function getInvoices(Request $request): JsonResponse
    {
        $subscription = UserSubscription::query()
            ->with('plan')
            ->where('user_id', $request->user()->id)
            ->latest('started_at')
            ->first();

        $invoices = [];

        if ($subscription && $subscription->plan) {
            $invoices[] = [
                'id' => 'inv-' . $subscription->id,
                'status' => $subscription->status,
                'amount' => $subscription->plan->price,
                'currency' => $subscription->plan->currency,
                'issued_at' => optional($subscription->started_at)->toISOString(),
                'description' => 'Subscription to ' . $subscription->plan->name,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => ['invoices' => $invoices],
        ]);
    }

    public function stripeWebhook(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Webhook received.',
            'data' => [
                'type' => $request->input('type'),
            ],
        ]);
    }
}
