/**
 * roadmap-api.ts
 * API calls for the personalized preparation roadmap and daily tasks.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api-client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface DailyTask {
  id: string;
  roadmapId: string;
  title: string;
  description?: string | null;
  dueDate: string; // ISO date string
  dayNumber: number;
  status: TaskStatus;
  roadmap?: { id: string; title: string } | null;
}

export interface Roadmap {
  id: string;
  userId: string;
  scholarshipId?: string | null;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: 'active' | 'completed' | 'archived';
  progressPercentage: number;
  dailyTasks?: DailyTask[];
  createdAt: string;
}

// ─────────────────────────────────────────
// Normalizers (snake_case → camelCase)
// ─────────────────────────────────────────

function normalizeTask(raw: Record<string, unknown>): DailyTask {
  return {
    id: raw.id as string,
    roadmapId: (raw.roadmap_id ?? raw.roadmapId) as string,
    title: raw.title as string,
    description: (raw.description ?? null) as string | null,
    dueDate: (raw.due_date ?? raw.dueDate) as string,
    dayNumber: (raw.day_number ?? raw.dayNumber) as number,
    status: raw.status as TaskStatus,
    roadmap: raw.roadmap
      ? { id: (raw.roadmap as Record<string, unknown>).id as string, title: (raw.roadmap as Record<string, unknown>).title as string }
      : null,
  };
}

function normalizeRoadmap(raw: Record<string, unknown>): Roadmap {
  const tasks = raw.daily_tasks ?? raw.dailyTasks;
  return {
    id: raw.id as string,
    userId: (raw.user_id ?? raw.userId) as string,
    scholarshipId: ((raw.scholarship_id ?? raw.scholarshipId) ?? null) as string | null,
    title: raw.title as string,
    description: (raw.description ?? null) as string | null,
    deadline: ((raw.deadline ?? null)) as string | null,
    status: raw.status as Roadmap['status'],
    progressPercentage: (raw.progress_percentage ?? raw.progressPercentage ?? 0) as number,
    dailyTasks: Array.isArray(tasks) ? tasks.map(t => normalizeTask(t as Record<string, unknown>)) : [],
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

// ─────────────────────────────────────────
// API functions
// ─────────────────────────────────────────

/**
 * Get all roadmaps for the authenticated user.
 * GET /api/roadmaps
 */
export async function getRoadmaps(): Promise<Roadmap[]> {
  const raw = await apiGet<unknown[]>('/roadmaps');
  return (raw || []).map(r => normalizeRoadmap(r as Record<string, unknown>));
}

/**
 * Get a single roadmap.
 * GET /api/roadmaps/:id
 */
export async function getRoadmap(id: string): Promise<Roadmap> {
  const raw = await apiGet<Record<string, unknown>>(`/roadmaps/${id}`);
  return normalizeRoadmap(raw);
}

/**
 * Generate a new personalized roadmap for a scholarship.
 * POST /api/roadmaps
 */
export async function createRoadmap(scholarshipId: string): Promise<Roadmap> {
  const raw = await apiPost<Record<string, unknown>>('/roadmaps', {
    scholarship_id: scholarshipId,
  });
  return normalizeRoadmap(raw);
}

/**
 * Get tasks due today for the authenticated user.
 * GET /api/tasks/daily
 */
export async function getDailyTasks(): Promise<DailyTask[]> {
  const raw = await apiGet<unknown[]>('/tasks/daily');
  return (raw || []).map(r => normalizeTask(r as Record<string, unknown>));
}

/**
 * Mark a task as completed.
 * PUT /api/tasks/:id/complete
 */
export async function completeTask(taskId: string): Promise<DailyTask> {
  const raw = await apiPut<Record<string, unknown>>(`/tasks/${taskId}/complete`);
  return normalizeTask(raw);
}

/**
 * Mark a task as skipped.
 * PUT /api/tasks/:id/skip
 */
export async function skipTask(taskId: string): Promise<DailyTask> {
  const raw = await apiPut<Record<string, unknown>>(`/tasks/${taskId}/skip`);
  return normalizeTask(raw);
}

/**
 * Delete a roadmap.
 * DELETE /api/roadmaps/:id
 */
export async function deleteRoadmap(id: string): Promise<void> {
  await apiDelete(`/roadmaps/${id}`);
}
