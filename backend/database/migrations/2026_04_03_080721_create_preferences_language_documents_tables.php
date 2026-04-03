<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── TABEL 1: user_preferences ──────────────────────────────────────
        // Menyimpan pilihan negara tujuan & bidang studi user
        // Setiap baris = satu pilihan (multi-select disimpan per baris)
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('type', ['country', 'field_of_study']);
            // type 'country'       → value = "Japan", "Australia", "USA"
            // type 'field_of_study'→ value = "Computer Science", "Medicine"
            $table->string('value', 200);
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            // Satu user tidak boleh pilih negara/bidang yang sama dua kali
            $table->unique(['user_id', 'type', 'value']);
            $table->index(['user_id', 'type']);
        });

        // ── TABEL 2: user_language_tests ───────────────────────────────────
        // Skor tes bahasa user (IELTS, TOEFL, dll)
        Schema::create('user_language_tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('test_name', ['ielts', 'toefl_ibt', 'toefl_itp', 'toeic', 'duolingo', 'other']);
            $table->string('other_test_name', 100)->nullable(); // kalau pilih 'other'
            $table->decimal('overall_score', 5, 2);             // skor total: 7.5, 100, dll
            $table->json('section_scores')->nullable();
            // Contoh isi section_scores untuk IELTS:
            // { "listening": 8.0, "reading": 7.5, "writing": 6.5, "speaking": 7.0 }
            // Contoh untuk TOEFL iBT:
            // { "listening": 28, "reading": 29, "writing": 24, "speaking": 22 }
            $table->date('test_date');                          // tanggal tes
            $table->date('expiry_date')->nullable();            // IELTS valid 2 tahun
            $table->string('certificate_number', 100)->nullable();
            $table->boolean('is_verified')->default(false);     // admin bisa verify
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            $table->index(['user_id']);
            $table->index(['user_id', 'test_name']);
            $table->index(['expiry_date']);
        });

        // ── TABEL 3: user_documents ────────────────────────────────────────
        // Status kesiapan dokumen user (cek, bukan upload file)
        Schema::create('user_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('document_type', [
                'passport',              // paspor
                'transcript',            // transkrip akademik
                'diploma',               // ijazah
                'recommendation_letter', // surat rekomendasi
                'motivation_letter',     // surat motivasi
                'cv',                    // curriculum vitae
                'language_certificate',  // sertifikat bahasa
                'financial_statement',   // bukti keuangan
                'medical_certificate',   // surat keterangan sehat
                'photo',                 // foto formal
                'other',                 // dokumen lain
            ]);
            $table->string('document_name', 200)->nullable(); // nama custom kalau 'other'
            $table->enum('status', [
                'not_started',   // belum dipersiapkan
                'in_progress',   // sedang dipersiapkan
                'ready',         // sudah siap
                'expired',       // sudah expired (paspor, dll)
            ])->default('not_started');
            $table->date('expiry_date')->nullable();          // untuk paspor, dll
            $table->text('notes')->nullable();                // catatan user
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            // Satu user satu jenis dokumen (kecuali 'other')
            $table->unique(['user_id', 'document_type']);
            $table->index(['user_id']);
            $table->index(['user_id', 'status']);
        });

        // ── TABEL 4: lookup_countries ──────────────────────────────────────
        // Master data negara untuk dropdown preferences
        Schema::create('lookup_countries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);                      // "Japan"
            $table->string('code', 3)->unique();              // "JPN" (ISO 3166-1 alpha-3)
            $table->string('flag_emoji', 10)->nullable();     // "🇯🇵"
            $table->boolean('is_popular')->default(false);    // negara populer tujuan beasiswa
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_popular']);
            $table->index(['is_active']);
        });

        // ── TABEL 5: lookup_fields_of_study ────────────────────────────────
        // Master data bidang studi untuk dropdown preferences
        Schema::create('lookup_fields_of_study', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);                      // "Computer Science"
            $table->string('category', 100)->nullable();      // "Technology", "Medicine"
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category']);
            $table->index(['is_popular']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lookup_fields_of_study');
        Schema::dropIfExists('lookup_countries');
        Schema::dropIfExists('user_documents');
        Schema::dropIfExists('user_language_tests');
        Schema::dropIfExists('user_preferences');
    }
};