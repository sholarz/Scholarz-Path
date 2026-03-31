// src/api/scholarship.ts
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { scholarships as mockScholarships } from "../lib/scholarship-data";
import { testSimulations } from "../lib/test-simulation-data";

// Utility function for simulating network delay in mock API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ PAKAI MOCK API (untuk development) ============
// Set ke false jika backend sudah siap
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_SCHOLARSHIP_API !== 'false';

const MOCK_BOOKMARKS_STORAGE_KEY = 'mock_bookmarks';
const MOCK_ROADMAPS_STORAGE_KEY = 'mock_roadmaps';

type MockRoadmapTask = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed' | 'skipped';
  day_number: number;
};

type MockRoadmap = {
  id: string;
  scholarship_id: string;
  title: string;
  description: string;
  deadline: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'abandoned';
  dailyTasks: MockRoadmapTask[];
};

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

const loadMockRoadmaps = (): MockRoadmap[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(MOCK_ROADMAPS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistMockRoadmaps = (roadmaps: MockRoadmap[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(MOCK_ROADMAPS_STORAGE_KEY, JSON.stringify(roadmaps));
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

  const scholarship = mockScholarships.find((item: any) => String(item.id) === String(scholarshipId));
  if (!scholarship) {
    throw new Error('Scholarship not found');
  }

  const roadmaps = loadMockRoadmaps();
  const existing = roadmaps.find((item) => item.scholarship_id === scholarshipId && item.status === 'active');
  if (existing) {
    return { data: { data: existing } };
  }

  const roadmapId = `roadmap-${Date.now()}`;
  const deadline = scholarship.deadline instanceof Date
    ? scholarship.deadline
    : new Date(scholarship.deadline);

  const templates = [
    ['Collect required documents', 'Prepare transcripts, certificate, and IDs.'],
    ['Write personal statement', 'Draft and revise your motivation letter.'],
    ['Request recommendations', 'Ask referees and follow up signatures.'],
    ['Complete application form', 'Fill all fields and upload all documents.'],
    ['Final review and submit', 'Double-check all data and submit before deadline.'],
  ];

  const tasks: MockRoadmapTask[] = templates.map(([title, description], index) => {
    const dueDate = new Date(deadline);
    dueDate.setDate(deadline.getDate() - (templates.length - index) * 7);

    return {
      id: `task-${roadmapId}-${index + 1}`,
      roadmap_id: roadmapId,
      title,
      description,
      due_date: dueDate.toISOString(),
      status: 'pending',
      day_number: index + 1,
    };
  });

  const created: MockRoadmap = {
    id: roadmapId,
    scholarship_id: scholarshipId,
    title: `Roadmap: ${scholarship.title}`,
    description: `Auto-generated roadmap for ${scholarship.title}`,
    deadline: deadline.toISOString(),
    progress_percentage: 0,
    status: 'active',
    dailyTasks: tasks,
  };

  const nextRoadmaps = [created, ...roadmaps];
  persistMockRoadmaps(nextRoadmaps);

  return { data: { data: created } };
};

// GET /api/roadmaps
const mockGetRoadmaps = async () => {
  await delay(500);
  return { data: { data: loadMockRoadmaps() } };
};

// GET /api/tasks/daily
const mockGetDailyTasks = async () => {
  await delay(500);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = loadMockRoadmaps()
    .flatMap((roadmap) => roadmap.dailyTasks)
    .filter((task) => {
      const due = new Date(task.due_date);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    });

  return { data: { data: tasks } };
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
    const roadmaps = loadMockRoadmaps();
    const nextRoadmaps = roadmaps.map((roadmap) => {
      const dailyTasks = roadmap.dailyTasks.map((task) =>
        task.id === taskId ? { ...task, status: 'completed' as const } : task
      );

      const total = dailyTasks.length;
      const completed = dailyTasks.filter((task) => task.status === 'completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...roadmap,
        dailyTasks,
        progress_percentage: progress,
      };
    });

    persistMockRoadmaps(nextRoadmaps);
    return { data: { success: true } };
  }
  return API.put(`/tasks/${taskId}/complete`);
};

// Test endpoints
export const getTests = async () => {
  if (USE_MOCK_API) {
    await delay(500);
    return {
      data: testSimulations.map((test) => ({
        id: test.id,
        title: test.title,
        category: test.category,
        description: test.description,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        passingScore: test.passingScore,
        difficulty: test.difficulty,
        isPremium: test.isPremium,
      }))
    };
  }
  return API.get("/tests");
};

export const getTestById = async (id: string) => {
  if (USE_MOCK_API) {
    await delay(500);
    const found = testSimulations.find((test) => String(test.id) === String(id));
    if (!found) {
      throw new Error('Test not found');
    }

    return {
      data: found
    };
  }
  return API.get(`/tests/${id}`);
};

export const submitTest = async (id: string, answers: any) => {
  if (USE_MOCK_API) {
    await delay(1000);
    const found = testSimulations.find((test) => String(test.id) === String(id));
    if (!found) {
      throw new Error('Test not found');
    }

    const correctCount = found.questions.filter((question) => {
      const answer = answers[question.id];
      return String(answer) === String(question.correctAnswer);
    }).length;

    const totalQuestions = found.questions.length;
    const score = (correctCount / totalQuestions) * 100;
    return {
      data: {
        score: score,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        passed: score >= found.passingScore
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