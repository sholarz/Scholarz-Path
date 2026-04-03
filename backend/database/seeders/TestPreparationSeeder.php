<?php

namespace Database\Seeders;

use App\Models\TestCategory;
use App\Models\TestQuestion;
use Illuminate\Database\Seeder;

class TestPreparationSeeder extends Seeder
{
    public function run(): void
    {
        // ── FREE TEST 1 — TOEFL ITP Reading ───────────────────────────────
        $toeflReading = TestCategory::firstOrCreate(
            ['slug' => 'toefl-itp-reading-comprehension'],
            [
                'name'                     => 'TOEFL ITP Reading Comprehension',
                'test_type'                => 'toefl',
                'category'                 => 'english',
                'section'                  => 'reading',
                'difficulty'               => 'intermediate',
                'description'              => 'Practice reading comprehension section similar to TOEFL ITP. Improve your reading speed and comprehension skills for Indonesian scholarship applications.',
                'time_limit_minutes'       => 30,
                'total_questions'          => 5,
                'passing_score_percentage' => 70,
                'access_level'             => 'free',
            ]
        );

        // ── FREE TEST 2 — English Grammar ─────────────────────────────────
        $grammar = TestCategory::firstOrCreate(
            ['slug' => 'english-grammar-vocabulary'],
            [
                'name'                     => 'English Grammar & Vocabulary',
                'test_type'                => 'general',
                'category'                 => 'english',
                'section'                  => 'vocabulary',
                'difficulty'               => 'beginner',
                'description'              => 'Master essential grammar rules and vocabulary commonly tested in Indonesian scholarship exams like LPDP and KNB.',
                'time_limit_minutes'       => 20,
                'total_questions'          => 3,
                'passing_score_percentage' => 75,
                'access_level'             => 'free',
            ]
        );

        // ── PREMIUM TEST 1 — Mathematics ──────────────────────────────────
        $math = TestCategory::firstOrCreate(
            ['slug' => 'mathematics-scholarship-tests'],
            [
                'name'                     => 'Mathematics for Scholarship Tests',
                'test_type'                => 'general',
                'category'                 => 'math',
                'section'                  => 'general',
                'difficulty'               => 'intermediate',
                'description'              => 'Quantitative reasoning and mathematics problems commonly found in Indonesian graduate school entrance exams.',
                'time_limit_minutes'       => 45,
                'total_questions'          => 2,
                'passing_score_percentage' => 70,
                'access_level'             => 'premium',
            ]
        );

        // ── PREMIUM TEST 2 — Logical Reasoning ────────────────────────────
        $logic = TestCategory::firstOrCreate(
            ['slug' => 'logical-reasoning-critical-thinking'],
            [
                'name'                     => 'Logical Reasoning & Critical Thinking',
                'test_type'                => 'general',
                'category'                 => 'logical-reasoning',
                'section'                  => 'general',
                'difficulty'               => 'advanced',
                'description'              => 'Develop your analytical skills with logic puzzles and critical thinking questions required for competitive scholarships.',
                'time_limit_minutes'       => 40,
                'total_questions'          => 1,
                'passing_score_percentage' => 80,
                'access_level'             => 'premium',
            ]
        );

        // ── PREMIUM TEST 3 — General Knowledge ────────────────────────────
        $gk = TestCategory::firstOrCreate(
            ['slug' => 'indonesian-culture-general-knowledge'],
            [
                'name'                     => 'Indonesian Culture & General Knowledge',
                'test_type'                => 'general',
                'category'                 => 'general-knowledge',
                'section'                  => 'general',
                'difficulty'               => 'intermediate',
                'description'              => 'Test your knowledge about Indonesian history, culture, and current affairs - essential for scholarship interviews.',
                'time_limit_minutes'       => 25,
                'total_questions'          => 2,
                'passing_score_percentage' => 75,
                'access_level'             => 'premium',
            ]
        );

        // ── PREMIUM TEST 4 — Bahasa Indonesia ─────────────────────────────
        TestCategory::firstOrCreate(
            ['slug' => 'bahasa-indonesia-proficiency'],
            [
                'name'                     => 'Bahasa Indonesia Proficiency',
                'test_type'                => 'general',
                'category'                 => 'indonesian',
                'section'                  => 'general',
                'difficulty'               => 'beginner',
                'description'              => 'For international students: Test your Indonesian language skills required for studying in Indonesia.',
                'time_limit_minutes'       => 30,
                'total_questions'          => 1,
                'passing_score_percentage' => 70,
                'access_level'             => 'premium',
            ]
        );

        // ── SOAL TOEFL ITP Reading (5 soal) ───────────────────────────────
        $soalToefl = [
            [
                'order_index'    => 1,
                'passage'        => 'The Javanese culture is one of the oldest and richest cultures in Indonesia. Known for its intricate batik patterns, gamelan music, and wayang kulit shadow puppets, Javanese culture has influenced many aspects of Indonesian identity. The island of Java has been the center of powerful kingdoms throughout history, including Majapahit and Mataram. Today, Java remains the political and economic heart of Indonesia.',
                'question_text'  => 'What is the main idea of this passage?',
                'option_a'       => 'Java is the most populous island in Indonesia',
                'option_b'       => 'Javanese culture has significantly influenced Indonesian identity',
                'option_c'       => 'Batik patterns are unique to Java',
                'option_d'       => 'Java has many historical kingdoms',
                'correct_answer' => 'b',
                'explanation'    => 'The passage emphasizes how Javanese culture has influenced Indonesian identity, with examples like batik, gamelan, and wayang kulit.',
                'points'         => 5,
            ],
            [
                'order_index'    => 2,
                'passage'        => null,
                'question_text'  => 'According to the passage, which of the following is NOT mentioned as part of Javanese culture?',
                'option_a'       => 'Batik patterns',
                'option_b'       => 'Gamelan music',
                'option_c'       => 'Traditional dance',
                'option_d'       => 'Wayang kulit',
                'correct_answer' => 'c',
                'explanation'    => 'Traditional dance is not specifically mentioned in the passage, though batik, gamelan, and wayang kulit are all mentioned.',
                'points'         => 5,
            ],
            [
                'order_index'    => 3,
                'passage'        => "Indonesia's education system has undergone significant reforms in recent decades. The government has implemented a 12-year compulsory education program and increased funding for higher education. Many Indonesian universities now rank among the top institutions in Southeast Asia. The push for international collaboration has led to numerous scholarship programs, particularly for students from Java.",
                'question_text'  => 'What can be inferred from this passage?',
                'option_a'       => 'Education in Indonesia was poor before reforms',
                'option_b'       => 'The government prioritizes education development',
                'option_c'       => 'All Indonesian students receive scholarships',
                'option_d'       => 'Java has the best universities in Asia',
                'correct_answer' => 'b',
                'explanation'    => 'The passage shows government commitment through increased funding and implementation of compulsory education.',
                'points'         => 5,
            ],
            [
                'order_index'    => 4,
                'passage'        => null,
                'question_text'  => 'The passage suggests that international collaboration has resulted in:',
                'option_a'       => 'Better teaching methods',
                'option_b'       => 'More scholarship opportunities',
                'option_c'       => 'Higher tuition fees',
                'option_d'       => 'Reduced enrollment',
                'correct_answer' => 'b',
                'explanation'    => 'The passage explicitly states that international collaboration has led to numerous scholarship programs.',
                'points'         => 5,
            ],
            [
                'order_index'    => 5,
                'passage'        => 'Indonesian universities are increasingly recognized globally for their research contributions, particularly in fields such as agriculture, marine biology, and sustainable energy. Many institutions in Java have established research partnerships with universities worldwide. This international exposure has enhanced the quality of education and created more opportunities for Indonesian students to study abroad.',
                'question_text'  => 'The word "enhanced" in the passage is closest in meaning to:',
                'option_a'       => 'Reduced',
                'option_b'       => 'Improved',
                'option_c'       => 'Changed',
                'option_d'       => 'Maintained',
                'correct_answer' => 'b',
                'explanation'    => '"Enhanced" means to improve or make better, which is the context used in the passage.',
                'points'         => 5,
            ],
        ];

        foreach ($soalToefl as $q) {
            TestQuestion::firstOrCreate(
                ['category_id' => $toeflReading->id, 'order_index' => $q['order_index']],
                $q
            );
        }

        // ── SOAL English Grammar (3 soal) ─────────────────────────────────
        $soalGrammar = [
            [
                'order_index'    => 1,
                'passage'        => null,
                'question_text'  => 'The scholarship application deadline _____ extended until next month.',
                'option_a'       => 'has been',
                'option_b'       => 'have been',
                'option_c'       => 'was been',
                'option_d'       => 'were been',
                'correct_answer' => 'a',
                'explanation'    => '"Has been" is correct because "deadline" is singular and we need present perfect passive voice.',
                'points'         => 10,
            ],
            [
                'order_index'    => 2,
                'passage'        => null,
                'question_text'  => 'Choose the word that best completes the sentence: The university offers a _____ range of scholarship programs.',
                'option_a'       => 'comprehensive',
                'option_b'       => 'comprehend',
                'option_c'       => 'comprehension',
                'option_d'       => 'comprehensively',
                'correct_answer' => 'a',
                'explanation'    => '"Comprehensive" is the adjective form that correctly modifies "range".',
                'points'         => 10,
            ],
            [
                'order_index'    => 3,
                'passage'        => null,
                'question_text'  => 'If I _____ about the scholarship earlier, I would have applied.',
                'option_a'       => 'know',
                'option_b'       => 'knew',
                'option_c'       => 'had known',
                'option_d'       => 'have known',
                'correct_answer' => 'c',
                'explanation'    => 'Past perfect "had known" is used in third conditional sentences about past unreal situations.',
                'points'         => 10,
            ],
        ];

        foreach ($soalGrammar as $q) {
            TestQuestion::firstOrCreate(
                ['category_id' => $grammar->id, 'order_index' => $q['order_index']],
                $q
            );
        }

        // ── SOAL Mathematics (2 soal) ──────────────────────────────────────
        $soalMath = [
            [
                'order_index'    => 1,
                'passage'        => null,
                'question_text'  => 'If x + 5 = 12, what is the value of 2x + 3?',
                'option_a'       => '17',
                'option_b'       => '19',
                'option_c'       => '21',
                'option_d'       => '23',
                'correct_answer' => 'a',
                'explanation'    => 'First solve for x: x = 7. Then calculate 2(7) + 3 = 14 + 3 = 17.',
                'points'         => 5,
            ],
            [
                'order_index'    => 2,
                'passage'        => null,
                'question_text'  => 'A scholarship fund has IDR 150,000,000 to distribute among students in the ratio 2:3:5. How much does the student with the largest share receive?',
                'option_a'       => 'IDR 30,000,000',
                'option_b'       => 'IDR 45,000,000',
                'option_c'       => 'IDR 60,000,000',
                'option_d'       => 'IDR 75,000,000',
                'correct_answer' => 'd',
                'explanation'    => 'Total ratio parts: 2+3+5 = 10. Largest share (5/10) × 150,000,000 = 75,000,000.',
                'points'         => 5,
            ],
        ];

        foreach ($soalMath as $q) {
            TestQuestion::firstOrCreate(
                ['category_id' => $math->id, 'order_index' => $q['order_index']],
                $q
            );
        }

        // ── SOAL Logical Reasoning (1 soal) ───────────────────────────────
        TestQuestion::firstOrCreate(
            ['category_id' => $logic->id, 'order_index' => 1],
            [
                'passage'        => null,
                'question_text'  => 'All scholarship recipients are hardworking students. Some hardworking students are from Java. Therefore:',
                'option_a'       => 'All scholarship recipients are from Java',
                'option_b'       => 'Some scholarship recipients may be from Java',
                'option_c'       => 'No scholarship recipients are from Java',
                'option_d'       => 'All students from Java receive scholarships',
                'correct_answer' => 'b',
                'explanation'    => 'This is a valid logical conclusion - some scholarship recipients may be from the group of hardworking students from Java.',
                'points'         => 4,
            ]
        );

        // ── SOAL General Knowledge (2 soal) ───────────────────────────────
        $soalGK = [
            [
                'order_index'    => 1,
                'passage'        => null,
                'question_text'  => 'Which of the following cities is NOT located in Java?',
                'option_a'       => 'Bandung',
                'option_b'       => 'Surabaya',
                'option_c'       => 'Medan',
                'option_d'       => 'Yogyakarta',
                'correct_answer' => 'c',
                'explanation'    => 'Medan is located in North Sumatra, while the other cities are all in Java.',
                'points'         => 6,
            ],
            [
                'order_index'    => 2,
                'passage'        => null,
                'question_text'  => 'The LPDP scholarship program is funded by:',
                'option_a'       => 'Ministry of Education',
                'option_b'       => 'Ministry of Finance',
                'option_c'       => 'Private donors',
                'option_d'       => 'World Bank',
                'correct_answer' => 'b',
                'explanation'    => 'LPDP (Indonesia Endowment Fund for Education) is managed by the Ministry of Finance.',
                'points'         => 6,
            ],
        ];

        foreach ($soalGK as $q) {
            TestQuestion::firstOrCreate(
                ['category_id' => $gk->id, 'order_index' => $q['order_index']],
                $q
            );
        }
    }
}