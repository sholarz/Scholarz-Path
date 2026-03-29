<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function getPlans(): JsonResponse
    {
        return response()->json(['message' => 'Subscription plans']);
    }
}
