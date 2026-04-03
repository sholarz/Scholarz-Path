<?php

namespace App\Modules\Profile\Controllers;

use App\Http\Controllers\Controller;
use App\Models\LookupCountry;
use App\Models\LookupFieldOfStudy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    // GET /api/lookups/countries
    public function countries(Request $request): JsonResponse
    {
        $query = LookupCountry::where('is_active', true);

        if ($request->boolean('popular_only')) {
            $query->where('is_popular', true);
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        $countries = $query->orderByDesc('is_popular')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'flag_emoji', 'is_popular']);

        return response()->json(['data' => $countries]);
    }

    // GET /api/lookups/fields-of-study
    public function fieldsOfStudy(Request $request): JsonResponse
    {
        $query = LookupFieldOfStudy::where('is_active', true);

        if ($request->boolean('popular_only')) {
            $query->where('is_popular', true);
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        $fields = $query->orderByDesc('is_popular')
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'is_popular']);

        return response()->json(['data' => $fields]);
    }

    // GET /api/lookups/budget-preferences
public function budgetPreferences(): JsonResponse
{
    return response()->json([
        'data' => [
            ['value' => 'full_scholarship',    'label' => 'Full Scholarship'],
            ['value' => 'partial_scholarship', 'label' => 'Partial Scholarship'],
            ['value' => 'self_funded',         'label' => 'Self-funded'],
        ]
    ]);
}

// GET /api/lookups/start-years
public function startYears(): JsonResponse
{
    $currentYear = now()->year;
    $years = collect(range($currentYear, $currentYear + 4))
        ->map(fn($year) => ['value' => $year, 'label' => (string) $year]);

    return response()->json(['data' => $years]);
}

// GET /api/lookups/language-test-types
public function languageTestTypes(): JsonResponse
{
    return response()->json([
        'data' => [
            [
                'value'      => 'ielts',
                'label'      => 'IELTS',
                'score_min'  => 0,
                'score_max'  => 9,
                'score_hint' => '0 - 9',
                'sections'   => ['listening', 'reading', 'writing', 'speaking'],
            ],
            [
                'value'      => 'toefl_ibt',
                'label'      => 'TOEFL iBT',
                'score_min'  => 0,
                'score_max'  => 120,
                'score_hint' => '0 - 120',
                'sections'   => ['listening', 'reading', 'writing', 'speaking'],
            ],
            [
                'value'      => 'duolingo',
                'label'      => 'Duolingo English Test',
                'score_min'  => 10,
                'score_max'  => 160,
                'score_hint' => '10 - 160',
                'sections'   => ['literacy', 'comprehension', 'conversation', 'production'],
            ],
        ]
    ]);
}

}