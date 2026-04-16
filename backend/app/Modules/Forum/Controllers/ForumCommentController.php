<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumComment;
use App\Models\ForumPost;
use App\Models\ForumReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumCommentController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts/{id}/comments
    // Tambah komentar ke post
    // ──────────────────────────────────3───────────────────────────────────
    public function store(Request $request, string $postId): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $post = ForumPost::where('status', 'approved')->findOrFail($postId);

        $comment = ForumComment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'content' => $request->text,
        ]);

        // Update counter di post
        $post->increment('comments_count');

        // Load author info
        $comment->load(['user:id,email,role', 'user.profile:user_id,first_name,last_name']);
        $profile = $comment->user->profile;
        $comment->author_name = $profile
            ? $profile->first_name . ' ' . $profile->last_name
            : explode('@', $comment->user->email)[0];
        $comment->author_role = $comment->user->role;

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan.',
            'data'    => $comment,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/comments/{id}/like
    // Toggle like komentar
    // ─────────────────────────────────────────────────────────────────────
    public function toggleLike(Request $request, string $commentId): JsonResponse
    {
        $comment  = ForumComment::findOrFail($commentId);
        $userId   = $request->user()->id;
        $hasLiked = $comment->likedBy()->where('user_id', $userId)->exists();

        if ($hasLiked) {
            $comment->likedBy()->detach($userId);
            $comment->decrement('likes_count');
            $message = 'Like komentar dihapus.';
        } else {
            $comment->likedBy()->attach($userId);
            $comment->increment('likes_count');
            $message = 'Komentar disukai.';
        }

        return response()->json([
            'message'     => $message,
            'liked'       => !$hasLiked,
            'likes_count' => $comment->fresh()->likes_count,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/comments/{id}/replies
    // Tambah balasan ke komentar
    // ─────────────────────────────────────────────────────────────────────
    public function storeReply(Request $request, string $commentId): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = ForumComment::findOrFail($commentId);

        $reply = ForumReply::create([
            'comment_id' => $comment->id,
            'user_id'    => $request->user()->id,
            'content'    => $request->text,
        ]);

        $reply->load(['user:id,email,role', 'user.profile:user_id,first_name,last_name']);
        $profile = $reply->user->profile;
        $reply->author_name = $profile
            ? $profile->first_name . ' ' . $profile->last_name
            : explode('@', $reply->user->email)[0];
        $reply->author_role = $reply->user->role;

        return response()->json([
            'message' => 'Balasan berhasil ditambahkan.',
            'data'    => $reply,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/forum/replies/{id}
// Hapus balasan — hanya author atau admin
public function destroyReply(Request $request, string $replyId): JsonResponse
{
    $reply = ForumReply::findOrFail($replyId);
    $user  = $request->user();

    if ($reply->user_id !== $user->id && $user->role !== 'admin') {
        return response()->json(['message' => 'Tidak diizinkan.'], 403);
    }

    $reply->delete();

    return response()->json(['message' => 'Balasan berhasil dihapus.']);
}
}