<?php

namespace App\Modules\Test\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestController extends Controller
{
    private function getTestData(): array
    {
        return [
            [
                'id' => 'test-1',
                'title' => 'TOEFL ITP Reading Comprehension',
                'category' => 'english',
                'description' => 'Practice reading comprehension section similar to TOEFL ITP.',
                'duration' => 30,
                'passingScore' => 70,
                'difficulty' => 'intermediate',
                'isPremium' => false,
                'questions' => [
                    [
                        'id' => 'q1',
                        'question' => 'What is the capital city of Indonesia?',
                        'type' => 'multiple-choice',
                        'options' => ['Jakarta', 'Bandung', 'Surabaya', 'Medan'],
                        'correctAnswer' => 0,
                        'explanation' => 'Jakarta is the capital city of Indonesia.',
                        'points' => 5,
                    ],
                    [
                        'id' => 'q2',
                        'question' => 'Which sentence uses correct grammar?',
                        'type' => 'multiple-choice',
                        'options' => [
                            'He go to university every day.',
                            'He goes to university every day.',
                            'He going to university every day.',
                            'He gone to university every day.',
                        ],
                        'correctAnswer' => 1,
                        'explanation' => 'Third person singular present tense uses "goes".',
                        'points' => 5,
                    ],
                ],
            ],
            [
                'id' => 'test-2',
                'title' => 'Logical Reasoning Basics',
                'category' => 'logical-reasoning',
                'description' => 'Train your logical reasoning for scholarship selection tests.',
                'duration' => 25,
                'passingScore' => 75,
                'difficulty' => 'beginner',
                'isPremium' => true,
                'questions' => [
                    [
                        'id' => 'q1',
                        'question' => 'All scholarship winners are disciplined. Rina is a scholarship winner. Therefore...',
                        'type' => 'multiple-choice',
                        'options' => [
                            'Rina is disciplined',
                            'Rina is not disciplined',
                            'All disciplined people are scholarship winners',
                            'No conclusion can be made',
                        ],
                        'correctAnswer' => 0,
                        'explanation' => 'This follows a direct syllogism.',
                        'points' => 5,
                    ],
                    [
                        'id' => 'q2',
                        'question' => 'If today is Tuesday, what day will it be in 10 days?',
                        'type' => 'multiple-choice',
                        'options' => ['Friday', 'Saturday', 'Sunday', 'Monday'],
                        'correctAnswer' => 0,
                        'explanation' => '10 mod 7 = 3 days after Tuesday, so Friday.',
                        'points' => 5,
                    ],
                ],
            ],
        ];
    }

    public function index(): JsonResponse
    {
        $tests = collect($this->getTestData())->map(function (array $test) {
            $test['totalQuestions'] = count($test['questions']);
            unset($test['questions']);
            return $test;
        })->values();

        return response()->json([
            'success' => true,
            'data' => $tests,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $test = collect($this->getTestData())->firstWhere('id', $id);

        if (!$test) {
            return response()->json([
                'success' => false,
                'message' => 'Test not found',
            ], 404);
        }

        $test['totalQuestions'] = count($test['questions']);

        return response()->json([
            'success' => true,
            'data' => $test,
        ]);
    }

    public function submit(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'answers' => 'required|array',
        ]);

        $test = collect($this->getTestData())->firstWhere('id', $id);

        if (!$test) {
            return response()->json([
                'success' => false,
                'message' => 'Test not found',
            ], 404);
        }

        $answers = $request->input('answers', []);
        $questions = collect($test['questions']);

        $correctAnswers = $questions->filter(function (array $question) use ($answers) {
            $submitted = $answers[$question['id']] ?? null;
            return (string) $submitted === (string) $question['correctAnswer'];
        })->count();

        $totalQuestions = $questions->count();
        $score = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'score' => $score,
                'correctAnswers' => $correctAnswers,
                'totalQuestions' => $totalQuestions,
                'passed' => $score >= $test['passingScore'],
            ],
        ]);
    }
}
