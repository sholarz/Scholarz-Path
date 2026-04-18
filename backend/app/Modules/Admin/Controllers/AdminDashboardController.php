<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\AdminReport;
use App\Models\ForumPost;
use App\Models\ForumModerationAction;
use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use App\Models\UserForumBan;
use App\Models\UserSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AdminDashboardController extends Controller
{
    public function getDashboardStats(): JsonResponse
    {
        $recentActivity = collect()
            ->merge(
                User::query()
                    ->latest('created_at')
                    ->limit(3)
                    ->get(['email', 'role', 'created_at'])
                    ->map(function (User $user): array {
                        return [
                            'type' => 'user',
                            'title' => 'New user registration',
                            'description' => $user->email . ' joined as ' . ucfirst((string) $user->role) . ' user',
                            'timestamp' => optional($user->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->merge(
                UserSubscription::query()
                    ->with('user:id,email')
                    ->latest('created_at')
                    ->limit(3)
                    ->get(['user_id', 'status', 'payment_method', 'created_at'])
                    ->map(function (UserSubscription $subscription): array {
                        return [
                            'type' => 'payment',
                            'title' => 'Payment submitted',
                            'description' => ($subscription->user?->email ?? 'Unknown user')
                                . ' submitted payment via '
                                . ($subscription->payment_method ?: 'unknown method')
                                . ' (' . strtoupper((string) $subscription->status) . ')',
                            'timestamp' => optional($subscription->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->merge(
                ForumPost::query()
                    ->with('author:id,email')
                    ->latest('created_at')
                    ->limit(3)
                    ->get(['author_id', 'title', 'created_at'])
                    ->map(function (ForumPost $post): array {
                        return [
                            'type' => 'forum',
                            'title' => 'New forum post',
                            'description' => ($post->author?->email ?? 'Unknown user') . ' created: ' . $post->title,
                            'timestamp' => optional($post->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->merge(
                AdminReport::query()
                    ->with('reporter:id,email')
                    ->latest('created_at')
                    ->limit(3)
                    ->get(['reporter_user_id', 'reason', 'status', 'created_at'])
                    ->map(function (AdminReport $report): array {
                        return [
                            'type' => 'report',
                            'title' => 'Content reported',
                            'description' => ($report->reporter?->email ?? 'Unknown user')
                                . ' reported content (' . strtoupper((string) $report->status) . ')',
                            'timestamp' => optional($report->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->filter(fn (array $entry): bool => !empty($entry['timestamp']))
            ->sortByDesc(function (array $entry) {
                return Carbon::parse((string) $entry['timestamp'])->timestamp;
            })
            ->values()
            ->take(8)
            ->all();

        return $this->success([
            'users' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'banned' => User::where('status', 'banned')->count(),
                'admins' => User::where('role', 'admin')->count(),
            ],
            'scholarships' => [
                'total' => Scholarship::count(),
                'active' => Scholarship::where('status', 'active')->count(),
                'draft' => Scholarship::where('status', 'draft')->count(),
                'featured' => Scholarship::where('is_featured', true)->count(),
            ],
            'reports' => [
                'open' => AdminReport::where('status', 'open')->count(),
                'resolved' => AdminReport::where('status', 'resolved')->count(),
            ],
            'recent_activity' => $recentActivity,
        ], 'Dashboard stats fetched successfully.');
    }

    public function index(): JsonResponse
    {
        return $this->getDashboardStats();
    }

    public function getUsers(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);

        $users = User::with('profile')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success($users, 'Users fetched successfully.');
    }

    public function getUserDetails(string $id): JsonResponse
    {
        $user = User::with(['profile', 'languages', 'subscription', 'scholarshipMatches'])
            ->findOrFail($id);

        return $this->success($user, 'User details fetched successfully.');
    }

    public function updateUserRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['guest', 'free', 'premium', 'admin'])],
        ]);

        $user = User::findOrFail($id);
        $actor = $request->user();

        if ($actor && $actor->id === $user->id && $validated['role'] !== 'admin') {
            return response()->json(['success' => false, 'message' => 'You cannot change your own admin role.'], 422);
        }

        $user->update(['role' => $validated['role']]);
        $this->logAction($request, 'update_user_role', User::class, $user->id, ['role' => $validated['role']]);

        return $this->success($user, 'User role updated successfully.');
    }

    public function updateUserStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'banned'])],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::findOrFail($id);
        $user->update(['status' => $validated['status']]);

        $this->logAction($request, 'update_user_status', User::class, $user->id, [
            'status' => $validated['status'],
            'reason' => $validated['reason'] ?? null,
        ]);

        return $this->success($user, 'User status updated successfully.');
    }

    public function getUserActivity(string $id): JsonResponse
    {
        $user = User::with(['languages', 'subscription', 'scholarshipMatches', 'roadmaps'])->findOrFail($id);

        return $this->success([
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'languages_count' => $user->languages->count(),
                'scholarship_matches_count' => $user->scholarshipMatches->count(),
                'roadmaps_count' => $user->roadmaps->count(),
                'last_seen_at' => $user->updated_at,
        ], 'User activity fetched successfully.');
    }

    public function getScholarshipsForAdmin(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);

        $scholarships = Scholarship::with('provider')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success($scholarships, 'Scholarships fetched successfully.');
    }

    public function createScholarship(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider_id' => ['nullable', 'uuid', Rule::exists('scholarship_providers', 'id')],
            'provider_name' => ['required_without:provider_id', 'string', 'max:200'],
            'provider_country' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:300'],
            'description' => ['required', 'string'],
            'type' => ['required', Rule::in(['full', 'partial', 'merit', 'need_based', 'sports', 'academic'])],
            'target_level' => ['required', Rule::in(['sma', 's1', 's2', 's3'])],
            'degree_level' => ['required', Rule::in(['s1', 's2', 's3'])],
            'application_deadline' => ['required', 'date'],
            'application_url' => ['required', 'url', 'max:1000'],
            'amount' => ['nullable', 'numeric'],
            'currency' => ['nullable', 'string', 'max:10'],
            'target_countries' => ['nullable', 'array'],
            'eligible_nationalities' => ['nullable', 'array'],
            'fields_of_study' => ['nullable', 'array'],
            'minimum_gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'language_requirements' => ['nullable', 'array'],
            'start_date' => ['nullable', 'date'],
            'duration_months' => ['nullable', 'integer', 'min:1'],
            'requirements' => ['nullable', 'array'],
            'benefits' => ['nullable', 'array'],
            'selection_criteria' => ['nullable', 'array'],
            'application_process' => ['nullable', 'array'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'expired', 'draft'])],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $payload = $this->normalizeScholarshipPayload($validated);

        $scholarship = Scholarship::create($payload);
        $this->logAction($request, 'create_scholarship', Scholarship::class, $scholarship->id, $payload);

        return response()->json([
            'success' => true,
            'data' => $scholarship->load('provider'),
            'message' => 'Scholarship created successfully.',
        ], 201);
    }

    public function updateScholarship(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'provider_id' => ['sometimes', 'uuid', Rule::exists('scholarship_providers', 'id')],
            'provider_name' => ['sometimes', 'string', 'max:200'],
            'provider_country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'title' => ['sometimes', 'string', 'max:300'],
            'description' => ['sometimes', 'string'],
            'type' => ['sometimes', Rule::in(['full', 'partial', 'merit', 'need_based', 'sports', 'academic'])],
            'target_level' => ['sometimes', Rule::in(['sma', 's1', 's2', 's3'])],
            'degree_level' => ['sometimes', Rule::in(['s1', 's2', 's3'])],
            'application_deadline' => ['sometimes', 'date'],
            'application_url' => ['sometimes', 'url', 'max:1000'],
            'amount' => ['sometimes', 'nullable', 'numeric'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'target_countries' => ['sometimes', 'array'],
            'eligible_nationalities' => ['sometimes', 'array'],
            'fields_of_study' => ['sometimes', 'array'],
            'minimum_gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'language_requirements' => ['sometimes', 'array'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'duration_months' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'requirements' => ['sometimes', 'nullable', 'array'],
            'benefits' => ['sometimes', 'nullable', 'array'],
            'selection_criteria' => ['sometimes', 'nullable', 'array'],
            'application_process' => ['sometimes', 'nullable', 'array'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'expired', 'draft'])],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        $scholarship = Scholarship::findOrFail($id);
        $payload = $this->normalizeScholarshipPayload($validated, false);
        $scholarship->update($payload);

        $this->logAction($request, 'update_scholarship', Scholarship::class, $scholarship->id, $payload);

        return $this->success($scholarship->fresh()->load('provider'), 'Scholarship updated successfully.');
    }

    public function deleteScholarship(Request $request, string $id): JsonResponse
    {
        $scholarship = Scholarship::findOrFail($id);
        $scholarship->delete();

        $this->logAction($request, 'delete_scholarship', Scholarship::class, $scholarship->id);

        return $this->success(null, 'Scholarship deleted successfully.');
    }

    public function verifyScholarship(Request $request, string $id): JsonResponse
    {
        $scholarship = Scholarship::findOrFail($id);
        $scholarship->update(['last_verified_at' => now(), 'status' => 'active']);

        $this->logAction($request, 'verify_scholarship', Scholarship::class, $scholarship->id);

        return $this->success($scholarship, 'Scholarship verified successfully.');
    }

    public function featureScholarship(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'is_featured' => ['required', 'boolean'],
        ]);

        $scholarship = Scholarship::findOrFail($id);
        $scholarship->update(['is_featured' => $validated['is_featured']]);

        $this->logAction($request, 'feature_scholarship', Scholarship::class, $scholarship->id, $validated);

        return $this->success($scholarship, 'Scholarship feature status updated.');
    }

    public function getFlaggedContent(): JsonResponse
    {
        $flagged = AdminReport::with(['reporter', 'resolver'])
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->paginate(15);

        return $this->success($flagged, 'Flagged content fetched successfully.');
    }

    public function getReports(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $status = $request->string('status')->toString();

        $reports = AdminReport::with(['reporter', 'resolver'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success($reports, 'Reports fetched successfully.');
    }

    public function resolveReport(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['resolved', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $report = AdminReport::findOrFail($id);
        $status = $validated['status'] ?? 'resolved';

        $report->update([
            'status' => $status,
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
            'notes' => $validated['notes'] ?? $report->notes,
        ]);

        ForumModerationAction::create([
            'admin_id' => $request->user()->id,
            'target_type' => $report->target_type,
            'target_id' => $report->target_id,
            'action' => 'resolve_report',
            'reason' => $validated['notes'] ?? null,
            'metadata' => ['report_id' => $report->id, 'status' => $status],
        ]);

        $this->logAction($request, 'resolve_report', AdminReport::class, $report->id, [
            'status' => $status,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->success($report->fresh(), 'Report resolved successfully.');
    }

    public function updateTopicStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['open', 'resolved', 'rejected'])],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $report = AdminReport::findOrFail($id);
        $report->update([
            'status' => $validated['status'],
            'resolved_by' => $validated['status'] === 'open' ? null : $request->user()->id,
            'resolved_at' => $validated['status'] === 'open' ? null : now(),
        ]);

        ForumModerationAction::create([
            'admin_id' => $request->user()->id,
            'target_type' => $report->target_type,
            'target_id' => $report->target_id,
            'action' => 'update_topic_status',
            'reason' => $validated['reason'] ?? null,
            'metadata' => ['report_id' => $report->id, 'status' => $validated['status']],
        ]);

        $this->logAction($request, 'update_topic_status', AdminReport::class, $report->id, $validated);

        return $this->success($report->fresh(), 'Topic report status updated successfully.');
    }

    public function deleteReply(Request $request, string $id): JsonResponse
    {
        ForumModerationAction::create([
            'admin_id' => $request->user()->id,
            'target_type' => 'forum_reply',
            'target_id' => $id,
            'action' => 'delete_reply',
        ]);

        $this->logAction($request, 'delete_reply', 'forum_reply', $id);

        return $this->success(['reply_id' => $id], 'Reply moderation action recorded.');
    }

    public function banFromForum(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $ban = UserForumBan::create([
            'user_id' => $id,
            'admin_id' => $request->user()->id,
            'reason' => $validated['reason'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'is_active' => true,
        ]);

        ForumModerationAction::create([
            'admin_id' => $request->user()->id,
            'target_type' => 'user',
            'target_id' => $id,
            'action' => 'forum_ban',
            'reason' => $validated['reason'] ?? null,
            'metadata' => ['expires_at' => $validated['expires_at'] ?? null],
        ]);

        $this->logAction($request, 'ban_from_forum', User::class, $id, $validated);

        return $this->success($ban, 'User banned from forum successfully.');
    }

    public function getForumBans(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $status = $request->string('status')->toString();

        $bans = UserForumBan::with(['user', 'admin'])
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success($bans, 'Forum bans fetched successfully.');
    }

    public function unbanFromForum(Request $request, string $id): JsonResponse
    {
        $ban = UserForumBan::where('user_id', $id)
            ->where('is_active', true)
            ->latest('created_at')
            ->first();

        if (! $ban) {
            return response()->json(['success' => false, 'message' => 'No active forum ban found for this user.'], 404);
        }

        $ban->update(['is_active' => false, 'expires_at' => now()]);

        ForumModerationAction::create([
            'admin_id' => $request->user()->id,
            'target_type' => 'user',
            'target_id' => $id,
            'action' => 'forum_unban',
            'metadata' => ['ban_id' => $ban->id],
        ]);

        $this->logAction($request, 'unban_from_forum', User::class, $id, ['ban_id' => $ban->id]);

        return $this->success($ban->fresh(), 'User unbanned from forum successfully.');
    }

    public function getAuditLogs(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 20);
        $action = $request->string('action')->toString();
        $adminId = $request->string('admin_id')->toString();

        $logs = AdminAuditLog::with('admin')
            ->when($action !== '', fn ($query) => $query->where('action', $action))
            ->when($adminId !== '', fn ($query) => $query->where('admin_id', $adminId))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success($logs, 'Audit logs fetched successfully.');
    }

    public function getAnalytics(): JsonResponse
    {
        return $this->success([
                'total_admin_logs' => AdminAuditLog::count(),
                'latest_actions' => AdminAuditLog::latest()->limit(10)->get(),
                'open_reports' => AdminReport::where('status', 'open')->count(),
                'forum_bans_active' => UserForumBan::where('is_active', true)->count(),
        ], 'Analytics fetched successfully.');
    }

    public function getUsageStats(): JsonResponse
    {
        return $this->success([
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'total_scholarships' => Scholarship::count(),
        ], 'Usage stats fetched successfully.');
    }

    public function getRevenueStats(): JsonResponse
    {
        return $this->success([
            'message' => 'Revenue integration is not available in current backend scope.',
        ], 'Revenue stats fetched successfully.');
    }

    public function getScrapingLogs(): JsonResponse
    {
        return $this->success([
            'message' => 'Scraping logs endpoint placeholder.',
        ], 'Scraping logs fetched successfully.');
    }

    private function logAction(Request $request, string $action, ?string $targetType = null, ?string $targetId = null, array $metadata = []): void
    {
        $actor = $request->user();

        if (! $actor) {
            return;
        }

        $encodedMetadata = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);

        AdminAuditLog::create([
            'admin_id' => $actor->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $encodedMetadata === false ? '{}' : $encodedMetadata,
        ]);
    }

    private function success($data = null, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ]);
    }

    private function normalizeScholarshipPayload(array $data, bool $creating = true): array
    {
        if (isset($data['degree_level'])) {
            $data['level'] = match ($data['degree_level']) {
                's1' => 'bachelor',
                's2' => 'master',
                's3' => 'doctorate',
                default => 'bachelor',
            };
        }

        if (isset($data['provider_name']) && !isset($data['provider_id'])) {
            $provider = ScholarshipProvider::query()->firstOrCreate(
                [
                    'name' => $data['provider_name'],
                    'country' => $data['provider_country'] ?? null,
                ],
                [
                    'is_verified' => true,
                ]
            );

            $data['provider_id'] = $provider->id;
        }

        unset($data['provider_name'], $data['provider_country']);

        foreach (['fields_of_study', 'requirements', 'benefits', 'selection_criteria', 'application_process'] as $field) {
            if (array_key_exists($field, $data) && is_array($data[$field])) {
                $data[$field] = array_values(array_filter($data[$field], fn ($value) => $value !== null && $value !== ''));
            }
        }

        foreach ([
            'target_countries',
            'eligible_nationalities',
            'fields_of_study',
            'language_requirements',
            'requirements',
            'benefits',
            'selection_criteria',
            'application_process',
        ] as $jsonField) {
            if (array_key_exists($jsonField, $data) && is_array($data[$jsonField])) {
                $data[$jsonField] = json_encode($data[$jsonField], JSON_UNESCAPED_UNICODE);
            }
        }

        if ($creating && !isset($data['status'])) {
            $data['status'] = 'draft';
        }

        return $data;
    }
}
