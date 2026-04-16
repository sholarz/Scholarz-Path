<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumPost;
use App\Models\ForumCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumPostController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // GET /api/forum/posts
    // List semua post dengan filter & sort
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = ForumPost::with(['user:id,email', 'category:id,name,slug'])
            ->withCount('comments');

        // Filter status — admin lihat semua, user biasa hanya approved
        if ($user->role !== 'admin') {
            $query->where('status', 'approved');
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
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('content', 'ilike', "%{$search}%")
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
            $post->has_liked = $post->likedBy()->where('user_id', $user->id)->exists();
            $post->has_saved = $post->savedBy()->where('user_id', $user->id)->exists();
            // Ambil nama dari user_profiles
            $profile = $post->user->profile;
            $post->author_name = $profile
                ? $profile->first_name . ' ' . $profile->last_name
                : explode('@', $post->user->email)[0];
            $post->author_role = $post->user->role;
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

        $post = ForumPost::create([
            'user_id'     => $request->user()->id,
            'category_id' => $request->category_id,
            'title'       => $request->title,
            'content'     => $request->text,
            'tags'        => $request->tags ?? [],
            'status'      => 'approved', // langsung approved sesuai frontend
        ]);

        return response()->json([
            'message' => 'Post berhasil dibuat.',
            'data'    => $post->load(['user:id,email', 'category:id,name,slug']),
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
            'user:id,email,role',
            'user.profile:user_id,first_name,last_name',
            'category:id,name,slug',
            'comments' => function ($q) {
                $q->orderBy('created_at')
                  ->with([
                      'user:id,email,role',
                      'user.profile:user_id,first_name,last_name',
                      'replies.user:id,email,role',
                      'replies.user.profile:user_id,first_name,last_name',
                  ]);
            },
        ])->findOrFail($id);

        // Non-admin hanya bisa lihat post approved
        if ($user->role !== 'admin' && $post->status !== 'approved') {
            return response()->json(['message' => 'Post tidak ditemukan.'], 404);
        }

        $post->has_liked = $post->likedBy()->where('user_id', $user->id)->exists();
        $post->has_saved = $post->savedBy()->where('user_id', $user->id)->exists();

        // Format nama author di setiap comment & reply
        $post->comments->each(function ($comment) use ($user) {
            $profile = $comment->user->profile;
            $comment->author_name = $profile
                ? $profile->first_name . ' ' . $profile->last_name
                : explode('@', $comment->user->email)[0];
            $comment->author_role = $comment->user->role;
            $comment->has_liked   = $comment->likedBy()->where('user_id', $user->id)->exists();

            $comment->replies->each(function ($reply) {
                $profile = $reply->user->profile;
                $reply->author_name = $profile
                    ? $profile->first_name . ' ' . $profile->last_name
                    : explode('@', $reply->user->email)[0];
                $reply->author_role = $reply->user->role;
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

        if ($post->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $request->validate([
            'title'   => 'sometimes|string|max:150',
            'content' => 'sometimes|string|max:5000',
            'tags'    => 'nullable|array|max:5',
            'tags.*'  => 'string|max:50',
        ]);

        $post->update($request->only(['title', 'content', 'tags']));

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

        if ($post->user_id !== $user->id && $user->role !== 'admin') {
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

        $hasLiked = $post->likedBy()->where('user_id', $userId)->exists();

        if ($hasLiked) {
            $post->likedBy()->detach($userId);
            $post->decrement('likes_count');
            $message = 'Like dihapus.';
        } else {
            $post->likedBy()->attach($userId);
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

        $hasSaved = $post->savedBy()->where('user_id', $userId)->exists();

        if ($hasSaved) {
            $post->savedBy()->detach($userId);
            $post->decrement('saves_count');
            $message = 'Post dihapus dari simpanan.';
        } else {
            $post->savedBy()->attach($userId);
            $post->increment('saves_count');
            $message = 'Post disimpan.';
        }

        return response()->json([
            'message' => $message,
            'saved'   => !$hasSaved,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: GET /api/forum/posts/pending
    // ─────────────────────────────────────────────────────────────────────
    public function pending(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $posts = ForumPost::with(['user:id,email', 'category:id,name'])
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $posts]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: PUT /api/forum/posts/{id}/approve
    // ─────────────────────────────────────────────────────────────────────
    public function approve(Request $request, string $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $post = ForumPost::findOrFail($id);
        $post->update(['status' => 'approved']);

        return response()->json(['message' => 'Post disetujui.', 'data' => $post]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: PUT /api/forum/posts/{id}/reject
    // ─────────────────────────────────────────────────────────────────────
    public function reject(Request $request, string $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $post = ForumPost::findOrFail($id);
        $post->update(['status' => 'rejected']);

        return response()->json(['message' => 'Post ditolak.', 'data' => $post]);
    }
}

