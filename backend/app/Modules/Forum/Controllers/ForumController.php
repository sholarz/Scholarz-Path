<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumCommentLike;
use App\Models\ForumPost;
use App\Models\ForumPostLike;
use App\Models\ForumPostSave;
use App\Models\ForumReply;
use App\Models\ForumReplyLike;
use App\Models\ForumReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ForumController extends Controller
{
    private const DEFAULT_CATEGORIES = [
        ['name' => 'Tips & Experience', 'slug' => 'tips-experience', 'description' => 'Share scholarship tips and experiences', 'sort_order' => 1],
        ['name' => 'Announcements', 'slug' => 'announcements', 'description' => 'Official updates and announcements', 'sort_order' => 2],
        ['name' => 'Q&A', 'slug' => 'qa', 'description' => 'Questions and answers from the community', 'sort_order' => 3],
        ['name' => 'General Discussion', 'slug' => 'general-discussion', 'description' => 'General community discussion', 'sort_order' => 4],
        ['name' => 'Test Preparation', 'slug' => 'test-preparation', 'description' => 'IELTS, TOEFL, and test prep', 'sort_order' => 5],
        ['name' => 'Documents', 'slug' => 'documents', 'description' => 'Letters, CVs, and other documents', 'sort_order' => 6],
    ];

    public function index(): JsonResponse
    {
        return $this->getPosts(request());
    }

    public function getCategories(): JsonResponse
    {
        $categories = ForumCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        if ($categories->isEmpty()) {
            return $this->success(collect(self::DEFAULT_CATEGORIES), 'Categories fetched successfully.');
        }

        return $this->success(
            $categories->map(fn (ForumCategory $category) => $this->serializeCategory($category))->values(),
            'Categories fetched successfully.'
        );
    }

    public function getPosts(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = max(1, min(50, (int) $request->integer('per_page', 15)));
        $sort = $request->string('sort', 'latest')->toString();
        $search = trim($request->string('search')->toString());
        $categoryFilter = trim($request->string('category')->toString());

        $query = ForumPost::query()->with(['author', 'category'])->withCount('comments');

        if (! $user || ! $user->isAdmin()) {
            $query->where('status', 'approved');
        } elseif ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', '%' . $search . '%')
                    ->orWhere('content', 'like', '%' . $search . '%')
                    ->orWhereJsonContains('tags', $search);
            });
        }

        if ($categoryFilter !== '') {
            $query->whereHas('category', function ($builder) use ($categoryFilter): void {
                $builder->where('id', $categoryFilter)
                    ->orWhere('slug', Str::slug($categoryFilter))
                    ->orWhere('name', $categoryFilter);
            });
        }

        if ($sort === 'popular') {
            $query->orderByDesc('likes_count')->orderByDesc('comments_count')->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        $posts = $query->paginate($perPage);

        return $this->success([
            'posts' => collect($posts->items())->map(fn (ForumPost $post) => $this->serializePostSummary($post))->values(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'last_page' => $posts->lastPage(),
            ],
        ], 'Posts fetched successfully.');
    }

    public function createPost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category' => ['required', 'string', 'max:150'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $category = $this->resolveCategory($validated['category']);

        $post = ForumPost::create([
            'author_id' => $request->user()->id,
            'forum_category_id' => $category->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'tags' => array_values($validated['tags'] ?? []),
            'status' => $request->user()->isAdmin() ? 'approved' : 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->serializePostDetail($post->fresh()->load(['author', 'category', 'comments.author', 'comments.replies.author'])),
            'message' => 'Post created successfully.',
        ], 201);
    }

    public function getPost(string $id): JsonResponse
    {
        $post = ForumPost::with([
            'author',
            'category',
            'comments.author',
            'comments.replies.author',
        ])->findOrFail($id);

        $this->ensurePostVisibility($post, request()->user());

        return $this->success($this->serializePostDetail($post), 'Post fetched successfully.');
    }

    public function updatePost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $this->ensurePostOwnerOrAdmin($request, $post);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'category' => ['sometimes', 'required', 'string', 'max:150'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $updates = [];

        if (array_key_exists('title', $validated)) {
            $updates['title'] = $validated['title'];
        }

        if (array_key_exists('content', $validated)) {
            $updates['content'] = $validated['content'];
        }

        if (array_key_exists('category', $validated)) {
            $updates['forum_category_id'] = $this->resolveCategory($validated['category'])->id;
        }

        if (array_key_exists('tags', $validated)) {
            $updates['tags'] = array_values($validated['tags'] ?? []);
        }

        $post->update($updates);

        return $this->success(
            $this->serializePostDetail($post->fresh()->load(['author', 'category', 'comments.author', 'comments.replies.author'])),
            'Post updated successfully.'
        );
    }

    public function deletePost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $this->ensurePostOwnerOrAdmin($request, $post);

        $post->delete();

        return $this->success(null, 'Post deleted successfully.');
    }

    public function likePost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $user = $request->user();

        $existing = ForumPostLike::query()->where('post_id', $post->id)->where('user_id', $user->id)->first();

        if ($existing) {
            $existing->delete();
            $post->decrement('likes_count');

            return $this->success(['liked' => false, 'likes' => max(0, $post->fresh()->likes_count)], 'Post unliked successfully.');
        }

        ForumPostLike::create(['post_id' => $post->id, 'user_id' => $user->id]);
        $post->increment('likes_count');

        return $this->success(['liked' => true, 'likes' => $post->fresh()->likes_count], 'Post liked successfully.');
    }

    public function savePost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $user = $request->user();

        $existing = ForumPostSave::query()->where('post_id', $post->id)->where('user_id', $user->id)->first();

        if ($existing) {
            $existing->delete();
            $post->decrement('saves_count');

            return $this->success(['saved' => false, 'saves' => max(0, $post->fresh()->saves_count)], 'Bookmark removed successfully.');
        }

        ForumPostSave::create(['post_id' => $post->id, 'user_id' => $user->id]);
        $post->increment('saves_count');

        return $this->success(['saved' => true, 'saves' => $post->fresh()->saves_count], 'Post bookmarked successfully.');
    }

    public function addComment(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $this->ensurePostVisibleForInteraction($post, $request->user());

        $validated = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $comment = ForumComment::create([
            'post_id' => $post->id,
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $post->increment('comments_count');

        return response()->json([
            'success' => true,
            'data' => ['comment' => $this->serializeComment($comment->fresh()->load(['author', 'replies.author']))],
            'message' => 'Comment created successfully.',
        ], 201);
    }

    public function toggleCommentLike(Request $request, string $id): JsonResponse
    {
        $comment = ForumComment::findOrFail($id);
        $user = $request->user();

        $existing = ForumCommentLike::query()->where('comment_id', $comment->id)->where('user_id', $user->id)->first();

        if ($existing) {
            $existing->delete();
            $comment->decrement('likes_count');

            return $this->success(['liked' => false, 'likes' => max(0, $comment->fresh()->likes_count)], 'Comment unliked successfully.');
        }

        ForumCommentLike::create(['comment_id' => $comment->id, 'user_id' => $user->id]);
        $comment->increment('likes_count');

        return $this->success(['liked' => true, 'likes' => $comment->fresh()->likes_count], 'Comment liked successfully.');
    }

    public function addReply(Request $request, string $id): JsonResponse
    {
        $comment = ForumComment::findOrFail($id);
        $validated = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $reply = ForumReply::create([
            'comment_id' => $comment->id,
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return response()->json([
            'success' => true,
            'data' => ['reply' => $this->serializeReply($reply->fresh()->load('author'))],
            'message' => 'Reply created successfully.',
        ], 201);
    }

    public function reportPost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        $report = ForumReport::firstOrCreate(
            [
                'reporter_user_id' => $request->user()->id,
                'target_type' => 'post',
                'target_id' => $post->id,
            ],
            [
                'reason' => $validated['reason'],
                'description' => $validated['description'],
                'status' => 'pending',
            ]
        );

        if ($report->wasRecentlyCreated) {
            $post->increment('report_count');
        }

        return response()->json([
            'success' => true,
            'data' => ['report' => $this->serializeReport($report->fresh()->load(['reporter', 'reviewer']))],
            'message' => $report->wasRecentlyCreated ? 'Report submitted successfully.' : 'Report already exists.',
        ], $report->wasRecentlyCreated ? 201 : 200);
    }

    public function getReports(Request $request): JsonResponse
    {
        $perPage = max(1, min(50, (int) $request->integer('per_page', 15)));

        $reports = ForumReport::with(['reporter', 'reviewer'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success([
            'reports' => collect($reports->items())->map(fn (ForumReport $report) => $this->serializeReport($report))->values(),
            'pagination' => [
                'current_page' => $reports->currentPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
                'last_page' => $reports->lastPage(),
            ],
        ], 'Reports fetched successfully.');
    }

    public function reviewReport(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['reviewed', 'resolved', 'dismissed'])],
            'action' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        $report = ForumReport::findOrFail($id);
        $status = $validated['status'] ?? 'reviewed';

        $report->update([
            'status' => $status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'action' => $validated['action'],
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($validated['action'] === 'remove-content') {
            $this->removeReportedContent($report);
        }

        return $this->success($this->serializeReport($report->fresh()->load(['reporter', 'reviewer'])), 'Report reviewed successfully.');
    }

    public function getPendingPosts(Request $request): JsonResponse
    {
        $perPage = max(1, min(50, (int) $request->integer('per_page', 15)));

        $posts = ForumPost::with(['author', 'category'])
            ->withCount('comments')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success([
            'posts' => collect($posts->items())->map(fn (ForumPost $post) => $this->serializePostSummary($post))->values(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'last_page' => $posts->lastPage(),
            ],
        ], 'Pending posts fetched successfully.');
    }

    public function approvePost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $post->update(['status' => 'approved']);

        return $this->success($this->serializePostDetail($post->fresh()->load(['author', 'category'])), 'Post approved successfully.');
    }

    public function rejectPost(Request $request, string $id): JsonResponse
    {
        $post = ForumPost::findOrFail($id);
        $post->update(['status' => 'rejected']);

        return $this->success($this->serializePostDetail($post->fresh()->load(['author', 'category'])), 'Post rejected successfully.');
    }

    public function getTopicsByCategory(Request $request, string $slug): JsonResponse
    {
        $request->merge(['category' => $slug]);

        return $this->getPosts($request);
    }

    public function createTopic(Request $request, string $slug): JsonResponse
    {
        $request->merge(['category' => $slug]);

        return $this->createPost($request);
    }

    public function getTopic(string $id): JsonResponse
    {
        return $this->getPost($id);
    }

    public function createReply(Request $request, string $id): JsonResponse
    {
        return $this->addComment($request, $id);
    }

    public function likeReply(Request $request, string $id): JsonResponse
    {
        $reply = ForumReply::findOrFail($id);
        $user = $request->user();

        $existing = ForumReplyLike::query()->where('reply_id', $reply->id)->where('user_id', $user->id)->first();

        if ($existing) {
            $existing->delete();
            $reply->decrement('likes_count');

            return $this->success(['liked' => false, 'likes' => max(0, $reply->fresh()->likes_count)], 'Reply unliked successfully.');
        }

        ForumReplyLike::create(['reply_id' => $reply->id, 'user_id' => $user->id]);
        $reply->increment('likes_count');

        return $this->success(['liked' => true, 'likes' => $reply->fresh()->likes_count], 'Reply liked successfully.');
    }

    public function markAsSolution(Request $request, string $id): JsonResponse
    {
        $reply = ForumReply::findOrFail($id);
        $reply->update(['is_solution' => true]);

        return $this->success($this->serializeReply($reply->fresh()->load('author')), 'Reply marked as solution successfully.');
    }

    public function getUserTopics(Request $request): JsonResponse
    {
        $topics = ForumPost::with(['author', 'category'])
            ->withCount('comments')
            ->where('author_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ForumPost $post) => $this->serializePostSummary($post));

        return $this->success($topics, 'User topics fetched successfully.');
    }

    public function getUserReplies(Request $request): JsonResponse
    {
        $replies = ForumReply::with(['author', 'comment.post'])
            ->where('author_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ForumReply $reply) => $this->serializeReply($reply));

        return $this->success($replies, 'User replies fetched successfully.');
    }

    private function resolveCategory(string $value): ForumCategory
    {
        $normalized = trim($value);

        $category = ForumCategory::query()
            ->where('id', $normalized)
            ->orWhere('slug', Str::slug($normalized))
            ->orWhere('name', $normalized)
            ->first();

        if ($category) {
            return $category;
        }

        return ForumCategory::create([
            'name' => $normalized,
            'slug' => Str::slug($normalized),
            'description' => null,
            'sort_order' => ForumCategory::count() + 1,
            'is_active' => true,
        ]);
    }

    private function ensurePostOwnerOrAdmin(Request $request, ForumPost $post): void
    {
        $user = $request->user();

        if (! $user || (! $user->isAdmin() && $post->author_id !== $user->id)) {
            abort(response()->json(['message' => 'Forbidden.'], 403));
        }
    }

    private function ensurePostVisibility(ForumPost $post, $user): void
    {
        if ($post->status === 'approved') {
            return;
        }

        if (! $user || (! $user->isAdmin() && $post->author_id !== $user->id)) {
            abort(response()->json(['message' => 'Forbidden.'], 403));
        }
    }

    private function ensurePostVisibleForInteraction(ForumPost $post, $user): void
    {
        $this->ensurePostVisibility($post, $user);
    }

    private function removeReportedContent(ForumReport $report): void
    {
        if ($report->target_type === 'post') {
            ForumPost::find($report->target_id)?->delete();
            return;
        }

        if ($report->target_type === 'comment') {
            ForumComment::find($report->target_id)?->delete();
            return;
        }

        if ($report->target_type === 'reply') {
            ForumReply::find($report->target_id)?->delete();
        }
    }

    private function serializeCategory(ForumCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'sort_order' => $category->sort_order,
            'is_active' => $category->is_active,
        ];
    }

    private function serializePostSummary(ForumPost $post): array
    {
        return [
            'id' => $post->id,
            'authorId' => $post->author_id,
            'authorName' => $post->author?->full_name ?? $post->author?->email,
            'authorRole' => $post->author?->role ?? 'free',
            'title' => $post->title,
            'content' => $post->content,
            'category' => $post->category?->name,
            'categorySlug' => $post->category?->slug,
            'tags' => $post->tags ?? [],
            'likes' => $post->likes_count,
            'commentsCount' => $post->comments_count,
            'status' => $post->status,
            'reportCount' => $post->report_count,
            'createdAt' => $post->created_at,
            'updatedAt' => $post->updated_at,
        ];
    }

    private function serializePostDetail(ForumPost $post): array
    {
        $post->loadMissing(['author', 'category', 'comments.author', 'comments.replies.author']);

        return [
            ...$this->serializePostSummary($post),
            'comments' => $post->comments
                ->sortBy('created_at')
                ->values()
                ->map(fn (ForumComment $comment) => $this->serializeComment($comment))
                ->all(),
        ];
    }

    private function serializeComment(ForumComment $comment): array
    {
        return [
            'id' => $comment->id,
            'postId' => $comment->post_id,
            'authorId' => $comment->author_id,
            'authorName' => $comment->author?->full_name ?? $comment->author?->email,
            'authorRole' => $comment->author?->role ?? 'free',
            'content' => $comment->content,
            'likes' => $comment->likes_count,
            'replies' => $comment->replies
                ->sortBy('created_at')
                ->values()
                ->map(fn (ForumReply $reply) => $this->serializeReply($reply))
                ->all(),
            'createdAt' => $comment->created_at,
            'isReported' => $comment->is_reported,
        ];
    }

    private function serializeReply(ForumReply $reply): array
    {
        return [
            'id' => $reply->id,
            'commentId' => $reply->comment_id,
            'authorId' => $reply->author_id,
            'authorName' => $reply->author?->full_name ?? $reply->author?->email,
            'authorRole' => $reply->author?->role ?? 'free',
            'content' => $reply->content,
            'likes' => $reply->likes_count,
            'isSolution' => $reply->is_solution,
            'createdAt' => $reply->created_at,
        ];
    }

    private function serializeReport(ForumReport $report): array
    {
        [$targetContent, $targetAuthor] = $this->resolveReportTargetSnapshot($report);

        return [
            'id' => $report->id,
            'reporterId' => $report->reporter_user_id,
            'reporterName' => $report->reporter?->full_name ?? $report->reporter?->email,
            'targetType' => $report->target_type,
            'targetId' => $report->target_id,
            'targetContent' => $targetContent,
            'targetAuthor' => $targetAuthor,
            'reason' => $report->reason,
            'description' => $report->description,
            'status' => $report->status,
            'reviewedBy' => $report->reviewer?->full_name ?? $report->reviewer?->email,
            'reviewedAt' => $report->reviewed_at,
            'action' => $report->action,
            'notes' => $report->notes,
            'createdAt' => $report->created_at,
        ];
    }

    private function resolveReportTargetSnapshot(ForumReport $report): array
    {
        if ($report->target_type === 'post') {
            $post = ForumPost::with('author')->find($report->target_id);

            return [
                $post?->title ?? $post?->content ?? $report->target_id,
                $post?->author?->full_name ?? $post?->author?->email,
            ];
        }

        if ($report->target_type === 'comment') {
            $comment = ForumComment::with('author')->find($report->target_id);

            return [
                $comment?->content ?? $report->target_id,
                $comment?->author?->full_name ?? $comment?->author?->email,
            ];
        }

        if ($report->target_type === 'reply') {
            $reply = ForumReply::with('author')->find($report->target_id);

            return [
                $reply?->content ?? $report->target_id,
                $reply?->author?->full_name ?? $reply?->author?->email,
            ];
        }

        return [$report->target_id, null];
    }

    private function success($data = null, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ]);
    }
}
