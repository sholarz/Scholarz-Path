/**
 * dashboard-api.ts
 * Single aggregated API call for the user dashboard page.
 */

import { apiGet } from './api-client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface DashboardTopMatch {
  scholarship: {
    id: string;
    title: string;
    level: string;
    applicationDeadline: string;
    amount?: string | number | null;
    currency?: string | null;
    type?: string | null;
  };
  matchScore: number;
  isBookmarked: boolean;
}

export interface DashboardDeadline {
  scholarshipId: string;
  title: string;
  applicationDeadline: string;
  daysUntilDeadline: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  dayNumber: number;
  roadmap?: { id: string; title: string; scholarshipId?: string | null } | null;
}

export interface DashboardRoadmap {
  id: string;
  title: string;
  deadline?: string | null;
  progressPercentage: number;
  daysUntilDeadline: number;
}

export interface DashboardData {
  topMatches: DashboardTopMatch[];
  readinessScore: number;
  upcomingDeadlines: DashboardDeadline[];
  activeTasks: DashboardTask[];
  activeRoadmaps: DashboardRoadmap[];
  activeRoadmapCount: number;
}

// ─────────────────────────────────────────
// Normalizer
// ─────────────────────────────────────────

function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
  const topMatches = (raw.top_matches as Array<Record<string, unknown>> | null) ?? [];
  const upcomingDeadlines = (raw.upcoming_deadlines as Array<Record<string, unknown>> | null) ?? [];
  const activeTasks = (raw.active_tasks as Array<Record<string, unknown>> | null) ?? [];
  const activeRoadmaps = (raw.active_roadmaps as Array<Record<string, unknown>> | null) ?? [];

  return {
    topMatches: topMatches.map(m => ({
      scholarship: {
        id: (m.scholarship as Record<string, unknown>).id as string,
        title: (m.scholarship as Record<string, unknown>).title as string,
        level: (m.scholarship as Record<string, unknown>).level as string,
        applicationDeadline: (m.scholarship as Record<string, unknown>).application_deadline as string,
        amount: (m.scholarship as Record<string, unknown>).amount as string | null,
        currency: (m.scholarship as Record<string, unknown>).currency as string | null,
        type: (m.scholarship as Record<string, unknown>).type as string | null,
      },
      matchScore: m.match_score as number,
      isBookmarked: m.is_bookmarked as boolean,
    })),
    readinessScore: (raw.readiness_score as number) ?? 0,
    upcomingDeadlines: upcomingDeadlines.map(d => ({
      scholarshipId: d.scholarship_id as string,
      title: d.title as string,
      applicationDeadline: d.application_deadline as string,
      daysUntilDeadline: d.days_until_deadline as number,
    })),
    activeTasks: activeTasks.map(t => ({
      id: t.id as string,
      title: t.title as string,
      dueDate: (t.due_date ?? t.dueDate) as string,
      status: t.status as string,
      dayNumber: (t.day_number ?? t.dayNumber) as number,
      roadmap: t.roadmap
        ? {
            id: (t.roadmap as Record<string, unknown>).id as string,
            title: (t.roadmap as Record<string, unknown>).title as string,
            scholarshipId: ((t.roadmap as Record<string, unknown>).scholarship_id ?? null) as string | null,
          }
        : null,
    })),
    activeRoadmaps: activeRoadmaps.map(r => ({
      id: r.id as string,
      title: r.title as string,
      deadline: (r.deadline ?? null) as string | null,
      progressPercentage: (r.progress_percentage ?? 0) as number,
      daysUntilDeadline: (r.days_until_deadline ?? 0) as number,
    })),
    activeRoadmapCount: (raw.active_roadmap_count as number) ?? 0,
  };
}

// ─────────────────────────────────────────
// API functions
// ─────────────────────────────────────────

/**
 * Fetch aggregated dashboard data for the authenticated user.
 * GET /api/dashboard
 */
export async function getDashboardData(): Promise<DashboardData> {
  const raw = await apiGet<Record<string, unknown>>('/dashboard');
  return normalizeDashboard(raw);
}
