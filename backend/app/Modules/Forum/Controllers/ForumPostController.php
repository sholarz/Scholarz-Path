<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumPost;
use App\Models\ForumCategory;
use App\Models\ForumReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ForumPostController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // GET /api/forum/posts
    // List semua post dengan filter & sort
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = ForumPost::with(['author:id,email,role', 'author.profile:user_id,first_name,last_name', 'category:id,name,slug'])
            ->withCount('comments');

        // Filter status — admin lihat semua, user biasa hanya approved
        if ($user->role !== 'admin') {
            $query->where('status', 'published');
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) =>
                $q->where('slug', $request->category)
            );
        }

        // Search title, content, tags
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                                $q->where('title', 'like', "%{$search}%")
                                    ->orWhere('content', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search);
            });
        }

        // Sort
        if ($request->get('sort') === 'popular') {
            $query->orderByDesc('likes_count');
        } else {
            $query->orderByDesc('created_at'); // default: latest
        }

        $posts = $query->paginate(10);

        // Tambahkan info apakah user sudah like/save
        $posts->getCollection()->transform(function ($post) use ($user) {
            $post->has_liked = $post->likes()->where('user_id', $user->id)->exists();
            $post->has_saved = $post->saves()->where('user_id', $user->id)->exists();
            // Ambil nama dari user_profiles
            $profile = $post->author->profile;
            $post->author_name = $profile
                ? $profile->first_name . ' ' . $profile->last_name
                : explode('@', $post->author->email)[0];
            $post->author_role = $post->author->role;
            return $post;
        });

        return response()->json(['data' => $posts]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts
    // Buat post baru
    // ─────────────────────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:150',
            'content'     => 'required|string|max:5000',
            'category_id' => 'required|uuid|exists:forum_categories,id',
            'tags'        => 'nullable|array|max:5',
            'tags.*'      => 'string|max:50',
        ]);

        $normalizedTags = collect($request->input('tags', []))
            ->filter(fn($tag) => is_string($tag) && trim($tag) !== '')
            ->map(fn($tag) => trim($tag))
            ->values()
            ->all();

        $post = ForumPost::create([
            'author_id'     => $request->user()->id,
            'forum_category_id' => $request->category_id,
            'title'       => $request->title,
            'content'     => $request->content,
            'tags'        => json_encode($normalizedTags, JSON_UNESCAPED_UNICODE),
            'status'      => 'published',
        ]);

        return response()->json([
            'message' => 'Post berhasil dibuat.',
            'data'    => $post->load(['author:id,email,role', 'category:id,name,slug']),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/forum/posts/{id}
    // Detail post + comments + replies
    // ─────────────────────────────────────────────────────────────────────
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $post = ForumPost::with([
            'author:id,email,role',
            'author.profile:user_id,first_name,last_name',
            'category:id,name,slug',
            'comments' => function ($q) {
                $q->orderBy('created_at')
                  ->with([
                      'author:id,email,role',
                      'author.profile:user_id,first_name,last_name',
                      'replies.author:id,email,role',
                      'replies.author.profile:user_id,first_name,last_name',
                  ]);
            },
        ])->findOrFail($id);

        // Non-admin hanya bisa lihat post approved
        if ($user->role !== 'admin' && $post->status !== 'published') {
            return response()->json(['message' => 'Post tidak ditemukan.'], 404);
        }

        $post->has_liked = $post->likes()->where('user_id', $user->id)->exists();
        $post->has_saved = $post->saves()->where('user_id', $user->id)->exists();

        // Format nama author di setiap comment & reply
        $post->comments->each(function ($comment) use ($user) {
            $profile = $comment->author->profile;
            $comment->author_name = $profile
                ? $profile->first_name . ' ' . $profile->last_name
                : explode('@', $comment->author->email)[0];
            $comment->author_role = $comment->author->role;
            $comment->has_liked   = $comment->likes()->where('user_id', $user->id)->exists();

            $comment->replies->each(function ($reply) {
                $profile = $reply->author->profile;
                $reply->author_name = $profile
                    ? $profile->first_name . ' ' . $profile->last_name
                    : explode('@', $reply->author->email)[0];
                $reply->author_role = $reply->author->role;
            });
        });

        return response()->json(['data' => $post]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUT /api/forum/posts/{id}
    // Edit post — hanya author atau admin
    // ─────────────────────────────────────────────────────────────────────
    public function update(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $user = $request->user();

        if ($post->author_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $request->validate([
            'title'   => 'sometimes|string|max:150',
            'content' => 'sometimes|string|max:5000',
            'tags'    => 'nullable|array|max:5',
            'tags.*'  => 'string|max:50',
        ]);

        $payload = $request->only(['title', 'content']);
        if ($request->has('tags')) {
            $normalizedTags = collect($request->input('tags', []))
                ->filter(fn($tag) => is_string($tag) && trim($tag) !== '')
                ->map(fn($tag) => trim($tag))
                ->values()
                ->all();

            $payload['tags'] = json_encode($normalizedTags, JSON_UNESCAPED_UNICODE);
        }

        $post->update($payload);

        return response()->json([
            'message' => 'Post berhasil diupdate.',
            'data'    => $post->fresh(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/forum/posts/{id}
    // Hapus post — hanya author atau admin
    // ─────────────────────────────────────────────────────────────────────
    public function destroy(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $user = $request->user();

        if ($post->author_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post berhasil dihapus.']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts/{id}/like
    // Toggle like post
    // ─────────────────────────────────────────────────────────────────────
    public function toggleLike(Request $request, string $id): JsonResponse
    {
        $post   = ForumPost::findOrFail($id);
        $userId = $request->user()->id;

        $hasLiked = $post->likes()->where('user_id', $userId)->exists();

        if ($hasLiked) {
            $post->likes()->where('user_id', $userId)->delete();
            $post->decrement('likes_count');
            $message = 'Like dihapus.';
        } else {
            $post->likes()->create(['user_id' => $userId]);
            $post->increment('likes_count');
            $message = 'Post disukai.';
        }

        return response()->json([
            'message'   => $message,
            'liked'     => !$hasLiked,
            'likes_count' => $post->fresh()->likes_count,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts/{id}/save
    // Toggle simpan/bookmark post
    // ─────────────────────────────────────────────────────────────────────
    public function toggleSave(Request $request, string $id): JsonResponse
    {
        $post   = ForumPost::findOrFail($id);
        $userId = $request->user()->id;

        $hasSaved = $post->saves()->where('user_id', $userId)->exists();

        if ($hasSaved) {
            $post->saves()->where('user_id', $userId)->delete();
            $post->decrement('saves_count');
            $message = 'Post dihapus dari simpanan.';
        } else {
            $post->saves()->create(['user_id' => $userId]);
            $post->increment('saves_count');
            $message = 'Post disimpan.';
        }

        return response()->json([
            'message' => $message,
            'saved'   => !$hasSaved,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts/{id}/report
    // Increment report_count + archive otomatis jika >= 5
    // ─────────────────────────────────────────────────────────────────────
    public function report(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $post = ForumPost::findOrFail($id);
        $userId = $request->user()->id;

        $existingQuery = ForumReport::query();
        if (Schema::hasColumn('forum_reports', 'post_id')) {
            $existingQuery->where('post_id', $post->id);
        } else {
            $existingQuery->where('target_type', 'post')->where('target_id', $post->id);
        }

        if (Schema::hasColumn('forum_reports', 'user_id')) {
            $existingQuery->where('user_id', $userId);
        } else {
            $existingQuery->where('reporter_user_id', $userId);
        }

        $existing = $existingQuery->exists();

        if ($existing) {
            return response()->json(['message' => 'You have already reported this post'], 422);
        }

        $reportPayload = [
            'reason' => $request->reason,
        ];

        if (Schema::hasColumn('forum_reports', 'post_id')) {
            $reportPayload['post_id'] = $post->id;
        }

        if (Schema::hasColumn('forum_reports', 'user_id')) {
            $reportPayload['user_id'] = $userId;
        }

        if (Schema::hasColumn('forum_reports', 'reporter_user_id')) {
            $reportPayload['reporter_user_id'] = $userId;
        }

        if (Schema::hasColumn('forum_reports', 'target_type')) {
            $reportPayload['target_type'] = 'post';
        }

        if (Schema::hasColumn('forum_reports', 'target_id')) {
            $reportPayload['target_id'] = $post->id;
        }

        if (Schema::hasColumn('forum_reports', 'description')) {
            $reportPayload['description'] = $request->reason;
        }

        if (Schema::hasColumn('forum_reports', 'status')) {
            $reportPayload['status'] = 'pending';
        }

        ForumReport::create($reportPayload);

        $post->increment('report_count');
        $post->refresh();

        if ($post->report_count >= 5 && $post->status !== 'archived') {
            $post->update(['status' => 'archived']);
        }

        return response()->json([
            'message' => $post->status === 'archived'
                ? 'Laporan diterima. Post diarsipkan otomatis.'
                : 'Laporan diterima.',
            'data' => [
                'post_id' => $post->id,
                'report_count' => $post->report_count,
                'status' => $post->status,
            ],
        ], 201);
    }
}

