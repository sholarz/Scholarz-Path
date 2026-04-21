type TestDifficulty = 'beginner' | 'intermediate' | 'advanced';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: {
    message?: string;
  };
};

export type TestListItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: number;
  passingScore: number;
  difficulty: TestDifficulty;
  isPremium: boolean;
  isLocked?: boolean;
  totalQuestions: number;
  section?: string;
};

export type TestQuestion = {
  id: string;
  question: string;
  passage?: string | null;
  type: 'multiple-choice';
  options: string[];
  points: number;
  order_index?: number;
};

export type TestDetail = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: number;
  passingScore: number;
  difficulty: TestDifficulty;
  isPremium: boolean;
  totalQuestions: number;
  questions: TestQuestion[];
};

export type TestReviewAnswer = {
  question_id: string;
  question: string;
  passage?: string | null;
  options: string[];
  yourAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  explanation?: string | null;
  points: number;
  pointsEarned: number;
};

export type TestSubmitResult = {
  session_id: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  reviewAnswers: TestReviewAnswer[];
};

export type TestHistorySummary = {
  total_attempts: number;
  passed_attempts: number;
  best_score: number;
  last_score: number | null;
  last_submitted_at: string | null;
};

export type TestHistoryAttempt = {
  session_id: string;
  test_id: string;
  test_title: string;
  category: string;
  difficulty: TestDifficulty;
  access_level: 'free' | 'premium';
  score: number;
  passed: boolean;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  submitted_at: string | null;
};

export type TestHistoryResponse = {
  summary: TestHistorySummary;
  attempts: TestHistoryAttempt[];
};

const API_BASE_URL = ((import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env?.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ApiEnvelope<unknown> & { errors?: Record<string, string[]> };

    if (body?.errors) {
      const first = Object.values(body.errors).find((messages) => messages?.length > 0);
      if (first?.[0]) {
        return first[0];
      }
    }

    if (body?.error?.message) {
      return body.error.message;
    }

    if (body?.message) {
      return body.message;
    }
  } catch {
    // Fall through
  }

  return 'Request failed';
};

export const getTests = async (): Promise<TestListItem[]> => {
  const response = await fetch(`${API_BASE_URL}/tests`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as ApiEnvelope<TestListItem[]>;
  return payload.data ?? [];
};

export const getTestDetail = async (id: string): Promise<TestDetail> => {
  const response = await fetch(`${API_BASE_URL}/tests/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as ApiEnvelope<TestDetail>;
  if (!payload.data) {
    throw new Error('Test detail is unavailable');
  }

  return payload.data;
};

export const submitTest = async (
  id: string,
  answers: Record<string, number>,
  timeTakenSeconds: number
): Promise<TestSubmitResult> => {
  const response = await fetch(`${API_BASE_URL}/tests/${id}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      answers,
      time_taken_seconds: timeTakenSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as ApiEnvelope<TestSubmitResult>;
  if (!payload.data) {
    throw new Error('Submit response is unavailable');
  }

  return payload.data;
};

export const getTestHistory = async (): Promise<TestHistoryResponse> => {
  const response = await fetch(`${API_BASE_URL}/tests/history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as ApiEnvelope<TestHistoryResponse>;
  if (!payload.data) {
    throw new Error('Test history is unavailable');
  }

  return payload.data;
};
