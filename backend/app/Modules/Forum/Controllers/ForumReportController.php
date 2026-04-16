<?php

namespace App\Modules\Forum\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ForumPost;
use App\Models\ForumComment;
use App\Models\ForumReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumReportController extends Controller
{
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

        // Cek apakah user sudah pernah lapor post ini
        $alreadyReported = ForumReport::where('reporter_id', $request->user()->id)
            ->where('target_type', 'post')
            ->where('target_id', $postId)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'Anda sudah melaporkan post ini.'], 422);
        }

        ForumReport::create([
            'reporter_id' => $request->user()->id,
            'target_type' => 'post',
            'target_id'   => $postId,
            'reason'      => $request->reason,
            'description' => $request->description,
        ]);

        // Update flag di post
        $post->increment('report_count');
        $post->update(['is_reported' => true]);

        return response()->json(['message' => 'Laporan berhasil dikirim.'], 201);
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

        $alreadyReported = ForumReport::where('reporter_id', $request->user()->id)
            ->where('target_type', 'comment')
            ->where('target_id', $commentId)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'Anda sudah melaporkan komentar ini.'], 422);
        }

        ForumReport::create([
            'reporter_id' => $request->user()->id,
            'target_type' => 'comment',
            'target_id'   => $commentId,
            'reason'      => $request->reason,
            'description' => $request->description,
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

        $reports = ForumReport::with(['reporter:id,email'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['data' => $reports]);
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

        $request->validate([
            'status' => 'required|in:reviewed,resolved,dismissed',
            'action' => 'nullable|string|max:200',
        ]);

        $report = ForumReport::findOrFail($reportId);
        $report->update([
            'status'      => $request->status,
            'action'      => $request->action,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Laporan berhasil direview.',
            'data'    => $report,
        ]);
    }
}