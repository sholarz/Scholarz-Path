// Mock test simulation data for scholarship preparation
export type QuestionType = 'multiple-choice' | 'true-false' | 'essay';
export type TestCategory = 'english' | 'math' | 'logical-reasoning' | 'general-knowledge' | 'indonesian';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

export interface TestSimulation {
  id: string;
  title: string;
  category: TestCategory;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  questions: Question[];
  relatedScholarships: string[];
}

export const testSimulations: TestSimulation[] = [
  {
    id: 'test-1',
    title: 'TOEFL ITP Reading Comprehension',
    category: 'english',
    description: 'Practice reading comprehension section similar to TOEFL ITP. Improve your reading speed and comprehension skills for Indonesian scholarship applications.',
    duration: 30,
    totalQuestions: 15,
    passingScore: 70,
    difficulty: 'intermediate',
    isPremium: false,
    relatedScholarships: ['1', '2', '3', '4', '5'],
    questions: [
      {
        id: 'q1',
        question: 'The Javanese culture is one of the oldest and richest cultures in Indonesia. Known for its intricate batik patterns, gamelan music, and wayang kulit shadow puppets, Javanese culture has influenced many aspects of Indonesian identity. The island of Java has been the center of powerful kingdoms throughout history, including Majapahit and Mataram. Today, Java remains the political and economic heart of Indonesia.\n\nWhat is the main idea of this passage?',
        type: 'multiple-choice',
        options: [
          'Java is the most populous island in Indonesia',
          'Javanese culture has significantly influenced Indonesian identity',
          'Batik patterns are unique to Java',
          'Java has many historical kingdoms'
        ],
        correctAnswer: 1,
        explanation: 'The passage emphasizes how Javanese culture has influenced Indonesian identity, with examples like batik, gamelan, and wayang kulit.',
        points: 5,
      },
      {
        id: 'q2',
        question: 'According to the passage, which of the following is NOT mentioned as part of Javanese culture?',
        type: 'multiple-choice',
        options: [
          'Batik patterns',
          'Gamelan music',
          'Traditional dance',
          'Wayang kulit'
        ],
        correctAnswer: 2,
        explanation: 'Traditional dance is not specifically mentioned in the passage, though batik, gamelan, and wayang kulit are all mentioned.',
        points: 5,
      },
      {
        id: 'q3',
        question: 'Indonesia\'s education system has undergone significant reforms in recent decades. The government has implemented a 12-year compulsory education program and increased funding for higher education. Many Indonesian universities now rank among the top institutions in Southeast Asia. The push for international collaboration has led to numerous scholarship programs, particularly for students from Java.\n\nWhat can be inferred from this passage?',
        type: 'multiple-choice',
        options: [
          'Education in Indonesia was poor before reforms',
          'The government prioritizes education development',
          'All Indonesian students receive scholarships',
          'Java has the best universities in Asia'
        ],
        correctAnswer: 1,
        explanation: 'The passage shows government commitment through increased funding and implementation of compulsory education.',
        points: 5,
      },
      {
        id: 'q4',
        question: 'The passage suggests that international collaboration has resulted in:',
        type: 'multiple-choice',
        options: [
          'Better teaching methods',
          'More scholarship opportunities',
          'Higher tuition fees',
          'Reduced enrollment'
        ],
        correctAnswer: 1,
        explanation: 'The passage explicitly states that international collaboration has led to numerous scholarship programs.',
        points: 5,
      },
      {
        id: 'q5',
        question: 'Indonesian universities are increasingly recognized globally for their research contributions, particularly in fields such as agriculture, marine biology, and sustainable energy. Many institutions in Java have established research partnerships with universities worldwide. This international exposure has enhanced the quality of education and created more opportunities for Indonesian students to study abroad.\n\nThe word "enhanced" in the passage is closest in meaning to:',
        type: 'multiple-choice',
        options: [
          'Reduced',
          'Improved',
          'Changed',
          'Maintained'
        ],
        correctAnswer: 1,
        explanation: '"Enhanced" means to improve or make better, which is the context used in the passage.',
        points: 5,
      },
    ],
  },
  {
    id: 'test-2',
    title: 'English Grammar & Vocabulary',
    category: 'english',
    description: 'Master essential grammar rules and vocabulary commonly tested in Indonesian scholarship exams like LPDP and KNB.',
    duration: 20,
    totalQuestions: 10,
    passingScore: 75,
    difficulty: 'beginner',
    isPremium: false,
    relatedScholarships: ['1', '5', '7'],
    questions: [
      {
        id: 'q1',
        question: 'The scholarship application deadline _____ extended until next month.',
        type: 'multiple-choice',
        options: [
          'has been',
          'have been',
          'was been',
          'were been'
        ],
        correctAnswer: 0,
        explanation: '"Has been" is correct because "deadline" is singular and we need present perfect passive voice.',
        points: 10,
      },
      {
        id: 'q2',
        question: 'Choose the word that best completes the sentence: The university offers a _____ range of scholarship programs.',
        type: 'multiple-choice',
        options: [
          'comprehensive',
          'comprehend',
          'comprehension',
          'comprehensively'
        ],
        correctAnswer: 0,
        explanation: '"Comprehensive" is the adjective form that correctly modifies "range".',
        points: 10,
      },
      {
        id: 'q3',
        question: 'If I _____ about the scholarship earlier, I would have applied.',
        type: 'multiple-choice',
        options: [
          'know',
          'knew',
          'had known',
          'have known'
        ],
        correctAnswer: 2,
        explanation: 'Past perfect "had known" is used in third conditional sentences about past unreal situations.',
        points: 10,
      },
    ],
  },
  {
    id: 'test-3',
    title: 'Mathematics for Scholarship Tests',
    category: 'math',
    description: 'Quantitative reasoning and mathematics problems commonly found in Indonesian graduate school entrance exams.',
    duration: 45,
    totalQuestions: 20,
    passingScore: 70,
    difficulty: 'intermediate',
    isPremium: true,
    relatedScholarships: ['3', '4', '8', '9'],
    questions: [
      {
        id: 'q1',
        question: 'If x + 5 = 12, what is the value of 2x + 3?',
        type: 'multiple-choice',
        options: [
          '17',
          '19',
          '21',
          '23'
        ],
        correctAnswer: 0,
        explanation: 'First solve for x: x = 7. Then calculate 2(7) + 3 = 14 + 3 = 17.',
        points: 5,
      },
      {
        id: 'q2',
        question: 'A scholarship fund has IDR 150,000,000 to distribute among students in the ratio 2:3:5. How much does the student with the largest share receive?',
        type: 'multiple-choice',
        options: [
          'IDR 30,000,000',
          'IDR 45,000,000',
          'IDR 60,000,000',
          'IDR 75,000,000'
        ],
        correctAnswer: 3,
        explanation: 'Total ratio parts: 2+3+5 = 10. Largest share (5/10) × 150,000,000 = 75,000,000.',
        points: 5,
      },
    ],
  },
  {
    id: 'test-4',
    title: 'Logical Reasoning & Critical Thinking',
    category: 'logical-reasoning',
    description: 'Develop your analytical skills with logic puzzles and critical thinking questions required for competitive scholarships.',
    duration: 40,
    totalQuestions: 25,
    passingScore: 80,
    difficulty: 'advanced',
    isPremium: true,
    relatedScholarships: ['1', '3', '5', '12'],
    questions: [
      {
        id: 'q1',
        question: 'All scholarship recipients are hardworking students. Some hardworking students are from Java. Therefore:',
        type: 'multiple-choice',
        options: [
          'All scholarship recipients are from Java',
          'Some scholarship recipients may be from Java',
          'No scholarship recipients are from Java',
          'All students from Java receive scholarships'
        ],
        correctAnswer: 1,
        explanation: 'This is a valid logical conclusion - some scholarship recipients may be from the group of hardworking students from Java.',
        points: 4,
      },
    ],
  },
  {
    id: 'test-5',
    title: 'Indonesian Culture & General Knowledge',
    category: 'general-knowledge',
    description: 'Test your knowledge about Indonesian history, culture, and current affairs - essential for scholarship interviews.',
    duration: 25,
    totalQuestions: 15,
    passingScore: 75,
    difficulty: 'intermediate',
    isPremium: true,
    relatedScholarships: ['1', '2', '5', '6', '11'],
    questions: [
      {
        id: 'q1',
        question: 'Which of the following cities is NOT located in Java?',
        type: 'multiple-choice',
        options: [
          'Bandung',
          'Surabaya',
          'Medan',
          'Yogyakarta'
        ],
        correctAnswer: 2,
        explanation: 'Medan is located in North Sumatra, while the other cities are all in Java.',
        points: 6,
      },
      {
        id: 'q2',
        question: 'The LPDP scholarship program is funded by:',
        type: 'multiple-choice',
        options: [
          'Ministry of Education',
          'Ministry of Finance',
          'Private donors',
          'World Bank'
        ],
        correctAnswer: 1,
        explanation: 'LPDP (Indonesia Endowment Fund for Education) is managed by the Ministry of Finance.',
        points: 6,
      },
    ],
  },
  {
    id: 'test-6',
    title: 'Bahasa Indonesia Proficiency',
    category: 'indonesian',
    description: 'For international students: Test your Indonesian language skills required for studying in Indonesia.',
    duration: 30,
    totalQuestions: 12,
    passingScore: 70,
    difficulty: 'beginner',
    isPremium: true,
    relatedScholarships: ['1', '2', '3', '7', '11'],
    questions: [
      {
        id: 'q1',
        question: 'What does "beasiswa" mean in English?',
        type: 'multiple-choice',
        options: [
          'Scholarship',
          'University',
          'Student',
          'Education'
        ],
        correctAnswer: 0,
        explanation: '"Beasiswa" is the Indonesian word for scholarship.',
        points: 8,
      },
    ],
  },
];

// Helper functions
export function getTestById(id: string): TestSimulation | undefined {
  return testSimulations.find(t => t.id === id);
}

export function getTestsByCategory(category: TestCategory): TestSimulation[] {
  return testSimulations.filter(t => t.category === category);
}

export function getFreeTests(): TestSimulation[] {
  return testSimulations.filter(t => !t.isPremium);
}

export function getPremiumTests(): TestSimulation[] {
  return testSimulations.filter(t => t.isPremium);
}

export function calculateScore(answers: Record<string, any>, test: TestSimulation): {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
} {
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  test.questions.forEach(question => {
    totalPoints += question.points;
    const userAnswer = answers[question.id];
    
    if (userAnswer === question.correctAnswer || 
        (typeof userAnswer === 'string' && userAnswer === String(question.correctAnswer))) {
      correctAnswers++;
      earnedPoints += question.points;
    }
  });

  const score = Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= test.passingScore;

  return {
    score,
    correctAnswers,
    totalQuestions: test.questions.length,
    passed,
  };
}
