<?php

namespace Database\Seeders;

use App\Models\AdminAuditLog;
use App\Models\AdminReport;
use App\Models\User;
use App\Models\UserForumBan;
use Illuminate\Database\Seeder;

class AdminDemoSeeder extends Seeder
{
    /**
     * Seed demo data for admin tables.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        if (! $admin) {
            $admin = User::factory()->create([
                'email' => 'admin.demo@example.com',
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
        }

        $reporter = User::factory()->create([
            'email' => 'reporter.demo@example.com',
            'role' => 'free',
            'status' => 'active',
        ]);

        $targetUser = User::factory()->create([
            'email' => 'target.demo@example.com',
            'role' => 'free',
            'status' => 'active',
        ]);

        $report = AdminReport::updateOrCreate(
            [
                'reporter_user_id' => $reporter->id,
                'target_type' => 'forum_topic',
                'target_id' => 'demo-topic-001',
            ],
            [
                'reason' => 'spam',
                'notes' => 'Demo report seeded for admin review.',
                'status' => 'open',
                'resolved_by' => null,
                'resolved_at' => null,
            ]
        );

        UserForumBan::updateOrCreate(
            [
                'user_id' => $targetUser->id,
                'admin_id' => $admin->id,
            ],
            [
                'reason' => 'Repeated spam in forum',
                'expires_at' => now()->addDays(7),
                'is_active' => true,
            ]
        );

        AdminAuditLog::updateOrCreate(
            [
                'admin_id' => $admin->id,
                'action' => 'seed_demo_admin_data',
                'target_type' => 'system',
                'target_id' => 'demo-bootstrap',
            ],
            [
                'metadata' => [
                    'report_id' => $report->id,
                    'reporter_id' => $reporter->id,
                    'target_user_id' => $targetUser->id,
                ],
            ]
        );
    }
}