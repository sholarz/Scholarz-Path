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

        // PostgreSQL tidak bisa ALTER ENUM langsung,
        // jadi kita ganti constraint-nya
        DB::statement("
            ALTER TABLE user_preferences
            DROP CONSTRAINT IF EXISTS user_preferences_type_check
        ");

        DB::statement("
            ALTER TABLE user_preferences
            ADD CONSTRAINT user_preferences_type_check
            CHECK (type IN ('country', 'field_of_study', 'general'))
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("
            ALTER TABLE user_preferences
            DROP CONSTRAINT IF EXISTS user_preferences_type_check
        ");

        DB::statement("
            ALTER TABLE user_preferences
            ADD CONSTRAINT user_preferences_type_check
            CHECK (type IN ('country', 'field_of_study'))
        ");
    }
};
