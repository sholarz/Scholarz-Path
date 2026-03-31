// Mock scholarship data focused on opportunities to Java/Indonesia
export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  country: string;
  location: string;
  amount: string;
  deadline: Date;
  educationLevel: string;
  fieldOfStudy: string[];
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applicationUrl: string;
  verified: boolean;
}

export const scholarships: Scholarship[] = [
  {
    id: "1",
    title: "Indonesian Government Scholarship (KNB)",
    provider: "Ministry of Education and Culture, Indonesia",
    country: "Indonesia",
    location: "Various Universities in Java",
    amount: "Full Tuition + Living Allowance",
    deadline: new Date('2026-03-31'),
    educationLevel: "Master's",
    fieldOfStudy: ["Engineering", "Social Sciences", "Natural Sciences", "Economics"],
    type: "Government",
    description: "The Kemitraan Negara Berkembang (KNB) scholarship program is offered by the Indonesian government to students from developing countries to pursue master's and doctoral degrees at leading Indonesian universities.",
    requirements: [
      "Bachelor's degree with min. GPA 2.75",
      "TOEFL iBT 61 or IELTS 6.0",
      "Recommendation letters (2)",
      "Health certificate",
      "Statement of purpose"
    ],
    benefits: [
      "Full tuition coverage",
      "Monthly living allowance (IDR 2,500,000)",
      "Accommodation support",
      "Health insurance",
      "Settlement allowance"
    ],
    applicationUrl: "https://www.knb.kemdikbud.go.id",
    verified: true
  },
  {
    id: "2",
    title: "University of Indonesia International Scholarship",
    provider: "University of Indonesia",
    country: "Indonesia",
    location: "Depok, West Java",
    amount: "Up to $15,000/year",
    deadline: new Date('2026-04-15'),
    educationLevel: "Undergraduate",
    fieldOfStudy: ["Computer Science", "Business", "Medicine", "Engineering", "Social Sciences"],
    type: "University",
    description: "Merit-based scholarship for international students pursuing undergraduate studies at the University of Indonesia, one of the top-ranked universities in Southeast Asia.",
    requirements: [
      "High school diploma with excellent grades",
      "TOEFL iBT 80 or IELTS 6.5",
      "Personal statement",
      "Academic transcripts",
      "Reference letters (2)"
    ],
    benefits: [
      "Tuition fee waiver (partial/full)",
      "Monthly stipend",
      "Accommodation assistance",
      "Indonesian language course"
    ],
    applicationUrl: "https://www.ui.ac.id",
    verified: true
  },
  {
    id: "3",
    title: "Gadjah Mada University (UGM) Scholarship",
    provider: "Universitas Gadjah Mada",
    country: "Indonesia",
    location: "Yogyakarta, Java",
    amount: "Full Tuition + IDR 2,000,000/month",
    deadline: new Date('2026-03-20'),
    educationLevel: "Master's",
    fieldOfStudy: ["Engineering", "Agriculture", "Medicine", "Economics", "Law"],
    type: "University",
    description: "UGM offers scholarships for outstanding international students to pursue graduate studies at one of Indonesia's most prestigious universities.",
    requirements: [
      "Bachelor's degree with min. GPA 3.0",
      "TOEFL iBT 70 or IELTS 6.0",
      "Research proposal",
      "Academic CV",
      "Recommendation letters (2)"
    ],
    benefits: [
      "Full tuition waiver",
      "Monthly living allowance",
      "Research fund",
      "Conference attendance support"
    ],
    applicationUrl: "https://www.ugm.ac.id",
    verified: true
  },
  {
    id: "4",
    title: "Institut Teknologi Bandung (ITB) International Scholarship",
    provider: "Institut Teknologi Bandung",
    country: "Indonesia",
    location: "Bandung, West Java",
    amount: "Full Tuition",
    deadline: new Date('2026-04-30'),
    educationLevel: "Undergraduate",
    fieldOfStudy: ["Engineering", "Computer Science", "Architecture", "Design", "Science"],
    type: "University",
    description: "ITB's premier technical university offers scholarships for talented international students in engineering and technology fields.",
    requirements: [
      "High school diploma with strong STEM background",
      "TOEFL iBT 75 or IELTS 6.0",
      "Entrance exam or SAT scores",
      "Portfolio (for design/architecture)",
      "Personal statement"
    ],
    benefits: [
      "Full tuition coverage",
      "Partial living expenses",
      "Accommodation support",
      "Academic mentorship"
    ],
    applicationUrl: "https://www.itb.ac.id",
    verified: true
  },
  {
    id: "5",
    title: "LPDP Scholarship (Indonesia Endowment Fund)",
    provider: "LPDP - Ministry of Finance, Indonesia",
    country: "Indonesia",
    location: "Top Universities in Indonesia",
    amount: "Full Tuition + Living Expenses",
    deadline: new Date('2026-05-15'),
    educationLevel: "Master's & PhD",
    fieldOfStudy: ["All Fields"],
    type: "Government",
    description: "LPDP provides comprehensive scholarships for Indonesian and international students to pursue graduate studies in Indonesia or abroad, with focus on national development priorities.",
    requirements: [
      "Bachelor's degree with min. GPA 3.0",
      "TOEFL iBT 80 or IELTS 6.5",
      "Commitment letter to return to Indonesia",
      "Research proposal (for PhD)",
      "Leadership experience"
    ],
    benefits: [
      "Full tuition fees",
      "Living allowance",
      "Health insurance",
      "Book allowance",
      "Research grant",
      "Conference support"
    ],
    applicationUrl: "https://www.lpdp.kemenkeu.go.id",
    verified: true
  },
  {
    id: "6",
    title: "Bina Nusantara University (BINUS) Merit Scholarship",
    provider: "BINUS University",
    country: "Indonesia",
    location: "Jakarta, Java",
    amount: "25% - 75% Tuition Waiver",
    deadline: new Date('2026-06-01'),
    educationLevel: "Undergraduate",
    fieldOfStudy: ["Computer Science", "Business", "Design", "Engineering", "Communication"],
    type: "University",
    description: "Merit-based scholarship for high-achieving students to study at BINUS, a leading private university known for technology and business programs.",
    requirements: [
      "High school diploma with GPA 3.5+",
      "TOEFL iBT 61 or IELTS 5.5",
      "Application essay",
      "Academic achievements documentation",
      "Interview (shortlisted candidates)"
    ],
    benefits: [
      "Tuition fee reduction (25-75%)",
      "Academic excellence recognition",
      "Access to international programs",
      "Career development support"
    ],
    applicationUrl: "https://www.binus.ac.id",
    verified: true
  },
  {
    id: "7",
    title: "Airlangga University Excellence Scholarship",
    provider: "Universitas Airlangga",
    country: "Indonesia",
    location: "Surabaya, East Java",
    amount: "Full Tuition + IDR 1,500,000/month",
    deadline: new Date('2026-03-10'),
    educationLevel: "Master's",
    fieldOfStudy: ["Medicine", "Public Health", "Law", "Economics", "Social Sciences"],
    type: "University",
    description: "Competitive scholarship program for international graduate students at one of Indonesia's oldest and most reputable universities.",
    requirements: [
      "Bachelor's degree with min. GPA 3.25",
      "TOEFL iBT 70 or IELTS 6.0",
      "Academic transcripts",
      "Research proposal",
      "Recommendation letters (2)"
    ],
    benefits: [
      "Full tuition waiver",
      "Monthly stipend",
      "Research funding",
      "Indonesian language training"
    ],
    applicationUrl: "https://www.unair.ac.id",
    verified: true
  },
  {
    id: "8",
    title: "Diponegoro University International Program Scholarship",
    provider: "Universitas Diponegoro",
    country: "Indonesia",
    location: "Semarang, Central Java",
    amount: "50% Tuition Reduction",
    deadline: new Date('2026-04-20'),
    educationLevel: "Undergraduate",
    fieldOfStudy: ["Engineering", "Medicine", "Economics", "Science", "Fisheries"],
    type: "University",
    description: "Financial aid for international students joining UNDIP's international programs, combining quality education with affordable costs.",
    requirements: [
      "High school certificate with good grades",
      "TOEFL iBT 60 or IELTS 5.5",
      "Personal statement",
      "Academic records",
      "Passport copy"
    ],
    benefits: [
      "50% tuition discount",
      "Academic advising",
      "Cultural integration programs",
      "Campus accommodation options"
    ],
    applicationUrl: "https://www.undip.ac.id",
    verified: true
  },
  {
    id: "9",
    title: "Sebelas Maret University (UNS) Scholarship",
    provider: "Universitas Sebelas Maret",
    country: "Indonesia",
    location: "Surakarta (Solo), Central Java",
    amount: "Full Tuition",
    deadline: new Date('2026-05-01'),
    educationLevel: "Master's",
    fieldOfStudy: ["Agriculture", "Education", "Engineering", "Social Sciences"],
    type: "University",
    description: "Scholarship opportunity for graduate students at UNS, known for its strong agricultural and engineering programs.",
    requirements: [
      "Bachelor's degree with min. GPA 3.0",
      "TOEFL iBT 65 or IELTS 5.5",
      "Research proposal",
      "Academic CV",
      "Reference letters (2)"
    ],
    benefits: [
      "Full tuition coverage",
      "Library access",
      "Research facilities",
      "Academic mentorship"
    ],
    applicationUrl: "https://www.uns.ac.id",
    verified: true
  },
  {
    id: "10",
    title: "Telkom University Innovation Scholarship",
    provider: "Telkom University",
    country: "Indonesia",
    location: "Bandung, West Java",
    amount: "Up to $10,000",
    deadline: new Date('2026-06-15'),
    educationLevel: "Undergraduate",
    fieldOfStudy: ["Computer Science", "Information Technology", "Telecommunications", "Business"],
    type: "University",
    description: "Scholarship for students with strong innovation potential in technology and business fields at Indonesia's leading telecommunications university.",
    requirements: [
      "High school diploma with strong grades",
      "TOEFL iBT 60 or IELTS 5.5",
      "Innovation project or portfolio",
      "Personal statement",
      "Recommendation letter"
    ],
    benefits: [
      "Partial/full tuition waiver",
      "Innovation lab access",
      "Industry mentorship",
      "Startup incubation support"
    ],
    applicationUrl: "https://www.telkomuniversity.ac.id",
    verified: true
  },
  {
    id: "11",
    title: "Brawijaya University International Student Scholarship",
    provider: "Universitas Brawijaya",
    country: "Indonesia",
    location: "Malang, East Java",
    amount: "IDR 10,000,000 - 30,000,000/year",
    deadline: new Date('2026-03-25'),
    educationLevel: "Undergraduate & Master's",
    fieldOfStudy: ["Agriculture", "Engineering", "Medicine", "Economics", "Law"],
    type: "University",
    description: "Financial support for international students at UB, a comprehensive university with strong programs across multiple disciplines.",
    requirements: [
      "Academic certificate with good standing",
      "TOEFL iBT 60 or IELTS 5.5",
      "Statement of purpose",
      "Health certificate",
      "Financial guarantee letter"
    ],
    benefits: [
      "Tuition subsidy",
      "Partial living expenses",
      "Student visa assistance",
      "Cultural orientation program"
    ],
    applicationUrl: "https://www.ub.ac.id",
    verified: true
  },
  {
    id: "12",
    title: "Padjadjaran University (UNPAD) Merit Award",
    provider: "Universitas Padjadjaran",
    country: "Indonesia",
    location: "Bandung & Jatinangor, West Java",
    amount: "Full Tuition + Monthly Allowance",
    deadline: new Date('2026-04-10'),
    educationLevel: "Master's & PhD",
    fieldOfStudy: ["Medicine", "Dentistry", "Agriculture", "Communication", "Psychology"],
    type: "University",
    description: "Prestigious scholarship for graduate students at UNPAD, recognized for its medical and social science programs.",
    requirements: [
      "Bachelor's/Master's degree with min. GPA 3.25",
      "TOEFL iBT 75 or IELTS 6.0",
      "Research proposal",
      "Publication record (for PhD)",
      "Recommendation letters (2)"
    ],
    benefits: [
      "Full tuition waiver",
      "Monthly living stipend",
      "Research grant",
      "Conference funding",
      "Publication support"
    ],
    applicationUrl: "https://www.unpad.ac.id",
    verified: true
  }
];

// Helper function to get scholarship by ID
export function getScholarshipById(id: string): Scholarship | undefined {
  return scholarships.find(s => s.id === id);
}

// Helper function to filter scholarships
export function filterScholarships(
  query: string,
  educationLevel?: string,
  fieldOfStudy?: string,
  deadline?: Date
): Scholarship[] {
  return scholarships.filter(scholarship => {
    const matchesQuery = !query || 
      scholarship.title.toLowerCase().includes(query.toLowerCase()) ||
      scholarship.provider.toLowerCase().includes(query.toLowerCase()) ||
      scholarship.description.toLowerCase().includes(query.toLowerCase()) ||
      scholarship.location.toLowerCase().includes(query.toLowerCase());
    
    const matchesEducation = !educationLevel || 
      educationLevel === 'all' || 
      scholarship.educationLevel === educationLevel;
    
    const matchesField = !fieldOfStudy || 
      fieldOfStudy === 'all' || 
      scholarship.fieldOfStudy.includes(fieldOfStudy);
    
    const matchesDeadline = !deadline || scholarship.deadline <= deadline;
    
    return matchesQuery && matchesEducation && matchesField && matchesDeadline;
  });
}
