<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus data lama dulu supaya tidak conflict
        DB::table('user_documents')->truncate();

        // Ganti constraint document_type hanya 5 dokumen
        DB::statement("
            ALTER TABLE user_documents
            DROP CONSTRAINT IF EXISTS user_documents_document_type_check
        ");

        DB::statement("
            ALTER TABLE user_documents
            ADD CONSTRAINT user_documents_document_type_check
            CHECK (document_type IN (
                'cv',
                'motivation_letter',
                'recommendation_letter',
                'transcript',
                'passport'
            ))
        ");

        // Ganti constraint status jadi hanya 2
        DB::statement("
            ALTER TABLE user_documents
            DROP CONSTRAINT IF EXISTS user_documents_status_check
        ");

        DB::statement("
            ALTER TABLE user_documents
            ADD CONSTRAINT user_documents_status_check
            CHECK (status IN ('ready', 'not_ready'))
        ");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE user_documents DROP CONSTRAINT IF EXISTS user_documents_document_type_check");
        DB::statement("ALTER TABLE user_documents DROP CONSTRAINT IF EXISTS user_documents_status_check");
    }
};
