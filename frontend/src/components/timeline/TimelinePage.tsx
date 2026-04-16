import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth-context';
import { useBookmarks } from '../../lib/bookmark-context';
import { getScholarshipById } from '../../lib/scholarship-api';
import {
  getRoadmaps,
  createRoadmap,
  completeTask,
  skipTask,
  type Roadmap,
  type DailyTask,
} from '../../lib/roadmap-api';
import { LockedFeature } from '../LockedFeature';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import {
  Clock,
  CheckCircle,
  FileText,
  Users,
  BookOpen,
  Send,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

// Category icon mapping based on task title keywords
function getTaskIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('language') || t.includes('ielts') || t.includes('toefl')) return BookOpen;
  if (t.includes('recommend') || t.includes('letter')) return Users;
  if (t.includes('submit') || t.includes('application')) return Send;
  return FileText;
}

export function TimelinePage() {
  const { bookmarks } = useBookmarks();
  const { user } = useAuth();

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookmarkedScholarships, setBookmarkedScholarships] = useState<
    Array<{ id: string; title: string; deadline: string }>
  >([]);
  const [generateFromScholarshipId, setGenerateFromScholarshipId] = useState('');

  const isPremiumOrAdmin = user?.role === 'premium' || user?.role === 'admin';

  const loadRoadmaps = useCallback(async () => {
    setIsLoadingRoadmaps(true);
    setError(null);
    try {
      const data = await getRoadmaps();
      setRoadmaps(data);
      if (data.length > 0) {
        setSelectedRoadmapId(prev => prev || data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmaps.');
    } finally {
      setIsLoadingRoadmaps(false);
    }
  }, []);

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  // Load scholarship titles for bookmarked IDs
  useEffect(() => {
    if (bookmarks.length === 0) {
      setBookmarkedScholarships([]);
      return;
    }
    Promise.all(
      bookmarks.map(id =>
        getScholarshipById(id)
          .then(r => ({
            id: r.scholarship.id,
            title: r.scholarship.title,
            deadline: r.scholarship.applicationDeadline,
          }))
          .catch(() => null)
      )
    ).then(results => {
      setBookmarkedScholarships(
        results.filter(Boolean) as Array<{ id: string; title: string; deadline: string }>
      );
    });
  }, [bookmarks]);

  const handleGenerateRoadmap = async () => {
    if (!generateFromScholarshipId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const newRoadmap = await createRoadmap(generateFromScholarshipId);
      setRoadmaps(prev => [newRoadmap, ...prev]);
      setSelectedRoadmapId(newRoadmap.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (task: DailyTask) => {
    if (!isPremiumOrAdmin) return;
    const originalRoadmaps = roadmaps;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Optimistic update
    setRoadmaps(prev =>
      prev.map(r => ({
        ...r,
        dailyTasks: r.dailyTasks?.map(t =>
          t.id === task.id ? { ...t, status: newStatus } : t
        ),
      }))
    );

    try {
      if (newStatus === 'completed') {
        await completeTask(task.id);
      }
      const fresh = await getRoadmaps();
      setRoadmaps(fresh);
    } catch {
      setRoadmaps(originalRoadmaps);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    if (!isPremiumOrAdmin) return;
    const originalRoadmaps = roadmaps;

    setRoadmaps(prev =>
      prev.map(r => ({
        ...r,
        dailyTasks: r.dailyTasks?.map(t =>
          t.id === taskId ? { ...t, status: 'skipped' as const } : t
        ),
      }))
    );

    try {
      await skipTask(taskId);
      const fresh = await getRoadmaps();
      setRoadmaps(fresh);
    } catch {
      setRoadmaps(originalRoadmaps);
    }
  };

  const selectedRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);
  const tasks = selectedRoadmap?.dailyTasks ?? [];
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress =
    selectedRoadmap?.progressPercentage ??
    (tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0);

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Preparation Timeline</h1>
          <p className="text-muted-foreground">
            Personalized roadmap generated from your profile and scholarship requirements.
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-4 flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Generate New Roadmap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Generate Personalized Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={generateFromScholarshipId} onValueChange={setGenerateFromScholarshipId}>
                <SelectTrigger id="scholarship-select" className="flex-1">
                  <SelectValue placeholder="Select a bookmarked scholarship..." />
                </SelectTrigger>
                <SelectContent>
                  {bookmarkedScholarships.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No bookmarked scholarships.{' '}
                      <Link to="/scholarships" className="text-primary hover:underline">
                        Browse scholarships
                      </Link>
                    </div>
                  ) : (
                    bookmarkedScholarships.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} — Deadline:{' '}
                        {new Date(s.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                id="generate-roadmap-btn"
                onClick={handleGenerateRoadmap}
                disabled={!generateFromScholarshipId || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Roadmap
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap Selector */}
        {roadmaps.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <label className="text-sm font-medium mb-2 block">Active Roadmap</label>
              <Select value={selectedRoadmapId} onValueChange={setSelectedRoadmapId}>
                <SelectTrigger id="roadmap-selector">
                  <SelectValue placeholder="Select a roadmap..." />
                </SelectTrigger>
                <SelectContent>
                  {roadmaps.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                      {r.deadline &&
                        ` — ${new Date(r.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoadingRoadmaps && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading your roadmaps...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingRoadmaps && roadmaps.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2">No Roadmaps Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Bookmark a scholarship and generate a personalized preparation roadmap to get started.
              </p>
              <Link to="/scholarships">
                <Button>Browse Scholarships</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Roadmap Content */}
        {selectedRoadmap && (
          <>
            {isPremiumOrAdmin ? (
              <>
                {/* Progress Overview */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {completedCount} of {tasks.length} tasks completed
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {[
                        { label: 'Completed', value: completedCount, color: 'text-primary' },
                        { label: 'Remaining', value: tasks.filter(t => t.status === 'pending').length },
                        { label: 'Skipped', value: tasks.filter(t => t.status === 'skipped').length },
                        { label: 'Progress', value: `${progress}%` },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preparation Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tasks.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                          No tasks in this roadmap. Try generating a new roadmap.
                        </p>
                      )}
                      {tasks
                        .slice()
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map(task => {
                          const isCompleted = task.status === 'completed';
                          const isSkipped = task.status === 'skipped';
                          const dueDate = new Date(task.dueDate);
                          const isOverdue = dueDate < new Date() && task.status === 'pending';
                          const TaskIcon = getTaskIcon(task.title);

                          return (
                            <div
                              key={task.id}
                              className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                                isCompleted
                                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                                  : isSkipped
                                  ? 'bg-muted/30 border-muted opacity-60'
                                  : isOverdue
                                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={isCompleted}
                                onCheckedChange={() => handleToggleTask(task)}
                                className="mt-1"
                                disabled={isSkipped}
                              />

                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isCompleted
                                    ? 'bg-green-100'
                                    : isOverdue
                                    ? 'bg-red-100'
                                    : 'bg-primary/10'
                                }`}
                              >
                                <TaskIcon
                                  className={`w-5 h-5 ${
                                    isCompleted
                                      ? 'text-green-600'
                                      : isOverdue
                                      ? 'text-red-600'
                                      : 'text-primary'
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4
                                    className={`font-medium ${
                                      isCompleted ? 'line-through text-muted-foreground' : ''
                                    }`}
                                  >
                                    {task.title}
                                  </h4>
                                  <div className="flex gap-1 shrink-0">
                                    {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                                    {isCompleted && (
                                      <Badge className="bg-green-600">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Done
                                      </Badge>
                                    )}
                                    {isSkipped && <Badge variant="secondary">Skipped</Badge>}
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                  <div
                                    className={`flex items-center gap-1 ${
                                      isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {dueDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    {isOverdue && <AlertCircle className="w-4 h-4 ml-1" />}
                                  </div>

                                  {!isCompleted && !isSkipped && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-muted-foreground"
                                      onClick={() => handleSkipTask(task.id)}
                                    >
                                      Skip
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <LockedFeature feature="Personalized Preparation Timeline">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={25} className="h-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {[['3', 'Completed'], ['9', 'Remaining'], ['2', 'Skipped'], ['25%', 'Progress']].map(
                        ([val, label]) => (
                          <div key={label} className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold">{val}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </LockedFeature>
            )}
          </>
        )}
      </main>
    </div>
  );
}