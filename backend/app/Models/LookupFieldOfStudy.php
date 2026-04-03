<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LookupFieldOfStudy extends Model
{
    use HasUuids;

    protected $table = 'lookup_fields_of_study';

    protected $fillable = [
        'name', 'category', 'is_popular', 'is_active'
    ];

    protected $casts = [
        'is_popular' => 'boolean',
        'is_active'  => 'boolean',
    ];
}