<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("
            ALTER TABLE user_language_tests
            DROP CONSTRAINT IF EXISTS user_language_tests_test_name_check
        ");

        DB::statement("
            ALTER TABLE user_language_tests
            ADD CONSTRAINT user_language_tests_test_name_check
            CHECK (test_name IN ('ielts', 'toefl_ibt', 'duolingo'))
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("
            ALTER TABLE user_language_tests
            DROP CONSTRAINT IF EXISTS user_language_tests_test_name_check
        ");

        DB::statement("
            ALTER TABLE user_language_tests
            ADD CONSTRAINT user_language_tests_test_name_check
            CHECK (test_name IN ('ielts', 'toefl_ibt', 'toefl_itp', 'toeic', 'duolingo', 'other'))
        ");
    }
};