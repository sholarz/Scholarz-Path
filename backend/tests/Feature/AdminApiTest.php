<?php

namespace Tests\Feature;

use App\Models\ScholarshipProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create(['role' => 'free']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/dashboard');

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Forbidden.');
    }

    public function test_admin_can_get_dashboard_stats(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'users' => ['total', 'active', 'banned', 'admins'],
                    'scholarships' => ['total', 'active', 'draft', 'featured'],
                    'reports' => ['open', 'resolved'],
                ],
                'message',
            ]);
    }

    public function test_admin_can_update_user_role_and_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'free', 'status' => 'active']);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'premium'])
            ->assertOk()
            ->assertJsonPath('data.role', 'premium');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/status", ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'role' => 'premium',
            'status' => 'inactive',
        ]);

        $this->assertDatabaseHas('admin_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'update_user_status',
            'target_id' => $target->id,
        ]);
    }

    public function test_admin_can_create_scholarship(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $provider = ScholarshipProvider::create([
            'name' => 'Scholarz Foundation',
            'country' => 'Indonesia',
            'is_verified' => true,
        ]);

        $payload = [
            'provider_id' => $provider->id,
            'title' => 'Scholarz Test Scholarship',
            'description' => 'A sample scholarship for admin API test.',
            'type' => 'full',
            'level' => 'bachelor',
            'application_deadline' => now()->addMonth()->toDateString(),
            'application_url' => 'https://example.com/apply',
            'status' => 'active',
            'is_featured' => true,
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/scholarships', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Scholarz Test Scholarship');

        $this->assertDatabaseHas('scholarships', [
            'title' => 'Scholarz Test Scholarship',
            'provider_id' => $provider->id,
            'type' => 'full',
            'level' => 'bachelor',
        ]);
    }

    public function test_admin_can_moderate_report_and_ban_user_for_forum(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create(['role' => 'free']);
        $targetUser = User::factory()->create(['role' => 'free']);

        $this->assertDatabaseCount('admin_reports', 0);

        // Seed one report directly for moderation flow testing.
        $reportId = Str::uuid()->toString();
        DB::table('admin_reports')->insert([
            'id' => $reportId,
            'reporter_user_id' => $reporter->id,
            'target_type' => 'forum_topic',
            'target_id' => 'topic-1',
            'reason' => 'spam',
            'notes' => null,
            'status' => 'open',
            'resolved_by' => null,
            'resolved_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/forum/topics/{$reportId}/status", [
                'status' => 'resolved',
                'reason' => 'Handled by moderator',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/forum/users/{$targetUser->id}/forum-ban", [
                'reason' => 'Repeated spam',
            ])
            ->assertOk()
            ->assertJsonPath('data.user_id', $targetUser->id);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/forum/bans')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/reports')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/reports/{$reportId}/resolve", [
                'status' => 'resolved',
                'notes' => 'Resolved from admin report queue',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/forum/users/{$targetUser->id}/forum-unban")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/reports/audit-logs')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('forum_moderation_actions', [
            'admin_id' => $admin->id,
            'action' => 'forum_ban',
            'target_id' => $targetUser->id,
        ]);

        $this->assertDatabaseHas('forum_moderation_actions', [
            'admin_id' => $admin->id,
            'action' => 'forum_unban',
            'target_id' => $targetUser->id,
        ]);

        $this->assertDatabaseHas('admin_reports', [
            'id' => $reportId,
            'status' => 'resolved',
            'resolved_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('user_forum_bans', [
            'admin_id' => $admin->id,
            'user_id' => $targetUser->id,
            'is_active' => false,
        ]);
    }
}