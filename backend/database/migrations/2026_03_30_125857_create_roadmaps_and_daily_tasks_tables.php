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
    // Tambahkan ini sebelum create roadmaps
    if (!Schema::hasTable('roadmaps')) {
        Schema::create('roadmaps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('scholarship_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('deadline');
            $table->integer('progress_percentage')->default(0);
            $table->enum('status', ['active', 'completed', 'abandoned'])->default('active');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('scholarship_id')->references('id')->on('scholarships')->onDelete('set null');
            $table->index(['user_id']);
        });
    } else {
        // Table sudah ada tapi mungkin kurang kolom deadline — tambahkan kalau belum ada
        if (!Schema::hasColumn('roadmaps', 'deadline')) {
            Schema::table('roadmaps', function (Blueprint $table) {
                $table->date('deadline')->nullable()->after('description');
            });
        }
    }

    // daily_tasks biasanya belum ada, tapi sama-sama dicek
    if (!Schema::hasTable('daily_tasks')) {
        Schema::create('daily_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('roadmap_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date');
            $table->enum('status', ['pending', 'completed', 'skipped'])->default('pending');
            $table->integer('day_number');
            $table->timestamps();

            $table->foreign('roadmap_id')->references('id')->on('roadmaps')->onDelete('cascade');
            $table->index(['roadmap_id']);
            $table->index(['due_date']);
        });
    }
}
};
