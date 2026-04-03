<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForumModerationAction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'admin_id',
        'target_type',
        'target_id',
        'action',
        'reason',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Scope moderation actions by type.
     */
    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}