<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyTask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'roadmap_id', 'title', 'description',
        'due_date', 'status', 'day_number',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }
}