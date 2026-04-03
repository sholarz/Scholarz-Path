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
        Schema::create('scholarship_providers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('website', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->string('country', 100)->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
            
            $table->index(['name']);
            $table->index(['is_verified']);
        });

        Schema::create('scholarships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('provider_id');
            $table->string('title', 300);
            $table->text('description');
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->enum('type', ['full', 'partial', 'merit', 'need_based', 'sports', 'academic']);
            $table->enum('level', ['high_school', 'bachelor', 'master', 'doctorate', 'postdoc']);
            $table->json('target_countries')->nullable();
            $table->json('eligible_nationalities')->nullable();
            $table->json('fields_of_study')->nullable();
            $table->decimal('minimum_gpa', 3, 2)->nullable();
            $table->json('language_requirements')->nullable();
            $table->date('application_deadline');
            $table->date('start_date')->nullable();
            $table->integer('duration_months')->nullable();
            $table->string('application_url', 1000);
            $table->text('requirements')->nullable();
            $table->text('benefits')->nullable();
            $table->text('selection_criteria')->nullable();
            $table->text('application_process')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired', 'draft'])->default('active');
            $table->boolean('is_featured')->default(false);
            $table->integer('view_count')->default(0);
            $table->integer('application_count')->default(0);
            $table->timestamp('scraped_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->timestamps();

            $table->foreign('provider_id')->references('id')->on('scholarship_providers');
            $table->index(['provider_id']);
            $table->index(['level']);
            $table->index(['type']);
            $table->index(['application_deadline']);
            $table->index(['status']);
            $table->index(['is_featured']);
            $table->index(['amount']);
            // SQLite does not support fullText index in Laravel schema grammar.
            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['title', 'description']);
            }
        });

        Schema::create('scholarship_matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('scholarship_id');
            $table->decimal('match_score', 5, 2);
            $table->json('criteria_met')->nullable();
            $table->json('criteria_missing')->nullable();
            $table->text('recommendations')->nullable();
            $table->boolean('is_bookmarked')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('scholarship_id')->references('id')->on('scholarships')->onDelete('cascade');
            $table->unique(['user_id', 'scholarship_id']);
            $table->index(['user_id']);
            $table->index(['scholarship_id']);
            $table->index(['match_score']);
            $table->index(['user_id', 'is_bookmarked']);
        });

        Schema::create('match_searches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->json('search_criteria');
            $table->integer('results_count')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_searches');
        Schema::dropIfExists('scholarship_matches');
        Schema::dropIfExists('scholarships');
        Schema::dropIfExists('scholarship_providers');
    }
};