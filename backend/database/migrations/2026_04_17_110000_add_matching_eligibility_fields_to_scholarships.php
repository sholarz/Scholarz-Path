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
        Schema::table('scholarships', function (Blueprint $table) {
            if (!Schema::hasColumn('scholarships', 'maximum_gpa')) {
                $table->decimal('maximum_gpa', 3, 2)->nullable()->after('minimum_gpa');
            }

            if (!Schema::hasColumn('scholarships', 'eligible_degree_levels')) {
                $table->json('eligible_degree_levels')->nullable()->after('level');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scholarships', function (Blueprint $table) {
            if (Schema::hasColumn('scholarships', 'maximum_gpa')) {
                $table->dropColumn('maximum_gpa');
            }

            if (Schema::hasColumn('scholarships', 'eligible_degree_levels')) {
                $table->dropColumn('eligible_degree_levels');
            }
        });
    }
};
