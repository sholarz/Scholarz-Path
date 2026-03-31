// src/api/scholarship.ts
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { scholarships as mockScholarships } from "../lib/scholarship-data";

// Utility function for simulating network delay in mock API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ PAKAI MOCK API (untuk development) ============
// Set ke false jika backend sudah siap
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_SCHOLARSHIP_API !== 'false';

const MOCK_BOOKMARKS_STORAGE_KEY = 'mock_bookmarks';

const loadMockBookmarks = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const raw = localStorage.getItem(MOCK_BOOKMARKS_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set(parsed.map(String));
  } catch {
    return new Set<string>();
  }
};

const persistMockBookmarks = (bookmarks: Set<string>) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(MOCK_BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
};

// Konfigurasi axios untuk real API
const API = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

// Add token to requests if exists
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ MOCK API FUNCTIONS ============
// GET /api/scholarships
const mockGetScholarships = async () => {
  await delay(800); // Simulate network delay
  return { data: mockScholarships };
};

// GET /api/scholarships/{id}
const mockGetScholarshipDetail = async (id: string) => {
  await delay(500);
  const scholarship = mockScholarships.find((s: any) => String(s.id) === String(id));
  if (!scholarship) {
    throw new Error('Scholarship not found');
  }
  return { data: scholarship };
};

// POST /api/auth/register
const mockRegister = async (data: { name: string; email: string; password: string }) => {
  await delay(1000);
  const token = "mock-token-" + Date.now();
  localStorage.setItem('token', token);
  const user = { id: 1, name: data.name, email: data.email, role: 'free' };
  localStorage.setItem('user', JSON.stringify(user));
  return { data: { token, user } };
};

// POST /api/auth/login
const mockLogin = async (data: { email: string; password: string }) => {
  await delay(800);
  const token = "mock-token-" + Date.now();
  localStorage.setItem('token', token);
  const user = { id: 1, name: "Test User", email: data.email, role: 'free' };
  localStorage.setItem('user', JSON.stringify(user));
  return { data: { token, user } };
};

// GET /api/user/profile
const mockGetUserProfile = async () => {
  await delay(300);
  const user = JSON.parse(localStorage.getItem('user') || '{"id":1,"name":"Test User","email":"test@example.com","role":"free"}');
  return { data: user };
};

// POST /api/roadmaps
const mockGenerateRoadmap = async (scholarshipId: string) => {
  await delay(1000);
  return { data: { message: "Roadmap generated successfully", roadmapId: "roadmap-1" } };
};

// GET /api/roadmaps
const mockGetRoadmaps = async () => {
  await delay(500);
  return { data: [] };
};

// GET /api/tasks/daily
const mockGetDailyTasks = async () => {
  await delay(500);
  return { 
    data: [
      { id: "1", title: "Research scholarships", description: "Find 5 potential scholarships", completed: false, deadline: new Date().toISOString() },
      { id: "2", title: "Prepare documents", description: "Gather academic transcripts", completed: true, deadline: new Date().toISOString() },
    ] 
  };
};

// ============ EXPORT API FUNCTIONS ============
// Scholarship endpoints
export const getScholarships = async () => {
  if (USE_MOCK_API) {
    return mockGetScholarships();
  }
  return API.get("/scholarships");
};

export const getScholarshipDetail = async (id: string) => {
  if (USE_MOCK_API) {
    return mockGetScholarshipDetail(id);
  }
  return API.get(`/scholarships/${id}`);
};

// Auth endpoints
export const register = async (data: { name: string; email: string; password: string }) => {
  if (USE_MOCK_API) {
    return mockRegister(data);
  }
  return API.post("/auth/register", data);
};

export const login = async (data: { email: string; password: string }) => {
  if (USE_MOCK_API) {
    return mockLogin(data);
  }
  return API.post("/auth/login", data);
};

export const getUserProfile = async () => {
  if (USE_MOCK_API) {
    return mockGetUserProfile();
  }
  return API.get("/user/profile");
};

// Roadmap endpoints
export const generateRoadmap = async (scholarshipId: string) => {
  if (USE_MOCK_API) {
    return mockGenerateRoadmap(scholarshipId);
  }
  return API.post("/roadmaps", { scholarship_id: scholarshipId });
};

export const getRoadmaps = async () => {
  if (USE_MOCK_API) {
    return mockGetRoadmaps();
  }
  return API.get("/roadmaps");
};

