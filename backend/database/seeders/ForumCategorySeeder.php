<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ForumCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Tips & Experience',
                'slug'        => 'tips-experience',
                'description' => 'Share scholarship tips and personal experiences',
                'sort_order'  => 1,
            ],
            [
                'name'        => 'Announcements',
                'slug'        => 'announcements',
                'description' => 'Official updates and announcements',
                'sort_order'  => 2,
            ],
            [
                'name'        => 'Q&A',
                'slug'        => 'qa',
                'description' => 'Questions and answers from the community',
                'sort_order'  => 3,
            ],
            [
                'name'        => 'General Discussion',
                'slug'        => 'general-discussion',
                'description' => 'General community discussion',
                'sort_order'  => 4,
            ],
            [
                'name'        => 'Test Preparation',
                'slug'        => 'test-preparation',
                'description' => 'IELTS, TOEFL, and other test prep discussions',
                'sort_order'  => 5,
            ],
            [
                'name'        => 'Documents',
                'slug'        => 'documents',
                'description' => 'Motivation letters, CVs, and other scholarship documents',
                'sort_order'  => 6,
            ],
        ];

        foreach ($categories as $category) {
            DB::table('forum_categories')->updateOrInsert(
                ['slug' => $category['slug']],
                [
                    'id'          => Str::uuid()->toString(),
                    'name'        => $category['name'],
                    'slug'        => $category['slug'],
                    'description' => $category['description'],
                    'sort_order'  => $category['sort_order'],
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }

        $this->command->info('Forum categories seeded: ' . count($categories) . ' categories.');
    }
}