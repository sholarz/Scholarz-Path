<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestQuestion extends Model
{
    use HasUuids;

    protected $fillable = [
    'category_id', 'passage', 'question_text',
    'option_a', 'option_b', 'option_c', 'option_d',
    'correct_answer', 'explanation',
    'points', 'order_index', 'is_active',
];

protected $casts = [
    'is_active'   => 'boolean',
    'points'      => 'integer',
    'order_index' => 'integer',
];

    // Sembunyikan kunci jawaban ketika dikirim ke frontend saat sesi berlangsung
    protected $hidden = ['correct_answer', 'explanation'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(TestCategory::class, 'category_id');
    }
}