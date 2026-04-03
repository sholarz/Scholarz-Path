<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestSession extends Model
{
    use HasUuids;

    protected $fillable = [
    'user_id', 'category_id', 'status',
    'started_at', 'submitted_at', 'expires_at',
    'time_taken_seconds', 'score',
    'correct_count', 'total_questions',
    'passing_score_percentage', 'is_passed',
];

    protected $casts = [
    'started_at'               => 'datetime',
    'submitted_at'             => 'datetime',
    'expires_at'               => 'datetime',
    'score'                    => 'integer',
    'correct_count'            => 'integer',
    'total_questions'          => 'integer',
    'passing_score_percentage' => 'integer',
    'is_passed'                => 'boolean',
    'time_taken_seconds'       => 'integer',
];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TestCategory::class, 'category_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(TestSessionAnswer::class, 'session_id');
    }

    // Cek apakah sesi sudah habis waktu
    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at) && $this->status === 'in_progress';
    }

    // Sisa waktu dalam detik
    public function remainingSeconds(): int
    {
        return max(0, now()->diffInSeconds($this->expires_at, false));
    }
}