<?php

namespace App\Modules\Roadmap\Services;

use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Models\Scholarship;
use App\Models\User;
use App\Models\UserDocument;
use App\Models\UserLanguageTest;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RoadmapService
{
    /**
     * Task templates with metadata for gap analysis.
     * Each entry describes what gap triggers this task and how many days before
     * deadline it should ideally be completed.
     */
    private const TASK_TEMPLATES = [
        'complete_profile' => [
            'title'               => 'Complete Core Profile Data',
            'description'         => 'Fill missing profile data to improve scholarship matching quality and roadmap personalization.',
            'days_before_deadline' => 95,
            'urgency_days'        => 3,
        ],
        'ielts_toefl' => [
            'title'               => 'Prepare & Take Language Proficiency Test (IELTS/TOEFL)',
            'description'         => 'Register and sit for IELTS or TOEFL. Allow time for score to arrive (2–4 weeks after test).',
            'days_before_deadline' => 90,
            'urgency_days'        => 14,
        ],
        'transcripts' => [
            'title'               => 'Request Official Academic Transcripts',
            'description'         => 'Order official transcripts from your institution. Allow 2–4 weeks processing time.',
            'days_before_deadline' => 60,
            'urgency_days'        => 10,
        ],
        'personal_statement' => [
            'title'               => 'Write Statement of Purpose / Personal Statement',
            'description'         => 'Draft, revise, and finalize your personal statement or statement of purpose.',
            'days_before_deadline' => 45,
            'urgency_days'        => 7,
        ],
        'recommendation_letters' => [
            'title'               => 'Request Recommendation Letters',
            'description'         => 'Contact professors or supervisors for recommendation letters. Give them at least 4 weeks.',
            'days_before_deadline' => 45,
            'urgency_days'        => 7,
        ],
        'cv' => [
            'title'               => 'Prepare / Update Academic CV',
            'description'         => 'Update your curriculum vitae to include recent academic achievements and experiences.',
            'days_before_deadline' => 35,
            'urgency_days'        => 5,
        ],
        'health_certificate' => [
            'title'               => 'Obtain Health Certificate',
            'description'         => 'Complete medical examination and obtain a health certificate from a certified physician.',
            'days_before_deadline' => 30,
            'urgency_days'        => 7,
        ],
        'financial_docs' => [
            'title'               => 'Prepare Financial Documents',
            'description'         => 'Gather bank statements, financial guarantee letters, or sponsorship documents.',
            'days_before_deadline' => 25,
            'urgency_days'        => 5,
        ],
        'application_form' => [
            'title'               => 'Complete Online Application Form',
            'description'         => 'Fill out all sections of the scholarship application portal completely and accurately.',
            'days_before_deadline' => 14,
            'urgency_days'        => 3,
        ],
        'review_submit' => [
            'title'               => 'Final Review & Submit Application',
            'description'         => 'Review all documents and the application form, then submit before the deadline.',
            'days_before_deadline' => 3,
            'urgency_days'        => 1,
        ],
    ];

    /**
     * Generate a personalized roadmap for a user based on gap analysis.
     */
    public function generateRoadmap(array $data, string $userId): Roadmap
    {
        $scholarship = Scholarship::findOrFail($data['scholarship_id']);
        $user = User::with(['profile', 'languages'])->findOrFail($userId);

        $deadline = Carbon::parse($scholarship->application_deadline);
        $today    = Carbon::today();
        $daysLeft = $today->diffInDays($deadline, false);

        if ($daysLeft < 0) {
            throw new \InvalidArgumentException('Cannot generate roadmap for expired scholarship deadlines.');
        }

        $roadmap = Roadmap::create([
            'user_id'       => $userId,
            'scholarship_id' => $scholarship->id,
            'title'         => 'Roadmap: ' . $scholarship->title,
            'description'   => 'Personalized preparation roadmap for ' . $scholarship->title,
            'deadline'      => $deadline,
            'status'        => 'active',
        ]);

        // Perform gap analysis to determine which tasks are needed
        $neededTaskKeys = $this->analyzeGaps($user, $scholarship, $daysLeft);

        $this->saveTasks($roadmap->id, $neededTaskKeys, $today, $deadline, $daysLeft);

        return $roadmap->load('dailyTasks');
    }

    /**
     * Compare user profile against scholarship requirements to identify gaps.
     * Returns an array of task keys that need to be completed.
     */
    private function analyzeGaps(User $user, Scholarship $scholarship, int $daysLeft): array
    {
        $tasks   = [];
        $profile = $user->profile;
        $documents = UserDocument::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('document_type');

        $profileCompletion = (int) ($profile?->profile_completion_percentage ?? 0);
        if ($profileCompletion < 80) {
            $tasks[] = 'complete_profile';
        }

        // --- Language Test Gap ---
        $langReqs = $scholarship->language_requirements ?? [];
        $userLangs = $user->languages ?? collect();
        $languageTests = UserLanguageTest::query()
            ->where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereNull('expiry_date')
                    ->orWhereDate('expiry_date', '>=', Carbon::today());
            })
            ->get();
        $hasValidLanguageTest = false;

        if (!empty($langReqs)) {
            $hasValidLanguageTest = true;
            foreach ($langReqs as $lang => $reqScore) {
                $userLang = $userLangs->first(fn ($l) =>
                    strtolower($l->language ?? '') === strtolower($lang)
                );
                $mappedTestName = $this->mapLanguageRequirementToTestName((string) $lang);
                $userTest = $mappedTestName
                    ? $languageTests->firstWhere('test_name', $mappedTestName)
                    : null;

                $languageProgressMet = $userLang && isset($userLang->score) && is_numeric($userLang->score) && (float) $userLang->score >= (float) $reqScore;
                $testProgressMet = $userTest && (float) $userTest->overall_score >= (float) $reqScore;

                if (!$languageProgressMet && !$testProgressMet) {
                    $hasValidLanguageTest = false;
                    break;
                }
            }
        } else {
            // No specific language requirement in scholarship record.
            $hasValidLanguageTest = $userLangs->isNotEmpty() || $languageTests->isNotEmpty();
        }

        if (!$hasValidLanguageTest && $daysLeft >= 14) {
            $tasks[] = 'ielts_toefl';
        }

        // --- Documents readiness gap analysis ---
        if (!$this->isDocumentReady($documents, 'transcript')) {
            $tasks[] = 'transcripts';
        }

        if ($daysLeft >= 7 && !$this->isDocumentReady($documents, 'motivation_letter')) {
            $tasks[] = 'personal_statement';
        }

        // --- Recommendation Letters (for graduate or if sufficient time and doc not ready) ---
        $level = $scholarship->level ?? '';
        if (in_array($level, ['master', 'doctorate', 'postdoc']) && $daysLeft >= 14 && !$this->isDocumentReady($documents, 'recommendation_letter')) {
            $tasks[] = 'recommendation_letters';
        } elseif ($daysLeft >= 21 && !$this->isDocumentReady($documents, 'recommendation_letter')) {
            $tasks[] = 'recommendation_letters';
        }

        // --- CV ---
        if ($daysLeft >= 10 && !$this->isDocumentReady($documents, 'cv')) {
            $tasks[] = 'cv';
        }

        // --- Passport readiness (for international target countries) ---
        $targetCountries = is_array($scholarship->target_countries) ? $scholarship->target_countries : [];
        $isCrossCountryFlow = !empty($targetCountries) && !in_array($profile?->current_country, $targetCountries);
        if ($isCrossCountryFlow && !$this->isDocumentReady($documents, 'passport') && $daysLeft >= 10) {
            $tasks[] = 'financial_docs';
        }

        // --- Health Certificate (if requirements mention it) ---
        $requirements = is_array($scholarship->requirements) ? $scholarship->requirements : [];
        $requiresHealth = collect($requirements)->contains(fn ($r) =>
            str_contains(strtolower($r), 'health') || str_contains(strtolower($r), 'medical')
        );
        if ($requiresHealth && $daysLeft >= 10) {
            $tasks[] = 'health_certificate';
        }

        // --- Financial Documents ---
        if ($daysLeft >= 7) {
            $tasks[] = 'financial_docs';
        }

        // --- Application Form & Final Review (always needed) ---
        $tasks[] = 'application_form';
        $tasks[] = 'review_submit';

        return array_unique($tasks);
    }

    private function isDocumentReady(Collection $documents, string $documentType): bool
    {
        $doc = $documents->get($documentType);

        return (bool) $doc && $doc->status === 'ready';
    }

    private function mapLanguageRequirementToTestName(string $requirementKey): ?string
    {
        $key = strtolower($requirementKey);

        if (str_contains($key, 'ielts')) {
            return 'ielts';
        }

        if (str_contains($key, 'toefl')) {
            return 'toefl_ibt';
        }

        if (str_contains($key, 'duolingo')) {
            return 'duolingo';
        }

        return null;
    }

    /**
     * Save tasks to DB with due dates spread across the timeline.
     * Compresses spacing when deadline is near; expands when there is plenty of time.
     */
    private function saveTasks(
        string $roadmapId,
        array $taskKeys,
        Carbon $start,
        Carbon $deadline,
        int $daysLeft
    ): void {
        $isUrgent = $daysLeft < 30;

        foreach ($taskKeys as $index => $key) {
            $template = self::TASK_TEMPLATES[$key] ?? null;
            if (!$template) {
                continue;
            }

            // If urgent, use urgency_days; otherwise use the standard offset from deadline
            if ($isUrgent) {
                $dueDate = $start->copy()->addDays($template['urgency_days'] * ($index + 1));
            } else {
                $dueDate = $deadline->copy()->subDays($template['days_before_deadline']);
            }

            // Ensure due_date is never after the deadline or before today
            if ($dueDate->gt($deadline)) {
                $dueDate = $deadline->copy()->subDay();
            }
            if ($dueDate->lt($start)) {
                $dueDate = $start->copy()->addDay();
            }

            DailyTask::create([
                'roadmap_id'  => $roadmapId,
                'title'       => $template['title'],
                'description' => $template['description'],
                'due_date'    => $dueDate,
                'day_number'  => $index + 1,
                'status'      => 'pending',
            ]);
        }
    }

    /**
     * Get all tasks due today for a specific user.
     */
    public function getDailyTasks(string $userId): \Illuminate\Database\Eloquent\Collection
    {
        return DailyTask::whereHas('roadmap', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('status', 'active');
            })
            ->whereDate('due_date', Carbon::today())
            ->with('roadmap:id,title')
            ->orderBy('day_number')
            ->get();
    }
}
