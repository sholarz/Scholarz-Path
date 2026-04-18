<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'user_subscriptions';

    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'payment_method',
        'payment_reference',
        'payment_proof_url',
        'payment_note',
        'reviewed_by',
        'reviewed_at',
        'admin_note',
        'started_at',
        'expires_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription plan.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    /**
     * Check if current subscription is active and not expired.
     */
    public function isActive(): bool
    {
        if (!in_array($this->status, ['active', 'confirmed'], true)) {
            return false;
        }

        if (!$this->expires_at) {
            return true;
        }

        return $this->expires_at->isFuture();
    }
}
