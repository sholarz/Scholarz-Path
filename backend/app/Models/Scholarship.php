<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Scholarship extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'provider_id',
        'title',
        'description',
        'amount',
        'currency',
        'type',
        'level',
        'target_countries',
        'eligible_nationalities',
        'fields_of_study',
        'minimum_gpa',
        'target_level',
        'degree_level',
        'language_requirements',
        'application_deadline',
        'start_date',
        'duration_months',
        'application_url',
        'requirements',
        'benefits',
        'selection_criteria',
        'application_process',
        'status',
        'is_featured',
        'view_count',
        'application_count',
        'scraped_at',
        'last_verified_at',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'target_countries' => 'array',
            'eligible_nationalities' => 'array',
            'fields_of_study' => 'array',
            'language_requirements' => 'array',
            'requirements' => 'array',
            'benefits' => 'array',
            'selection_criteria' => 'array',
            'application_process' => 'array',
            'application_deadline' => 'date',
            'start_date' => 'date',
            'amount' => 'decimal:2',
            'minimum_gpa' => 'decimal:2',
            'is_featured' => 'boolean',
            'view_count' => 'integer',
            'application_count' => 'integer',
            'scraped_at' => 'datetime',
            'last_verified_at' => 'datetime',
        ];
    }

    /**
     * Get the scholarship provider.
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(ScholarshipProvider::class, 'provider_id');
    }

    /**
     * Get the scholarship matches.
     */
    public function matches(): HasMany
    {
        return $this->hasMany(ScholarshipMatch::class);
    }

    /**
     * Get the roadmaps created for this scholarship.
     */
    public function roadmaps(): HasMany
    {
        return $this->hasMany(Roadmap::class);
    }

    /**
     * Scope to filter active scholarships.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
                    ->where('application_deadline', '>', now());
    }

    /**
     * Scope to filter featured scholarships.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to filter by scholarship type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by degree level.
     */
    public function scopeByLevel(Builder $query, string $level): Builder
    {
        return $query->where('level', $level);
    }

    /**
     * Scope to filter by target country.
     */
    public function scopeByTargetCountry(Builder $query, string $country): Builder
    {
        return $query->whereJsonContains('target_countries', $country);
    }

    /**
     * Scope to filter by eligible nationality.
     */
    public function scopeByNationality(Builder $query, string $nationality): Builder
    {
        return $query->where(function ($q) use ($nationality) {
            $q->whereJsonContains('eligible_nationalities', '*')
              ->orWhereJsonContains('eligible_nationalities', $nationality);
        });
    }

    /**
     * Scope to filter by field of study.
     */
    public function scopeByField(Builder $query, string $field): Builder
    {
        return $query->whereJsonContains('fields_of_study', $field);
    }

    /**
     * Scope to filter by minimum amount.
     */
    public function scopeMinAmount(Builder $query, float $amount): Builder
    {
        return $query->where('amount', '>=', $amount);
    }

    /**
     * Scope to filter by maximum amount.
     */
    public function scopeMaxAmount(Builder $query, float $amount): Builder
    {
        return $query->where('amount', '<=', $amount);
    }

    /**
     * Scope to filter by deadline range.
     */
    public function scopeDeadlineBetween(Builder $query, Carbon $from, Carbon $to): Builder
    {
        return $query->whereBetween('application_deadline', [$from, $to]);
    }

    /**
     * Scope to search by title and description.
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'LIKE', '%' . $search . '%')
              ->orWhere('description', 'LIKE', '%' . $search . '%');
        });
    }

    /**
     * Get the scholarship's amount formatted with currency.
     */
    public function getFormattedAmountAttribute(): string
    {
        if (!$this->amount) {
            return 'Amount not specified';
        }

        $formatted = number_format($this->amount, 0);
        return "{$this->currency} {$formatted}";
    }

    /**
     * Get days until application deadline.
     */
    public function getDaysUntilDeadlineAttribute(): int
    {
        return now()->diffInDays($this->application_deadline, false);
    }

    /**
     * Check if scholarship is expiring soon (within 30 days).
     */
    public function getIsExpiringSoonAttribute(): bool
    {
        return $this->days_until_deadline <= 30 && $this->days_until_deadline > 0;
    }

    /**
     * Check if scholarship deadline has passed.
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->days_until_deadline < 0;
    }

    /**
     * Get scholarship duration in human-readable format.
     */
    public function getFormattedDurationAttribute(): string
    {
        if (!$this->duration_months) {
            return 'Duration not specified';
        }

        $years = floor($this->duration_months / 12);
        $months = $this->duration_months % 12;

        $parts = [];
        if ($years > 0) {
            $parts[] = $years . ' year' . ($years > 1 ? 's' : '');
        }
        if ($months > 0) {
            $parts[] = $months . ' month' . ($months > 1 ? 's' : '');
        }

        return implode(' ', $parts);
    }

    /**
     * Check if user is eligible based on nationality.
     */
    public function isEligibleForNationality(string $nationality): bool
    {
        if (!$this->eligible_nationalities) {
            return true; // No restriction
        }

        return in_array('*', $this->eligible_nationalities) || 
               in_array($nationality, $this->eligible_nationalities);
    }

    /**
     * Check if scholarship is available in target country.
     */
    public function isAvailableInCountry(string $country): bool
    {
        if (!$this->target_countries) {
            return true; // No restriction
        }

        return in_array($country, $this->target_countries);
    }

    /**
     * Increment view count.
     */
    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    /**
     * Increment application count.
     */
    public function incrementApplicationCount(): void
    {
        $this->increment('application_count');
    }

    /**
     * Get related scholarships based on similar criteria.
     */
    public function getRelatedScholarships(int $limit = 5): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('id', '!=', $this->id)
            ->where('level', $this->level)
            ->where('status', 'active')
            ->where('application_deadline', '>', now())
            ->when($this->type, function ($query) {
                $query->where('type', $this->type);
            })
            ->when($this->fields_of_study, function ($query) {
                foreach ($this->fields_of_study as $field) {
                    $query->orWhereJsonContains('fields_of_study', $field);
                }
            })
            ->orderBy('amount', 'desc')
            ->limit($limit)
            ->get();
    }
}