<?php

namespace App\Modules\Matching\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingController extends Controller
{
    public function performMatching(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Matching endpoint']);
    }

    public function getMatchHistory(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }
}
