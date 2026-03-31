<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLanguage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'language',
        'proficiency_level',
        'certification',
        'score',
    ];

    /**
     * Get the user that owns the language.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
