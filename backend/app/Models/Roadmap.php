<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Roadmap extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'scholarship_id',
        'title',
        'description',
        'deadline',   // ← tambahkan ini kalau belum ada
        'milestones',
        'progress_percentage',
        'status',
    ];

    protected $casts = [
        'milestones' => 'array',
        'progress_percentage' => 'integer',
        'deadline' => 'date',         // ← tambahkan ini
    ];

    /**
     * Get the user
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
    
    /**
     * Get the daily tasks
     */
    public function dailyTasks(): HasMany
{
    return $this->hasMany(DailyTask::class);
}
}
