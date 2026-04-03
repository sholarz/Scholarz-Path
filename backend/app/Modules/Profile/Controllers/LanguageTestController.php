<?php

namespace App\Modules\Profile\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserLanguageTest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LanguageTestController extends Controller
{
    // GET /api/language-tests
    public function index(Request $request): JsonResponse
    {
        $tests = UserLanguageTest::where('user_id', $request->user()->id)
            ->orderByDesc('test_date')
            ->get()
            ->map(fn($t) => array_merge($t->toArray(), [
                'is_expired' => $t->isExpired(),
            ]));

        return response()->json(['data' => $tests]);
    }

    // POST /api/language-tests
    // POST /api/language-tests
public function store(Request $request): JsonResponse
{
    $request->validate([
        'test_name'          => 'required|in:ielts,toefl_ibt,duolingo',
        'overall_score'      => [
            'required',
            'numeric',
            function ($attr, $value, $fail) use ($request) {
                $ranges = [
                    'ielts'     => [0, 9],
                    'toefl_ibt' => [0, 120],
                    'duolingo'  => [10, 160],
                ];
                [$min, $max] = $ranges[$request->test_name] ?? [0, 990];
                if ($value < $min || $value > $max) {
                    $fail("Skor untuk {$request->test_name} harus antara {$min} dan {$max}.");
                }
            }
        ],
        'section_scores'     => 'nullable|array',
        'test_date'          => 'required|date|before_or_equal:today',
        'expiry_date'        => 'nullable|date|after:test_date',
        'certificate_number' => 'nullable|string|max:100',
    ]);

    $test = UserLanguageTest::create([
        'user_id'            => $request->user()->id,
        'test_name'          => $request->test_name,
        'overall_score'      => $request->overall_score,
        'section_scores'     => $request->section_scores,
        'test_date'          => $request->test_date,
        'expiry_date'        => $request->expiry_date,
        'certificate_number' => $request->certificate_number,
    ]);

    return response()->json([
        'message' => 'Skor tes bahasa berhasil ditambahkan.',
        'data'    => $test,
    ], 201);
}

// PUT /api/language-tests/{id}
public function update(Request $request, string $id): JsonResponse
{
    $test = UserLanguageTest::where('user_id', $request->user()->id)
        ->findOrFail($id);

    $request->validate([
        'test_name'          => 'sometimes|in:ielts,toefl_ibt,duolingo',
        'overall_score'      => [
            'sometimes',
            'numeric',
            function ($attr, $value, $fail) use ($request, $test) {
                $testName = $request->test_name ?? $test->test_name;
                $ranges = [
                    'ielts'     => [0, 9],
                    'toefl_ibt' => [0, 120],
                    'duolingo'  => [10, 160],
                ];
                [$min, $max] = $ranges[$testName] ?? [0, 990];
                if ($value < $min || $value > $max) {
                    $fail("Skor untuk {$testName} harus antara {$min} dan {$max}.");
                }
            }
        ],
        'section_scores'     => 'nullable|array',
        'test_date'          => 'sometimes|date|before_or_equal:today',
        'expiry_date'        => 'nullable|date',
        'certificate_number' => 'nullable|string|max:100',
    ]);

    $test->update($request->only([
        'test_name', 'overall_score', 'section_scores',
        'test_date', 'expiry_date', 'certificate_number',
    ]));

    return response()->json([
        'message' => 'Skor tes bahasa berhasil diupdate.',
        'data'    => $test->fresh(),
    ]);
}

    // DELETE /api/language-tests/{id}
    public function destroy(Request $request, string $id): JsonResponse
    {
        $test = UserLanguageTest::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $test->delete();

        return response()->json(['message' => 'Skor tes bahasa berhasil dihapus.']);
    }
}