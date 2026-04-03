<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LookupCountry extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'code', 'flag_emoji', 'is_popular', 'is_active'
    ];

    protected $casts = [
        'is_popular' => 'boolean',
        'is_active'  => 'boolean',
    ];
}