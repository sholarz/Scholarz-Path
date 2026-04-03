<?php

namespace Database\Seeders;

use App\Models\LookupCountry;
use App\Models\LookupFieldOfStudy;
use Illuminate\Database\Seeder;

class LookupSeeder extends Seeder
{
    public function run(): void
    {
        // Countries populer tujuan beasiswa Indonesia
        $countries = [
    ['name' => 'Indonesia',      'code' => 'IDN', 'flag_emoji' => '🇮🇩', 'is_popular' => true],  // ← tambah
    ['name' => 'Malaysia',       'code' => 'MYS', 'flag_emoji' => '🇲🇾', 'is_popular' => true],  // ← tambah
    ['name' => 'Australia',      'code' => 'AUS', 'flag_emoji' => '🇦🇺', 'is_popular' => true],
    ['name' => 'United Kingdom', 'code' => 'GBR', 'flag_emoji' => '🇬🇧', 'is_popular' => true],
    ['name' => 'United States',  'code' => 'USA', 'flag_emoji' => '🇺🇸', 'is_popular' => true],
    ['name' => 'Japan',          'code' => 'JPN', 'flag_emoji' => '🇯🇵', 'is_popular' => true],
    ['name' => 'South Korea',    'code' => 'KOR', 'flag_emoji' => '🇰🇷', 'is_popular' => true],
    ['name' => 'Netherlands',    'code' => 'NLD', 'flag_emoji' => '🇳🇱', 'is_popular' => true],
    ['name' => 'Germany',        'code' => 'DEU', 'flag_emoji' => '🇩🇪', 'is_popular' => true],
    ['name' => 'Canada',         'code' => 'CAN', 'flag_emoji' => '🇨🇦', 'is_popular' => true],
    ['name' => 'Singapore',      'code' => 'SGP', 'flag_emoji' => '🇸🇬', 'is_popular' => true],
    ['name' => 'New Zealand',    'code' => 'NZL', 'flag_emoji' => '🇳🇿', 'is_popular' => false],
    ['name' => 'France',         'code' => 'FRA', 'flag_emoji' => '🇫🇷', 'is_popular' => false],
    ['name' => 'China',          'code' => 'CHN', 'flag_emoji' => '🇨🇳', 'is_popular' => false],
];

        foreach ($countries as $country) {
            LookupCountry::firstOrCreate(
                ['code' => $country['code']],
                array_merge($country, ['is_active' => true])
            );
        }

        // Fields of study
        $fields = [
    ['name' => 'Computer Science',    'category' => 'Technology',   'is_popular' => true],
    ['name' => 'Engineering',         'category' => 'Technology',   'is_popular' => true],  // ← tambah
    ['name' => 'Business',            'category' => 'Business',     'is_popular' => true],  // ← tambah
    ['name' => 'Medicine',            'category' => 'Science',      'is_popular' => true],
    ['name' => 'Law',                 'category' => 'Social',       'is_popular' => true],  // ← pindah jadi popular
    ['name' => 'Education',           'category' => 'Social',       'is_popular' => true],
    ['name' => 'Arts & Humanities',   'category' => 'Arts',         'is_popular' => true],  // ← tambah
    ['name' => 'Natural Sciences',    'category' => 'Science',      'is_popular' => true],  // ← tambah
    ['name' => 'Social Sciences',     'category' => 'Social',       'is_popular' => true],  // ← tambah
    ['name' => 'Information Technology', 'category' => 'Technology','is_popular' => false],
    ['name' => 'Artificial Intelligence','category' => 'Technology','is_popular' => false],
    ['name' => 'Data Science',        'category' => 'Technology',   'is_popular' => false],
    ['name' => 'Business Administration','category' => 'Business',  'is_popular' => false],
    ['name' => 'Economics',           'category' => 'Business',     'is_popular' => false],
    ['name' => 'Finance',             'category' => 'Business',     'is_popular' => false],
    ['name' => 'Public Health',       'category' => 'Science',      'is_popular' => false],
    ['name' => 'Environmental Science','category' => 'Science',     'is_popular' => false],
    ['name' => 'International Relations','category' => 'Social',    'is_popular' => false],
];

        foreach ($fields as $field) {
            LookupFieldOfStudy::firstOrCreate(
                ['name' => $field['name']],
                array_merge($field, ['is_active' => true])
            );
        }
    }
}