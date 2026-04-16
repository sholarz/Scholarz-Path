<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForumReplyLike extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'reply_id',
        'user_id',
    ];

    public function reply(): BelongsTo
    {
        return $this->belongsTo(ForumReply::class, 'reply_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}