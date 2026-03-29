<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ForumController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['message' => 'Forum endpoint']);
    }
}
