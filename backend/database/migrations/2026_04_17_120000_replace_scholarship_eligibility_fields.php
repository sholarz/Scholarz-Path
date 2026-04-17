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
        Schema::table('scholarships', function (Blueprint $table) {
            if (!Schema::hasColumn('scholarships', 'target_level')) {
                $table->string('target_level', 10)->nullable()->after('level');
            }

            if (!Schema::hasColumn('scholarships', 'degree_level')) {
                $table->string('degree_level', 10)->nullable()->after('target_level');
            }
        });

        DB::table('scholarships')
            ->whereNull('degree_level')
            ->update([
                'degree_level' => DB::raw("CASE level WHEN 'bachelor' THEN 's1' WHEN 'master' THEN 's2' WHEN 'doctorate' THEN 's3' WHEN 'postdoc' THEN 's3' ELSE 's1' END"),
            ]);

        DB::table('scholarships')
            ->whereNull('target_level')
            ->update([
                'target_level' => DB::raw("CASE degree_level WHEN 's1' THEN 'sma' WHEN 's2' THEN 's1' WHEN 's3' THEN 's2' ELSE 'sma' END"),
            ]);

        if (DB::getDriverName() === 'pgsql') {
            $requirementsType = DB::table('information_schema.columns')
                ->where('table_name', 'scholarships')
                ->where('column_name', 'requirements')
                ->value('data_type');

            $benefitsType = DB::table('information_schema.columns')
                ->where('table_name', 'scholarships')
                ->where('column_name', 'benefits')
                ->value('data_type');

            if (in_array($requirementsType, ['json', 'jsonb'], true)) {
                DB::statement("\n                    UPDATE scholarships\n                    SET requirements = CASE\n                        WHEN requirements IS NULL THEN '[]'::jsonb\n                        WHEN jsonb_typeof(requirements::jsonb) = 'array' THEN requirements::jsonb\n                        WHEN jsonb_typeof(requirements::jsonb) = 'string' THEN jsonb_build_array(regexp_replace(requirements::text, '^\"|\"$', '', 'g'))\n                        ELSE '[]'::jsonb\n                    END\n                ");
            } else {
                DB::statement("\n                    UPDATE scholarships\n                    SET requirements = CASE\n                        WHEN requirements IS NULL OR btrim(requirements::text) = '' THEN '[]'\n                        WHEN left(btrim(requirements::text), 1) = '[' THEN requirements::text\n                        ELSE json_build_array(requirements)::text\n                    END\n                ");
                DB::statement('ALTER TABLE scholarships ALTER COLUMN requirements TYPE jsonb USING requirements::jsonb');
            }

            if (in_array($benefitsType, ['json', 'jsonb'], true)) {
                DB::statement("\n                    UPDATE scholarships\n                    SET benefits = CASE\n                        WHEN benefits IS NULL THEN '[]'::jsonb\n                        WHEN jsonb_typeof(benefits::jsonb) = 'array' THEN benefits::jsonb\n                        WHEN jsonb_typeof(benefits::jsonb) = 'string' THEN jsonb_build_array(regexp_replace(benefits::text, '^\"|\"$', '', 'g'))\n                        ELSE '[]'::jsonb\n                    END\n                ");
            } else {
                DB::statement("\n                    UPDATE scholarships\n                    SET benefits = CASE\n                        WHEN benefits IS NULL OR btrim(benefits::text) = '' THEN '[]'\n                        WHEN left(btrim(benefits::text), 1) = '[' THEN benefits::text\n                        ELSE json_build_array(benefits)::text\n                    END\n                ");
                DB::statement('ALTER TABLE scholarships ALTER COLUMN benefits TYPE jsonb USING benefits::jsonb');
            }

            DB::statement("ALTER TABLE scholarships ALTER COLUMN target_level SET DEFAULT 'sma'");
            DB::statement("ALTER TABLE scholarships ALTER COLUMN degree_level SET DEFAULT 's1'");
            DB::statement('ALTER TABLE scholarships ALTER COLUMN target_level SET NOT NULL');
            DB::statement('ALTER TABLE scholarships ALTER COLUMN degree_level SET NOT NULL');
        }

        Schema::table('scholarships', function (Blueprint $table) {
            if (Schema::hasColumn('scholarships', 'maximum_gpa')) {
                $table->dropColumn('maximum_gpa');
            }

            if (Schema::hasColumn('scholarships', 'eligible_degree_levels')) {
                $table->dropColumn('eligible_degree_levels');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scholarships', function (Blueprint $table) {
            if (!Schema::hasColumn('scholarships', 'maximum_gpa')) {
                $table->decimal('maximum_gpa', 3, 2)->nullable()->after('minimum_gpa');
            }

            if (!Schema::hasColumn('scholarships', 'eligible_degree_levels')) {
                $table->json('eligible_degree_levels')->nullable()->after('level');
            }
        });

        Schema::table('scholarships', function (Blueprint $table) {
            if (Schema::hasColumn('scholarships', 'target_level')) {
                $table->dropColumn('target_level');
            }

            if (Schema::hasColumn('scholarships', 'degree_level')) {
                $table->dropColumn('degree_level');
            }
        });
    }
};
