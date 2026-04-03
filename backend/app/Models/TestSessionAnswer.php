<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestSessionAnswer extends Model
{
    use HasUuids;

    protected $fillable = [
    'session_id', 'question_id', 'question_order',
    'chosen_answer', 'correct_answer',
    'is_correct', 'points_earned', 'time_spent_seconds',
];

    protected $casts = [
    'is_correct'         => 'boolean',
    'points_earned'      => 'integer',
    'time_spent_seconds' => 'integer',
    'question_order'     => 'integer',
];

    public function session(): BelongsTo
    {
        return $this->belongsTo(TestSession::class, 'session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(TestQuestion::class, 'question_id');
    }
}