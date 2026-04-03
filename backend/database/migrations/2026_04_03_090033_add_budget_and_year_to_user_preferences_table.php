<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            $table->enum('budget_preference', [
                'full_scholarship',
                'partial_scholarship',
                'self_funded',
            ])->nullable()->after('user_id');

            $table->integer('preferred_start_year')
                  ->nullable()
                  ->after('budget_preference');
        });
    }

    public function down(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            $table->dropColumn(['budget_preference', 'preferred_start_year']);
        });
    }
};