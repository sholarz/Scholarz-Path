<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestCategory extends Model
{
    use HasUuids;

    protected $fillable = [
    'created_by', 'name', 'slug', 'description',
        'test_type', 'category', 'section', 'difficulty',
    'time_limit_minutes', 'total_questions',
    'passing_score_percentage', 'access_level', 'is_active',
];

protected $casts = [
    'is_active'                => 'boolean',
    'time_limit_minutes'       => 'integer',
    'total_questions'          => 'integer',
    'passing_score_percentage' => 'integer',
];

    public function questions(): HasMany
    {
        return $this->hasMany(TestQuestion::class, 'category_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TestSession::class, 'category_id');
    }

    // Helper: apakah kategori ini premium?
    public function isPremium(): bool
    {
        return $this->access_level === 'premium';
    }
}