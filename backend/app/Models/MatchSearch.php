<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchSearch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'search_criteria',
        'results_count',
    ];

    protected $casts = [
        'search_criteria' => 'array',
        'results_count'   => 'integer',
    ];

    /**
     * Get the user who performed this search.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
