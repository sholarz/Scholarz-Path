<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipMatch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'scholarship_id',
        'match_score',
        'criteria_met',
        'criteria_missing',
        'recommendations',
        'is_bookmarked',
    ];

    protected $casts = [
        'match_score' => 'float',
        'criteria_met' => 'array',
        'criteria_missing' => 'array',
        'is_bookmarked' => 'boolean',
    ];

    /**
     * Get the user that owns the match
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the scholarship
     */
    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
