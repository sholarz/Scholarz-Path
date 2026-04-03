<?php

namespace App\Modules\Test\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TestCategory;
use App\Models\TestQuestion;
use App\Models\TestSession;
use App\Models\TestSessionAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestController extends Controller
{
    // ─────────────────────────────────────────────────────
    // GET /api/tests
    // List semua tes — sama seperti getTestData() dulu
    // tapi sekarang dari database
    // ─────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tests = TestCategory::where('is_active', true)
            ->orderBy('access_level')   // free dulu
            ->orderBy('created_at')
            ->get()
            // Di method index() — update map-nya
            ->map(function ($cat) use ($user) {
            $isLocked = $cat->access_level === 'premium'
               && !in_array($user->role, ['premium', 'admin']);

            return [
            'id'             => $cat->id,
            'title'          => $cat->name,
            'category'       => $cat->category,      // ← pakai category, bukan test_type
            'description'    => $cat->description,
            'duration'       => $cat->time_limit_minutes,
            'passingScore'   => $cat->passing_score_percentage,
            'difficulty'     => $cat->difficulty,
            'isPremium'      => $cat->access_level === 'premium',
            'isLocked'       => $isLocked,
            'totalQuestions' => $cat->total_questions,
            'section'        => $cat->section,
        ];
    });

        // Summary stats — sesuai tampilan "Total Tests: 6, Free: 2, Premium: 4"
        return response()->json([
            'success' => true,
            'data'    => $tests,
            'summary' => [
                'total_tests'   => $tests->count(),
                'free_count'    => $tests->where('isPremium', false)->count(),
                'premium_count' => $tests->where('isPremium', true)->count(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────
    // GET /api/tests/{id}
    // Detail tes + soal-soalnya (tanpa correct_answer)
    // ─────────────────────────────────────────────────────
    public function show(Request $request, string $id): JsonResponse
{
    $user     = $request->user();
    $category = TestCategory::where('is_active', true)->findOrFail($id);

    $isLocked = $category->access_level === 'premium'
        && !in_array($user->role, ['premium', 'admin']);

    if ($isLocked) {
        return response()->json([
            'success'   => false,
            'message'   => 'Upgrade ke Premium untuk mengakses tes ini.',
            'isPremium' => true,
            'isLocked'  => true,
        ], 403);
    }

    $questions = TestQuestion::where('category_id', $category->id)
        ->where('is_active', true)
        ->orderBy('order_index')
        ->get()
        ->map(fn($q) => [
            'id'          => $q->id,
            'question'    => $q->question_text,
            'passage'     => $q->passage,
            'type'        => 'multiple-choice',
            'options'     => [
                $q->option_a,
                $q->option_b,
                $q->option_c,
                $q->option_d,
            ],
            'points'      => $q->points,
            'order_index' => $q->order_index,
        ]);

    return response()->json([
        'success' => true,
        'data'    => [
            'id'             => $category->id,
            'title'          => $category->name,
            'category'       => $category->category,   // ← field category
            'description'    => $category->description,
            'duration'       => $category->time_limit_minutes,
            'passingScore'   => $category->passing_score_percentage,
            'difficulty'     => $category->difficulty,
            'isPremium'      => $category->access_level === 'premium',
            'totalQuestions' => $questions->count(),
            'questions'      => $questions,
        ],
    ]);
}

    // ─────────────────────────────────────────────────────
    // POST /api/tests/{id}/submit
    // Submit semua jawaban sekaligus — sesuai cara kerja
    // TestController lama milik temanmu
    // ─────────────────────────────────────────────────────
    public function submit(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'answers'              => 'required|array',
            // answers: { "uuid-soal-1": 0, "uuid-soal-2": 2 }
            // index 0=a, 1=b, 2=c, 3=d — sama seperti format lama
            'time_taken_seconds'   => 'nullable|integer',
        ]);

        $user     = $request->user();
        $category = TestCategory::where('is_active', true)->findOrFail($id);

        // Cek akses premium
        if ($category->access_level === 'premium'
            && !in_array($user->role, ['premium', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Upgrade ke Premium untuk mengakses tes ini.',
            ], 403);
        }

        $questions      = TestQuestion::where('category_id', $category->id)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $answers        = $request->input('answers', []);
        $indexToLetter  = ['a', 'b', 'c', 'd'];

        $correctCount = 0;
        $totalPoints  = 0;
        $maxPoints    = 0;
        $reviewData   = [];

        // Buat sesi sebagai record permanen di DB
        $session = TestSession::create([
            'user_id'                  => $user->id,
            'category_id'              => $category->id,
            'status'                   => 'completed',
            'started_at'               => now()->subSeconds($request->time_taken_seconds ?? 0),
            'submitted_at'             => now(),
            'expires_at'               => now()->addMinutes($category->time_limit_minutes),
            'time_taken_seconds'       => $request->time_taken_seconds,
            'total_questions'          => $questions->count(),
            'passing_score_percentage' => $category->passing_score_percentage,
        ]);

        foreach ($questions as $question) {
            $maxPoints += $question->points;

            // Jawaban dari FE: index integer (0,1,2,3) → convert ke huruf
            $submittedIndex  = $answers[$question->id] ?? null;
            $chosenLetter    = is_int($submittedIndex)
                ? ($indexToLetter[$submittedIndex] ?? null)
                : null;

            $isCorrect   = $chosenLetter === $question->correct_answer;
            $pointEarned = $isCorrect ? $question->points : 0;

            if ($isCorrect) $correctCount++;
            $totalPoints += $pointEarned;

            // Simpan jawaban ke DB
            TestSessionAnswer::create([
                'session_id'         => $session->id,
                'question_id'        => $question->id,
                'question_order'     => $question->order_index,
                'chosen_answer'      => $chosenLetter,
                'correct_answer'     => $question->correct_answer,
                'is_correct'         => $isCorrect,
                'points_earned'      => $pointEarned,
            ]);

            // Data untuk review page (image 2)
            $reviewData[] = [
                'question_id'    => $question->id,
                'question'       => $question->question_text,
                'passage'        => $question->passage,
                'options'        => [
                    $question->option_a,
                    $question->option_b,
                    $question->option_c,
                    $question->option_d,
                ],
                'yourAnswer'     => $submittedIndex,         // index integer untuk FE
                'correctAnswer'  => array_search(            // index integer untuk FE
                    $question->correct_answer, $indexToLetter
                ),
                'isCorrect'      => $isCorrect,
                'explanation'    => $question->explanation,
                'points'         => $question->points,
                'pointsEarned'   => $pointEarned,
            ];
        }

        $score    = $maxPoints > 0 ? round(($totalPoints / $maxPoints) * 100, 2) : 0;
        $isPassed = $score >= $category->passing_score_percentage;

        // Update skor final ke session
        $session->update([
            'score'         => $score,
            'correct_count' => $correctCount,
            'is_passed'     => $isPassed,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'session_id'     => $session->id,
                'score'          => $score,
                'correctAnswers' => $correctCount,
                'totalQuestions' => $questions->count(),
                'passed'         => $isPassed,
                'passingScore'   => $category->passing_score_percentage,
                'reviewAnswers'  => $reviewData,   // untuk halaman hasil (image 2)
            ],
        ]);
    }
}