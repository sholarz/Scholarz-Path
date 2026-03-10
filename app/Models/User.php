<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'status',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'string',
            'status' => 'string',
        ];
    }

    /**
     * Get the user's profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Get the user's languages.
     */
    public function languages(): HasMany
    {
        return $this->hasMany(UserLanguage::class);
    }

    /**
     * Get the user's subscription.
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(UserSubscription::class)
                    ->where('status', 'active');
    }

    /**
     * Get the user's scholarship matches.
     */
    public function scholarshipMatches(): HasMany
    {
        return $this->hasMany(ScholarshipMatch::class);
    }

    /**
     * Get the user's bookmarked scholarships.
     */
    public function bookmarkedScholarships(): HasMany
    {
        return $this->hasMany(ScholarshipMatch::class)
                    ->where('is_bookmarked', true);
    }

    /**
     * Get the user's roadmaps.
     */
    public function roadmaps(): HasMany
    {
        return $this->hasMany(Roadmap::class);
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user is premium.
     */
    public function isPremium(): bool
    {
        return $this->role === 'premium' || 
               ($this->subscription && $this->subscription->isActive());
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Get user's full name.
     */
    public function getFullNameAttribute(): string
    {
        if (!$this->profile) {
            return $this->email;
        }

        return trim($this->profile->first_name . ' ' . $this->profile->last_name);
    }

    /**
     * Check if user's profile is complete.
     */
    public function hasCompleteProfile(): bool
    {
        return $this->profile && 
               $this->profile->profile_completion_percentage >= 80;
    }

    /**
     * Scope to filter by role.
     */
    public function scopeWithRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope to filter active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter verified users.
     */
    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }
}
