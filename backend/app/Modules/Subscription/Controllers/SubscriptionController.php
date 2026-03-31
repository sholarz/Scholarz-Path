<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
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
}
