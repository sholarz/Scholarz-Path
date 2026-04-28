export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "free" | "premium" | "admin";
  gpa?: number;
  field?: string;
  country?: string;
  language?: string;
  matchCount: number;
}

export interface Scholarship {
  id: string;
  title: string;
  description: string;
  deadline: string;
  eligibility: string;
  country: string;
  field: string;
  link?: string;
  imageUrl?: string;
  benefits?: string;
  selectionProcess?: string;
}

export interface RoadmapStep {
  title: string;
  date: string;
  description: string;
  completed: boolean;
}

export interface Roadmap {
  id: string;
  userId: string;
  scholarshipId: string;
  steps: RoadmapStep[];
}

export interface SmartMatchItem {
  scholarshipId: string;
  score: number;
  reason: string;
}

export interface SmartMatchProfileSnapshot {
  displayName?: string;
  gpa?: number | null;
  field?: string;
  country?: string;
  language?: string;
  institution?: string;
  targetDegree?: string;
  englishScore?: string;
  experience?: string;
  achievements?: string;
}

export interface SmartMatchDocument {
  userId: string;
  recommendations: SmartMatchItem[];
  profileSnapshot: SmartMatchProfileSnapshot;
  generatedAt?: unknown;
  updatedAt?: unknown;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  category?: string;
  createdAt: string;
  role?: string;
  likes?: string[];
  commentsCount?: number;
  editedAt?: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  proofUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
