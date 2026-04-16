<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumComment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'post_id',
        'author_id',
        'content',
        'likes_count',
        'is_reported',
    ];

    protected function casts(): array
    {
        return [
            'likes_count' => 'integer',
            'is_reported' => 'boolean',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(ForumPost::class, 'post_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(ForumCommentLike::class, 'comment_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ForumReply::class, 'comment_id');
    }
}