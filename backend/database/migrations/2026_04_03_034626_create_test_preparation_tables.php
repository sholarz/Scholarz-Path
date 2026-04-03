<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── TABEL 1: test_categories ───────────────────────────────────────
        Schema::create('test_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('created_by')->nullable();             // inisial "GB" — user admin pembuat
            $table->string('name', 150);                        // "TOEFL ITP Reading Comprehension"
            $table->string('slug', 170)->unique();              // "toefl-itp-reading-comprehension"
            $table->text('description')->nullable();
            $table->enum('test_type', ['ielts', 'toefl', 'general']);
            $table->enum('section', [
                'reading', 'listening', 'writing',
                'speaking', 'structure', 'vocabulary', 'general'
            ]);
            $table->enum('difficulty', ['beginner', 'intermediate', 'advanced'])
                  ->default('intermediate');                    // ditampilkan di kartu test
            $table->integer('time_limit_minutes');              // "30 minutes"
            $table->integer('total_questions');                 // "15 Questions"
            $table->integer('passing_score_percentage')
                  ->default(70);                               // "Passing Score: 70%"
            $table->enum('access_level', ['free', 'premium'])
                  ->default('free');                           // free = "Start Test", premium = locked
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('created_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');
            $table->index(['test_type', 'section']);
            $table->index(['access_level']);
            $table->index(['difficulty']);
            $table->index(['is_active']);
        });

        // ── TABEL 2: test_questions ────────────────────────────────────────
        Schema::create('test_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('category_id');
            $table->text('passage')->nullable();                // teks bacaan di atas soal
            $table->text('question_text');                      // pertanyaannya
            $table->string('option_a', 500);
            $table->string('option_b', 500);
            $table->string('option_c', 500);
            $table->string('option_d', 500);
            $table->enum('correct_answer', ['a', 'b', 'c', 'd']);
            $table->text('explanation')->nullable();            // pembahasan (tampil di review)
            $table->integer('points')->default(5);              // "5 points" per soal
            $table->integer('order_index')->default(0);         // urutan soal (Question 1 of 5)
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('category_id')
                  ->references('id')->on('test_categories')
                  ->onDelete('cascade');
            $table->index(['category_id', 'order_index']);
            $table->index(['is_active']);
        });

        // ── TABEL 3: test_sessions ─────────────────────────────────────────
        Schema::create('test_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('category_id');
            $table->enum('status', [
                'in_progress',  // sedang dikerjakan (timer jalan)
                'completed',    // submit manual
                'timed_out',    // waktu habis, auto-submit
                'abandoned'     // user keluar tanpa submit
            ])->default('in_progress');
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('expires_at');                    // started_at + time_limit
            $table->integer('time_taken_seconds')->nullable();  // total waktu pengerjaan
            $table->integer('score')->nullable();               // skor akhir 0-100
            $table->integer('correct_count')->nullable();       // "Correct Answers: 3"
            $table->integer('total_questions');                 // "Total Questions: 5"
            $table->integer('passing_score_percentage');        // snapshot dari category (70%)
            $table->boolean('is_passed')->nullable();           // apakah score >= passing_score
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
            $table->foreign('category_id')
                  ->references('id')->on('test_categories')
                  ->onDelete('cascade');
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'category_id']);
            $table->index(['category_id']);
            $table->index(['expires_at']);                      // untuk cek timer expired
        });

        // ── TABEL 4: test_session_answers ──────────────────────────────────
        Schema::create('test_session_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id');
            $table->uuid('question_id');
            $table->integer('question_order');                  // snapshot urutan soal (1,2,3...)
            $table->enum('chosen_answer', ['a', 'b', 'c', 'd'])
                  ->nullable();                                 // null = belum dijawab
            $table->enum('correct_answer', ['a', 'b', 'c', 'd']); // snapshot jawaban benar
            $table->boolean('is_correct')->nullable();          // untuk review page
            $table->integer('points_earned')->default(0);       // poin yang didapat dari soal ini
            $table->integer('time_spent_seconds')->nullable();  // waktu untuk soal ini
            $table->timestamps();

            $table->foreign('session_id')
                  ->references('id')->on('test_sessions')
                  ->onDelete('cascade');
            $table->foreign('question_id')
                  ->references('id')->on('test_questions')
                  ->onDelete('cascade');

            $table->unique(['session_id', 'question_id']);
            $table->index(['session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_session_answers');
        Schema::dropIfExists('test_sessions');
        Schema::dropIfExists('test_questions');
        Schema::dropIfExists('test_categories');
    }
};