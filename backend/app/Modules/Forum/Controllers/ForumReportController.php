<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\ForumPost;
use App\Models\ForumComment;
use App\Models\ForumReport;
use App\Models\UserNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ForumReportController extends Controller
{
    private function resolveActorName(Request $request): string
    {
        $firstName = trim((string) ($request->user()?->profile?->first_name ?? ''));
        $lastName = trim((string) ($request->user()?->profile?->last_name ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        $email = (string) ($request->user()?->email ?? 'Admin');
        if (str_contains($email, '@')) {
            return explode('@', $email)[0];
        }

        return 'Admin';
    }

    private function extractActionNote(?string $action): ?string
    {
        if (! $action) {
            return null;
        }

        $mainAction = trim(explode('| by:', $action)[0]);
        $separatorIndex = strpos($mainAction, ':');
        if ($separatorIndex === false) {
            return null;
        }

        $note = trim(substr($mainAction, $separatorIndex + 1));
        return $note !== '' ? $note : null;
    }

    private function notifyWarnedUser(Request $request, ForumReport $report, ?string $notes): void
    {
        $targetUserId = null;
        $targetLink = '/forum';

        if ($report->target_type === 'post') {
            $targetPost = ForumPost::find($report->target_id);
            if (! $targetPost) {
                return;
            }

            $targetUserId = $targetPost->author_id;
            $targetLink = '/forum/' . $targetPost->id;
        }

        if ($report->target_type === 'comment') {
            $targetComment = ForumComment::find($report->target_id);
            if (! $targetComment) {
                return;
            }

            $targetUserId = $targetComment->author_id;
            $targetLink = '/forum/' . $targetComment->post_id;
        }

        if (! $targetUserId || $targetUserId === $request->user()->id) {
            return;
        }

        $actionBy = $this->resolveActorName($request);
        $noteText = trim((string) ($notes ?? 'Silakan perbaiki konten agar sesuai pedoman komunitas.'));

        UserNotification::create([
            'user_id' => $targetUserId,
            'type' => 'report_reviewed',
            'title' => 'Peringatan dari Admin Forum',
            'message' => 'Konten Anda dilaporkan dan ditinjau admin. Catatan: ' . $noteText,
            'is_read' => false,
            'link' => $targetLink,
            'action_by' => $actionBy,
            'metadata' => json_encode([
                'report_id' => $report->id,
                'target_type' => $report->target_type,
                'target_id' => $report->target_id,
                'action' => $report->action,
            ], JSON_UNESCAPED_UNICODE),
        ]);
    }

    private function reporterColumn(): string
    {
        return Schema::hasColumn('forum_reports', 'reporter_user_id')
            ? 'reporter_user_id'
            : 'user_id';
    }

    private function attachReportTargetData(ForumReport $report): ForumReport
    {
        if ($report->target_type !== 'post') {
            return $report;
        }

        $postId = $report->post_id ?? $report->target_id;
        $post = ForumPost::with(['author:id,email', 'author.profile:user_id,first_name,last_name'])
            ->find($postId);

        if (! $post) {
            $report->setAttribute('target_content', '[deleted post]');
            $report->setAttribute('target_author', 'Unknown User');
            return $report;
        }

        $profile = $post->author?->profile;
        $authorName = trim(($profile?->first_name ?? '') . ' ' . ($profile?->last_name ?? ''));
        if ($authorName === '' && !empty($post->author?->email)) {
            $authorName = explode('@', $post->author->email)[0];
        }

        $report->setAttribute('target_content', $post->title);
        $report->setAttribute('target_author', $authorName !== '' ? $authorName : 'Unknown User');

        return $report;
    }

    private function logAudit(Request $request, string $action, ?string $targetType = null, ?string $targetId = null, array $metadata = []): void
    {
        if (! $request->user()) {
            return;
        }

        $serializedMetadata = empty($metadata)
            ? null
            : json_encode($metadata, JSON_UNESCAPED_UNICODE);

        AdminAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $serializedMetadata,
        ]);
    }

    private function moderatePostByDecision(Request $request, string $postId, string $decision, ?string $notes = null): JsonResponse
    {
        $post = ForumPost::findOrFail($postId);
        $pendingReports = ForumReport::where('target_type', 'post')
            ->where('target_id', $postId)
            ->where('status', 'pending')
            ->get();

        DB::transaction(function () use ($request, $decision, $notes, $post, $pendingReports) {
            $status = $decision === 'remove' ? 'resolved' : 'dismissed';

            foreach ($pendingReports as $report) {
                $report->update([
                    'status' => $status,
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                    'action' => $decision,
                    'notes' => $notes,
                ]);
            }

            if ($decision === 'remove') {
                $post->delete();
            } else {
                $post->update([
                    'status' => 'published',
                    'report_count' => 0,
                ]);
            }

            $this->logAudit(
                $request,
                'forum_report_moderation',
                'forum_post',
                $post->id,
                [
                    'decision' => $decision,
                    'notes' => $notes,
                    'resolved_reports' => $pendingReports->pluck('id')->values()->all(),
                ]
            );
        });

        return response()->json([
            'message' => $decision === 'remove'
                ? 'Post dilaporkan berhasil dihapus.'
                : 'Post dipertahankan dan laporan ditutup.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/posts/{id}/report
    // Laporkan sebuah post
    // ─────────────────────────────────────────────────────────────────────
    public function reportPost(Request $request, string $postId): JsonResponse
    {
        $request->validate([
            'reason'      => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
        ]);

        $post = ForumPost::findOrFail($postId);
        $reporterColumn = $this->reporterColumn();

        // Cek apakah user sudah pernah lapor post ini
        $alreadyReported = ForumReport::where($reporterColumn, $request->user()->id)
            ->where('target_type', 'post')
            ->where('target_id', $postId)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'You have already reported this post'], 422);
        }

        $payload = [
            $reporterColumn => $request->user()->id,
            'target_type' => 'post',
            'target_id'   => $postId,
            'reason'      => $request->reason,
            'description' => $request->description,
            'status'      => 'pending',
        ];

        if (Schema::hasColumn('forum_reports', 'post_id')) {
            $payload['post_id'] = $postId;
        }

        ForumReport::create($payload);

        $post->increment('report_count');

        if ($post->report_count >= 5 && $post->status !== 'archived') {
            $post->update(['status' => 'archived']);
        }

        return response()->json([
            'message' => 'Laporan berhasil dikirim.',
            'data' => [
                'post_id' => $post->id,
                'report_count' => $post->report_count,
                'status' => $post->status,
            ],
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/forum/comments/{id}/report
    // Laporkan sebuah komentar
    // ─────────────────────────────────────────────────────────────────────
    public function reportComment(Request $request, string $commentId): JsonResponse
    {
        $request->validate([
            'reason'      => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
        ]);

        $comment = ForumComment::findOrFail($commentId);
        $reporterColumn = $this->reporterColumn();

        $alreadyReported = ForumReport::where($reporterColumn, $request->user()->id)
            ->where('target_type', 'comment')
            ->where('target_id', $commentId)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'Anda sudah melaporkan komentar ini.'], 422);
        }

        ForumReport::create([
            $reporterColumn => $request->user()->id,
            'target_type' => 'comment',
            'target_id'   => $commentId,
            'reason'      => $request->reason,
            'description' => $request->description,
            'status'      => 'pending',
        ]);

        $comment->update(['is_reported' => true]);

        return response()->json(['message' => 'Laporan berhasil dikirim.'], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: GET /api/forum/reports
    // List semua laporan
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $reports = ForumReport::with([
                'reporter:id,email',
                'reporter.profile:user_id,first_name,last_name',
                'reviewer:id,email',
            ])
            ->orderByDesc('created_at')
            ->paginate(20);

        $reports->getCollection()->transform(function (ForumReport $report) {
            $profile = $report->reporter?->profile;
            $name = trim(($profile?->first_name ?? '') . ' ' . ($profile?->last_name ?? ''));
            if ($name === '' && !empty($report->reporter?->email)) {
                $name = explode('@', $report->reporter->email)[0];
            }

            $report->setAttribute('reporter_name', $name !== '' ? $name : 'Unknown Reporter');
            return $this->attachReportTargetData($report);
        });

        return response()->json(['data' => $reports]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: GET /api/forum/moderation/reported-posts
    // Daftar post yang punya laporan pending
    // ─────────────────────────────────────────────────────────────────────
    public function reportedPosts(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $posts = ForumPost::with([
                'author:id,email',
                'author.profile:user_id,first_name,last_name',
                'category:id,name',
            ])
            ->whereHas('reports', function (Builder $query) {
                $query->where('status', 'pending')->where('target_type', 'post');
            })
            ->withCount([
                'reports as pending_reports_count' => function (Builder $query) {
                    $query->where('status', 'pending')->where('target_type', 'post');
                },
            ])
            ->orderByDesc('pending_reports_count')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $posts]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: POST /api/forum/moderation/posts/{id}/action
    // Moderasi post berdasarkan laporan (keep/remove)
    // ─────────────────────────────────────────────────────────────────────
    public function moderatePost(Request $request, string $postId): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $validated = $request->validate([
            'decision' => 'required|in:keep,remove',
            'notes' => 'nullable|string|max:500',
        ]);

        return $this->moderatePostByDecision(
            $request,
            $postId,
            $validated['decision'],
            $validated['notes'] ?? null
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN: PUT /api/forum/reports/{id}/review
    // Review laporan
    // ─────────────────────────────────────────────────────────────────────
    public function review(Request $request, string $reportId): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:reviewed,resolved,dismissed',
            'action' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:500',
        ]);

        $report = ForumReport::findOrFail($reportId);
        $action = strtolower((string) ($validated['action'] ?? ''));
        $notes = $validated['notes'] ?? $this->extractActionNote($validated['action'] ?? null);

        if ($report->target_type === 'post' && str_contains($action, 'remove')) {
            return $this->moderatePostByDecision(
                $request,
                (string) $report->target_id,
                'remove',
                $notes ?? ($validated['action'] ?? null)
            );
        }

        if ($report->target_type === 'post' && (str_contains($action, 'keep') || str_contains($action, 'dismiss'))) {
            return $this->moderatePostByDecision(
                $request,
                (string) $report->target_id,
                'keep',
                $notes ?? ($validated['action'] ?? null)
            );
        }

        $report->update([
            'status'      => $validated['status'],
            'action'      => $validated['action'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'notes'       => $notes,
        ]);

        if (str_contains($action, 'warn')) {
            $this->notifyWarnedUser($request, $report, $notes);
        }

        $this->logAudit(
            $request,
            'forum_report_review',
            'forum_report',
            $report->id,
            [
                'status' => $validated['status'],
                'action' => $validated['action'] ?? null,
                'notes' => $notes,
            ]
        );

        return response()->json([
            'message' => 'Laporan berhasil direview.',
            'data'    => $report,
        ]);
    }
}