export const getRoadmapDetail = async (id: string) => {
  if (USE_MOCK_API) {
    await delay(500);
    return { data: null };
  }
  return API.get(`/roadmaps/${id}`);
};

// Tasks endpoints
export const getDailyTasks = async () => {
  if (USE_MOCK_API) {
    return mockGetDailyTasks();
  }
  return API.get("/tasks/daily");
};

export const completeTask = async (taskId: string) => {
  if (USE_MOCK_API) {
    await delay(300);
    return { data: { success: true } };
  }
  return API.post(`/tasks/${taskId}/complete`);
};

// Test endpoints
export const getTests = async () => {
  if (USE_MOCK_API) {
    await delay(500);
    return {
      data: [
        { id: 1, title: "TOEFL Simulation", description: "Practice TOEFL exam with real questions", duration: 120, totalQuestions: 100, difficulty: "medium", isPremium: false },
        { id: 2, title: "IELTS Simulation", description: "Practice IELTS exam with real questions", duration: 120, totalQuestions: 100, difficulty: "medium", isPremium: true }
      ]
    };
  }
  return API.get("/tests");
};

export const getTestById = async (id: string) => {
  if (USE_MOCK_API) {
    await delay(500);
    return {
      data: {
        id: 1,
        title: "TOEFL Simulation",
        description: "Practice TOEFL exam",
        duration: 120,
        totalQuestions: 100,
        passingScore: 70,
        difficulty: "medium",
        isPremium: false,
        questions: [
          {
            id: 1,
            question: "What is the capital of Indonesia?",
            type: "multiple-choice",
            options: ["Jakarta", "Surabaya", "Bandung", "Medan"],
            correctAnswer: 0,
            points: 1,
            explanation: "Jakarta is the capital city of Indonesia"
          },
          {
            id: 2,
            question: "Which of the following is a renewable energy source?",
            type: "multiple-choice",
            options: ["Coal", "Natural Gas", "Solar Power", "Oil"],
            correctAnswer: 2,
            points: 1,
            explanation: "Solar power is renewable"
          }
        ]
      }
    };
  }
  return API.get(`/tests/${id}`);
};

export const submitTest = async (id: string, answers: any) => {
  if (USE_MOCK_API) {
    await delay(1000);
    const correctCount = Object.values(answers).filter(a => a === 0).length;
    const totalQuestions = 2;
    const score = (correctCount / totalQuestions) * 100;
    return {
      data: {
        score: score,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        passed: score >= 70
      }
    };
  }
  return API.post(`/tests/${id}/submit`, { answers });
};

// Bookmark endpoints
const mockBookmarks: Set<string> = loadMockBookmarks();

const mockAddBookmark = async (scholarshipId: string) => {
  await delay(300);
  mockBookmarks.add(scholarshipId);
  persistMockBookmarks(mockBookmarks);
  return {
    data: {
      success: true,
      message: "Scholarship bookmarked successfully"
    }
  };
};

const mockRemoveBookmark = async (scholarshipId: string) => {
  await delay(300);
  mockBookmarks.delete(scholarshipId);
  persistMockBookmarks(mockBookmarks);
  return {
    data: {
      success: true,
      message: "Bookmark removed successfully"
    }
  };
};

const mockGetBookmarks = async () => {
  await delay(500);
  const bookmarkedScholarships = mockScholarships.filter(s => mockBookmarks.has(String(s.id)));
  return {
    data: {
      success: true,
      data: {
        scholarships: bookmarkedScholarships,
        pagination: {
          total: bookmarkedScholarships.length,
          per_page: 15,
          current_page: 1
        }
      }
    }
  };
};

export const addBookmark = async (scholarshipId: string) => {
  if (USE_MOCK_API) {
    return mockAddBookmark(scholarshipId);
  }
  return API.post(`/scholarships/${scholarshipId}/bookmark`);
};

export const removeBookmark = async (scholarshipId: string) => {
  if (USE_MOCK_API) {
    return mockRemoveBookmark(scholarshipId);
  }
  return API.delete(`/scholarships/${scholarshipId}/bookmark`);
};

export const getBookmarks = async () => {
  if (USE_MOCK_API) {
    return mockGetBookmarks();
  }
  return API.get("/scholarships/bookmarks");
};