import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiGetMock, apiPostMock, apiPutMock, apiDeleteMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  apiPutMock: vi.fn(),
  apiDeleteMock: vi.fn(),
}));

vi.mock('../api-client', () => ({
  apiGet: apiGetMock,
  apiPost: apiPostMock,
  apiPut: apiPutMock,
  apiDelete: apiDeleteMock,
}));

import { createRoadmap, getRoadmaps, completeTask, skipTask } from '../roadmap-api';

describe('roadmap-api', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    apiPutMock.mockReset();
    apiDeleteMock.mockReset();
  });

  it('normalizes roadmaps and tasks from snake_case', async () => {
    apiGetMock.mockResolvedValueOnce([
      {
        id: 'rm-1',
        user_id: 'u-1',
        scholarship_id: 'sch-1',
        title: 'Roadmap A',
        status: 'active',
        progress_percentage: 25,
        created_at: '2026-04-21T00:00:00Z',
        daily_tasks: [
          {
            id: 'task-1',
            roadmap_id: 'rm-1',
            title: 'Prepare transcript',
            due_date: '2026-04-30',
            day_number: 1,
            status: 'pending',
          },
        ],
      },
    ]);

    const roadmaps = await getRoadmaps();

    expect(roadmaps).toHaveLength(1);
    expect(roadmaps[0].progressPercentage).toBe(25);
    expect(roadmaps[0].dailyTasks?.[0].dayNumber).toBe(1);
    expect(roadmaps[0].dailyTasks?.[0].dueDate).toBe('2026-04-30');
  });

  it('sends scholarship id and normalizes generated roadmap response', async () => {
    apiPostMock.mockResolvedValueOnce({
      id: 'rm-2',
      user_id: 'u-1',
      scholarship_id: 'sch-2',
      title: 'Roadmap B',
      status: 'active',
      progress_percentage: 0,
      created_at: '2026-04-21T00:00:00Z',
      daily_tasks: [],
    });

    const roadmap = await createRoadmap('sch-2');

    expect(apiPostMock).toHaveBeenCalledWith('/roadmaps', { scholarship_id: 'sch-2' });
    expect(roadmap.id).toBe('rm-2');
    expect(roadmap.scholarshipId).toBe('sch-2');
    expect(roadmap.progressPercentage).toBe(0);
  });

  it('normalizes task completion/skip responses', async () => {
    apiPutMock
      .mockResolvedValueOnce({
        id: 'task-10',
        roadmap_id: 'rm-1',
        title: 'Submit essay',
        due_date: '2026-05-01',
        day_number: 2,
        status: 'completed',
      })
      .mockResolvedValueOnce({
        id: 'task-11',
        roadmap_id: 'rm-1',
        title: 'Collect recommendation',
        due_date: '2026-05-03',
        day_number: 3,
        status: 'skipped',
      });

    const completed = await completeTask('task-10');
    const skipped = await skipTask('task-11');

    expect(completed.status).toBe('completed');
    expect(skipped.status).toBe('skipped');
  });
});
