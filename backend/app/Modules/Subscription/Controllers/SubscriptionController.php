<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SubscriptionController extends Controller
{
    private function syncUserRole(User $user): void
    {
        $hasConfirmedSubscription = UserSubscription::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'confirmed'])
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->exists();

        $nextRole = $hasConfirmedSubscription ? 'premium' : 'free';

        if ($user->role !== 'admin' && $user->role !== $nextRole) {
            $user->update(['role' => $nextRole]);
        }
    }

    private function logPaymentAudit(Request $request, string $action, UserSubscription $subscription, array $metadata = []): void
    {
        if (! $request->user()) {
            return;
        }

        AdminAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'target_type' => 'user_subscription',
            'target_id' => $subscription->id,
            'metadata' => json_encode($metadata, JSON_UNESCAPED_UNICODE),
        ]);
    }

    private function notifyPaymentReview(UserSubscription $subscription, string $decision, ?string $adminNote, Request $request): void
    {
        if (!Schema::hasTable('notifications')) {
            return;
        }

        $actionBy = (string) ($request->user()?->email ?? 'admin');
        $isConfirmed = $decision === 'confirmed';

        UserNotification::create([
            'user_id' => $subscription->user_id,
            'type' => $isConfirmed ? 'payment_approved' : 'payment_rejected',
            'title' => $isConfirmed ? 'Pembayaran Premium Disetujui' : 'Pembayaran Premium Ditolak',
            'message' => $isConfirmed
                ? 'Pembayaran Anda telah diverifikasi admin. Akun Anda sekarang Premium.'
                : ('Pembayaran Anda ditolak admin. ' . ($adminNote ?: 'Silakan kirim ulang bukti pembayaran yang valid.')),
            'is_read' => false,
            'link' => '/subscription-snapshot',
            'action_by' => $actionBy,
            'metadata' => json_encode([
                'subscription_id' => $subscription->id,
                'decision' => $decision,
            ], JSON_UNESCAPED_UNICODE),
        ]);
    }

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
            ->whereIn('status', ['pending', 'confirmed', 'active', 'rejected', 'cancelled'])
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
            'payment_reference' => 'nullable|string|max:100',
            'payment_proof_url' => 'nullable|url|max:500',
            'payment_note' => 'nullable|string|max:1000',
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
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $startedAt = Carbon::now();
        $expiresAt = $plan->billing_period === 'yearly'
            ? $startedAt->copy()->addYear()
            : $startedAt->copy()->addMonth();

        $subscription = UserSubscription::create([
            'user_id' => $request->user()->id,
            'plan_id' => $plan->id,
            'status' => 'pending',
            'payment_method' => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'payment_proof_url' => $request->payment_proof_url,
            'payment_note' => $request->payment_note,
            'started_at' => $startedAt,
            'expires_at' => $expiresAt,
        ]);

        $this->syncUserRole($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted. Waiting for admin confirmation.',
            'data' => [
                'subscription' => $subscription->load('plan'),
            ],
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $subscription = UserSubscription::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['active', 'confirmed'])
            ->latest('started_at')
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription found.',
            ], 404);
        }

        $subscription->update(['status' => 'cancelled']);
        $this->syncUserRole($request->user());

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
            'status' => 'pending',
            'started_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addMonth(),
            'reviewed_by' => null,
            'reviewed_at' => null,
            'admin_note' => null,
        ]);

        $this->syncUserRole($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Subscription resumed and pending admin confirmation.',
            'data' => ['subscription' => $subscription->fresh()->load('plan')],
        ]);
    }

    public function getPaymentSubmissions(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $status = $request->query('status');

        $query = UserSubscription::query()
            ->with([
                'user:id,email,role',
                'user.profile:user_id,first_name,last_name',
                'plan:id,name,code,price,currency,billing_period',
            ])
            ->when($status, fn ($builder) => $builder->where('status', $status))
            ->latest('created_at');

        return response()->json([
            'success' => true,
            'data' => [
                'payments' => $query->paginate(20),
            ],
        ]);
    }

    public function reviewPayment(Request $request, string $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'decision' => 'required|in:confirmed,rejected',
            'admin_note' => 'nullable|string|max:1000',
            'duration' => 'nullable|string',
        ]);

        $subscription = UserSubscription::query()->with(['plan', 'user'])->findOrFail($id);

        if ($subscription->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Payment is not pending review.',
            ], 422);
        }

        DB::transaction(function () use ($request, $validated, $subscription): void {
            $decision = $validated['decision'];

            $updateData = [
                'status' => $decision,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'admin_note' => $validated['admin_note'] ?? null,
            ];

            if ($decision === 'confirmed') {
                $startedAt = now();
                $months = 1;
                
                if (!empty($validated['duration'])) {
                    if (preg_match('/^(\d+)-month/', $validated['duration'], $matches)) {
                        $months = (int) $matches[1];
                    }
                } elseif ($subscription->plan && $subscription->plan->billing_period === 'yearly') {
                    $months = 12;
                }

                $updateData['started_at'] = $startedAt;
                $updateData['expires_at'] = $startedAt->copy()->addMonths($months);
            }

            $subscription->update($updateData);

            $this->syncUserRole($subscription->user);
            $this->notifyPaymentReview($subscription, $decision, $validated['admin_note'] ?? null, $request);
            $this->logPaymentAudit($request, 'review_payment_submission', $subscription, [
                'decision' => $decision,
                'admin_note' => $validated['admin_note'] ?? null,
                'user_id' => $subscription->user_id,
                'plan_id' => $subscription->plan_id,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => $validated['decision'] === 'confirmed'
                ? 'Payment confirmed and user upgraded.'
                : 'Payment rejected.',
            'data' => [
                'subscription' => $subscription->fresh()->load(['user', 'plan']),
            ],
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
