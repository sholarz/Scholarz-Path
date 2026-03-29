<?php

namespace App\Modules\Scraper\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScraperWebhookController extends Controller
{
    public function webhook(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Scraper webhook']);
    }
}
