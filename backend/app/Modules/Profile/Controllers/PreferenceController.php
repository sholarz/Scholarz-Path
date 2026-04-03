<?php

namespace App\Modules\Profile\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PreferenceController extends Controller
{
    // GET /api/preferences
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $pref   = UserPreference::where('user_id', $userId)->first();
        $rows   = UserPreference::where('user_id', $userId)->get();

        return response()->json([
            'data' => [
                'countries'            => $rows->where('type', 'country')
                                              ->pluck('value')->values(),
                'fields_of_study'      => $rows->where('type', 'field_of_study')
                                              ->pluck('value')->values(),
                'budget_preference'    => $pref?->budget_preference,
                'preferred_start_year' => $pref?->preferred_start_year,
            ]
        ]);
    }

    // PUT /api/preferences
    // Body: {
    //   "countries": ["Japan", "Australia"],
    //   "fields_of_study": ["Computer Science"],
    //   "budget_preference": "full_scholarship",
    //   "preferred_start_year": 2026
    // }
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'countries'            => 'nullable|array|max:10',
            'countries.*'          => 'string|max:200',
            'fields_of_study'      => 'nullable|array|max:10',
            'fields_of_study.*'    => 'string|max:200',
            'budget_preference'    => 'nullable|in:full_scholarship,partial_scholarship,self_funded',
            'preferred_start_year' => 'nullable|integer|min:2025|max:2035',
        ]);

        $userId = $request->user()->id;

        // Hapus semua preferences lama
        UserPreference::where('user_id', $userId)->delete();

        $inserts = [];

        // Simpan countries
        foreach ($request->input('countries', []) as $country) {
            $inserts[] = [
                'id'                   => Str::uuid()->toString(),
                'user_id'              => $userId,
                'type'                 => 'country',
                'value'                => $country,
                'budget_preference'    => $request->budget_preference,
                'preferred_start_year' => $request->preferred_start_year,
                'created_at'           => now(),
                'updated_at'           => now(),
            ];
        }

        // Simpan fields of study
        foreach ($request->input('fields_of_study', []) as $field) {
            $inserts[] = [
                'id'                   => Str::uuid()->toString(),
                'user_id'              => $userId,
                'type'                 => 'field_of_study',
                'value'                => $field,
                'budget_preference'    => $request->budget_preference,
                'preferred_start_year' => $request->preferred_start_year,
                'created_at'           => now(),
                'updated_at'           => now(),
            ];
        }

        // Kalau tidak ada country/field tapi ada budget/year, tetap simpan 1 baris
        if (empty($inserts) && ($request->budget_preference || $request->preferred_start_year)) {
            $inserts[] = [
                'id'                   => Str::uuid()->toString(),
                'user_id'              => $userId,
                'type'                 => 'general',
                'value'                => '-',
                'budget_preference'    => $request->budget_preference,
                'preferred_start_year' => $request->preferred_start_year,
                'created_at'           => now(),
                'updated_at'           => now(),
            ];
        }

        if (!empty($inserts)) {
            UserPreference::insert($inserts);
        }

        return response()->json([
            'message' => 'Preferences berhasil disimpan.',
            'data'    => [
                'countries'            => $request->input('countries', []),
                'fields_of_study'      => $request->input('fields_of_study', []),
                'budget_preference'    => $request->budget_preference,
                'preferred_start_year' => $request->preferred_start_year,
            ]
        ]);
    }
}