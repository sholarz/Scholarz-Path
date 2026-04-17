<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TestPreparationSeeder::class,
            LookupSeeder::class,
            AdminUserSeeder::class,
            AdminDemoSeeder::class,
            IndonesianScholarshipSeeder::class,
            ForumCategorySeeder::class,   // ← tambahan: seeder kategori forum
        ]);
    }
}