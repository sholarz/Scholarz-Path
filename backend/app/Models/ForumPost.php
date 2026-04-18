<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumPost extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'author_id',
        'forum_category_id',
        'title',
        'content',
        'tags',
        'status',
        'likes_count',
        'saves_count',
        'comments_count',
        'report_count',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'likes_count' => 'integer',
            'saves_count' => 'integer',
            'comments_count' => 'integer',
            'report_count' => 'integer',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ForumCategory::class, 'forum_category_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ForumComment::class, 'post_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(ForumPostLike::class, 'post_id');
    }

    public function saves(): HasMany
    {
        return $this->hasMany(ForumPostSave::class, 'post_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ForumReport::class, 'target_id')->where('target_type', 'post');
    }
}