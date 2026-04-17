<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('forum_reports')) {
            Schema::create('forum_reports', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('post_id');
                $table->uuid('user_id');
                $table->string('reason', 255);
                $table->timestamps();

                $table->foreign('post_id')->references('id')->on('forum_posts')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index(['post_id']);
                $table->index(['user_id']);
            });
        } else {
            Schema::table('forum_reports', function (Blueprint $table) {
                if (!Schema::hasColumn('forum_reports', 'post_id')) {
                    $table->uuid('post_id')->nullable()->after('id');
                }

                if (!Schema::hasColumn('forum_reports', 'user_id')) {
                    $table->uuid('user_id')->nullable()->after('post_id');
                }

                if (!Schema::hasColumn('forum_reports', 'reason')) {
                    $table->string('reason', 255)->nullable();
                }
            });

            if (DB::getDriverName() === 'pgsql') {
                DB::statement("UPDATE forum_reports SET post_id = target_id::uuid WHERE post_id IS NULL AND target_type = 'post' AND target_id ~* '^[0-9a-f-]{36}$'");
                DB::statement("UPDATE forum_reports SET user_id = reporter_user_id WHERE user_id IS NULL AND reporter_user_id IS NOT NULL");
            }
        }

        Schema::table('forum_posts', function (Blueprint $table) {
            if (!Schema::hasColumn('forum_posts', 'report_count')) {
                $table->unsignedInteger('report_count')->default(0)->after('comments_count');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE forum_posts ALTER COLUMN status SET DEFAULT 'published'");
            DB::statement("UPDATE forum_posts SET status = 'published' WHERE status IN ('pending', 'approved')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('forum_posts', 'status') && DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE forum_posts ALTER COLUMN status SET DEFAULT 'pending'");
        }

        if (Schema::hasColumn('forum_posts', 'report_count')) {
            Schema::table('forum_posts', function (Blueprint $table) {
                $table->dropColumn('report_count');
            });
        }
    }
};
