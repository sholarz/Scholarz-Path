<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLanguageTest extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'test_name', 'other_test_name',
        'overall_score', 'section_scores',
        'test_date', 'expiry_date',
        'certificate_number', 'is_verified',
    ];

    protected $casts = [
        'section_scores' => 'array',
        'test_date'      => 'date',
        'expiry_date'    => 'date',
        'is_verified'    => 'boolean',
        'overall_score'  => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Cek apakah sertifikat masih berlaku
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }
}