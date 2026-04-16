<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumReply extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'comment_id',
        'author_id',
        'content',
        'likes_count',
        'is_solution',
    ];

    protected function casts(): array
    {
        return [
            'likes_count' => 'integer',
            'is_solution' => 'boolean',
        ];
    }

    public function comment(): BelongsTo
    {
        return $this->belongsTo(ForumComment::class, 'comment_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(ForumReplyLike::class, 'reply_id');
    }
}