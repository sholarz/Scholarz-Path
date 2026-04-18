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
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('target_degree', 100)->nullable()->after('degree_level');
            $table->integer('expected_start_year')->nullable()->after('graduation_year');
            $table->string('application_status', 100)->nullable()->after('expected_start_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['target_degree', 'expected_start_year', 'application_status']);
        });
    }
};
