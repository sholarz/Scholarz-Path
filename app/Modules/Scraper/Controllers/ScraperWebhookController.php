<?php

namespace App\Modules\Scraper\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ScraperWebhookController extends Controller
{
    public function handleScrapedData(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|string|max:100',
            'scholarships' => 'required|array|min:1',
            'scholarships.*.title' => 'required|string|max:300',
            'scholarships.*.description' => 'required|string',
            'scholarships.*.application_url' => 'required|url|max:1000',
            'scholarships.*.application_deadline' => 'required|date',
            'scholarships.*.level' => 'required|in:high_school,bachelor,master,doctorate,postdoc',
            'scholarships.*.type' => 'required|in:full,partial,merit,need_based,sports,academic',
            'scholarships.*.provider_name' => 'required|string|max:200',
            'scholarships.*.provider_website' => 'nullable|url|max:500',
            'scholarships.*.provider_description' => 'nullable|string',
            'scholarships.*.provider_logo' => 'nullable|url|max:500',
            'scholarships.*.provider_country' => 'nullable|string|max:100',
            'scholarships.*.amount' => 'nullable|numeric',
            'scholarships.*.currency' => 'nullable|string|max:10',
            'scholarships.*.target_countries' => 'nullable|array',
            'scholarships.*.eligible_nationalities' => 'nullable|array',
            'scholarships.*.fields_of_study' => 'nullable|array',
            'scholarships.*.minimum_gpa' => 'nullable|numeric',
            'scholarships.*.language_requirements' => 'nullable|array',
            'scholarships.*.start_date' => 'nullable|date',
            'scholarships.*.duration_months' => 'nullable|integer',
            'scholarships.*.requirements' => 'nullable|string',
            'scholarships.*.benefits' => 'nullable|string',
            'scholarships.*.selection_criteria' => 'nullable|string',
            'scholarships.*.application_process' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $created = 0;
        $updated = 0;
        $failed = 0;

        foreach ($payload['scholarships'] as $item) {
            try {
                $provider = $this->upsertProvider($item);
                $deadline = Carbon::parse($item['application_deadline']);

                $attributes = [
                    'provider_id' => $provider->id,
                    'application_url' => $item['application_url'],
                ];

                $values = [
                    'title' => $item['title'],
                    'description' => $item['description'],
                    'amount' => $item['amount'] ?? null,
                    'currency' => $item['currency'] ?? 'USD',
                    'type' => $item['type'],
                    'level' => $item['level'],
                    'target_countries' => $item['target_countries'] ?? null,
                    'eligible_nationalities' => $item['eligible_nationalities'] ?? null,
                    'fields_of_study' => $item['fields_of_study'] ?? null,
                    'minimum_gpa' => $item['minimum_gpa'] ?? null,
                    'language_requirements' => $item['language_requirements'] ?? null,
                    'application_deadline' => $deadline->toDateString(),
                    'start_date' => $item['start_date'] ?? null,
                    'duration_months' => $item['duration_months'] ?? null,
                    'requirements' => $item['requirements'] ?? null,
                    'benefits' => $item['benefits'] ?? null,
                    'selection_criteria' => $item['selection_criteria'] ?? null,
                    'application_process' => $item['application_process'] ?? null,
                    'status' => $deadline->isPast() ? 'expired' : 'active',
                    'scraped_at' => now(),
                    'last_verified_at' => now(),
                ];

                $scholarship = Scholarship::updateOrCreate($attributes, $values);

                if ($scholarship->wasRecentlyCreated) {
                    $created += 1;
                } else {
                    $updated += 1;
                }
            } catch (\Throwable $exception) {
                Log::warning('Scraper webhook failed for scholarship item.', [
                    'source' => $payload['source'],
                    'title' => $item['title'] ?? null,
                    'application_url' => $item['application_url'] ?? null,
                    'error' => $exception->getMessage(),
                ]);
                $failed += 1;
            }
        }

        return response()->json([
            'success' => true,
            'source' => $payload['source'],
            'created' => $created,
            'updated' => $updated,
            'failed' => $failed,
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        return $this->handleScrapedData($request);
    }

    private function upsertProvider(array $item): ScholarshipProvider
    {
        $providerData = [
            'name' => $item['provider_name'],
            'website' => $item['provider_website'] ?? null,
            'description' => $item['provider_description'] ?? null,
            'logo_url' => $item['provider_logo'] ?? null,
            'country' => $item['provider_country'] ?? null,
        ];

        if (!empty($item['provider_website'])) {
            return ScholarshipProvider::updateOrCreate(
                ['website' => $item['provider_website']],
                $providerData
            );
        }

        return ScholarshipProvider::updateOrCreate(
            ['name' => $item['provider_name']],
            $providerData
        );
    }
}
