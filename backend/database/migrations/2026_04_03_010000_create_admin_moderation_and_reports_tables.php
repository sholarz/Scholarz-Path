<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admin_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reporter_user_id')->nullable();
            $table->string('target_type', 100);
            $table->string('target_id');
            $table->string('reason', 255);
            $table->text('notes')->nullable();
            $table->string('status', 30)->default('open');
            $table->uuid('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('reporter_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['status']);
            $table->index(['target_type']);
            $table->index(['target_id']);
        });

        Schema::create('forum_moderation_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_id');
            $table->string('target_type', 100);
            $table->string('target_id');
            $table->string('action', 50);
            $table->string('reason', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['action']);
            $table->index(['target_type', 'target_id']);
        });

        Schema::create('user_forum_bans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('admin_id');
            $table->string('reason', 255)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_forum_bans');
        Schema::dropIfExists('forum_moderation_actions');
        Schema::dropIfExists('admin_reports');
    }
};