<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScholarshipProvider extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'website',
        'description',
        'logo_url',
        'country',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    /**
     * Get the scholarships provided by this provider.
     */
    public function scholarships(): HasMany
    {
        return $this->hasMany(Scholarship::class, 'provider_id');
    }
}
