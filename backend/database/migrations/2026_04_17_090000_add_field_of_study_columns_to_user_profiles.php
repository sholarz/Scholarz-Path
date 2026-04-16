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
        if (!Schema::hasColumn('user_profiles', 'field_of_study')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->string('field_of_study', 200)->nullable()->after('gpa');
            });
        }

        if (!Schema::hasColumn('user_profiles', 'sub_field')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->string('sub_field', 200)->nullable()->after('field_of_study');
            });
        }

        DB::table('user_profiles')
            ->whereNull('field_of_study')
            ->whereNotNull('major')
            ->update(['field_of_study' => DB::raw('major')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('user_profiles', 'sub_field')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->dropColumn('sub_field');
            });
        }

        if (Schema::hasColumn('user_profiles', 'field_of_study')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->dropColumn('field_of_study');
            });
        }
    }
};
