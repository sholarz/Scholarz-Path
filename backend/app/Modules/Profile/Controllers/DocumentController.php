<?php

namespace App\Modules\Profile\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    // 5 dokumen yang ditampilkan di frontend — urutan sesuai UI
    private const DOCUMENTS = [
        ['type' => 'cv',                     'label' => 'CV Uploaded'],
        ['type' => 'motivation_letter',      'label' => 'Motivation Letter'],
        ['type' => 'recommendation_letter',  'label' => 'Recommendation Letter'],
        ['type' => 'transcript',             'label' => 'Transcript'],
        ['type' => 'passport',               'label' => 'Passport Ready'],
    ];

    // GET /api/documents/readiness
    // Return semua dokumen + status checklist
    public function readiness(Request $request): JsonResponse
    {
        $userId    = $request->user()->id;
        $saved     = UserDocument::where('user_id', $userId)
                        ->get()
                        ->keyBy('document_type');

        $documents = collect(self::DOCUMENTS)->map(function ($doc) use ($saved) {
            $record = $saved->get($doc['type']);
            return [
                'document_type' => $doc['type'],
                'label'         => $doc['label'],
                'is_ready'      => $record?->status === 'ready' ?? false,
            ];
        });

        $readyCount = $documents->where('is_ready', true)->count();
        $total      = $documents->count();

        return response()->json([
            'data' => [
                'documents' => $documents->values(),
                'summary'   => [
                    'ready'      => $readyCount,
                    'total'      => $total,
                    'percentage' => $total > 0 ? round(($readyCount / $total) * 100) : 0,
                ],
            ]
        ]);
    }

    // PUT /api/documents/readiness
    // User kirim array dokumen mana yang dicentang
    // Body: { "documents": ["cv", "transcript", "passport"] }
    public function updateReadiness(Request $request): JsonResponse
    {
        $validTypes = collect(self::DOCUMENTS)->pluck('type')->toArray();

        $request->validate([
            'documents'   => 'required|array',
            'documents.*' => 'string|in:' . implode(',', $validTypes),
        ]);

        $userId       = $request->user()->id;
        $checkedTypes = $request->input('documents', []);

        // Update semua 5 dokumen sekaligus
        foreach (self::DOCUMENTS as $doc) {
            $isReady = in_array($doc['type'], $checkedTypes);

            UserDocument::updateOrCreate(
                [
                    'user_id'       => $userId,
                    'document_type' => $doc['type'],
                ],
                [
                    'status' => $isReady ? 'ready' : 'not_ready',
                ]
            );
        }

        return response()->json([
            'message' => 'Status dokumen berhasil disimpan.',
            'data'    => [
                'checked' => $checkedTypes,
                'total_ready' => count($checkedTypes),
            ]
        ]);
    }
}