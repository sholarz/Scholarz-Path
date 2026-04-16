<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('forum_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('forum_category_id')->nullable()->constrained('forum_categories')->nullOnDelete();
            $table->string('title', 255);
            $table->longText('content');
            $table->json('tags')->nullable();
            $table->string('status', 30)->default('pending');
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('saves_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('report_count')->default(0);
            $table->timestamps();

            $table->index(['status']);
            $table->index(['forum_category_id', 'status']);
            $table->index(['author_id', 'status']);
        });

        Schema::create('forum_post_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('post_id')->constrained('forum_posts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('forum_post_saves', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('post_id')->constrained('forum_posts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('forum_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('post_id')->constrained('forum_posts')->cascadeOnDelete();
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->longText('content');
            $table->unsignedInteger('likes_count')->default(0);
            $table->boolean('is_reported')->default(false);
            $table->timestamps();

            $table->index(['post_id', 'created_at']);
        });

        Schema::create('forum_comment_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('comment_id')->constrained('forum_comments')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['comment_id', 'user_id']);
        });

        Schema::create('forum_replies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('comment_id')->constrained('forum_comments')->cascadeOnDelete();
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->longText('content');
            $table->unsignedInteger('likes_count')->default(0);
            $table->boolean('is_solution')->default(false);
            $table->timestamps();

            $table->index(['comment_id', 'created_at']);
        });

        Schema::create('forum_reply_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reply_id')->constrained('forum_replies')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['reply_id', 'user_id']);
        });

        Schema::create('forum_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reporter_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('target_type', 50);
            $table->string('target_id');
            $table->string('reason', 255);
            $table->text('description');
            $table->string('status', 30)->default('pending');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('action', 50)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['status']);
            $table->index(['target_type', 'target_id']);
            $table->index(['reporter_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_reports');
        Schema::dropIfExists('forum_reply_likes');
        Schema::dropIfExists('forum_replies');
        Schema::dropIfExists('forum_comment_likes');
        Schema::dropIfExists('forum_comments');
        Schema::dropIfExists('forum_post_saves');
        Schema::dropIfExists('forum_post_likes');
        Schema::dropIfExists('forum_posts');
        Schema::dropIfExists('forum_categories');
    }
};