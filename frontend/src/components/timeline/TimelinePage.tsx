import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { PremiumFeatureLock } from '../PremiumFeatureLock';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { completeTask, generateRoadmap, getBookmarks, getRoadmaps } from '../../api/scholarship';

type BookmarkedScholarship = {
  id: string;
  title: string;
  deadline: Date;
};

type ApiTask = {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'skipped' | string;
  day_number?: number;
};

type ApiRoadmap = {
  id: string;
  scholarship_id: string;
  title: string;
  deadline?: string;
  progress_percentage?: number;
  status?: string;
  dailyTasks?: ApiTask[];
};

const normalizeBookmarkedScholarship = (item: any): BookmarkedScholarship | null => {
  const raw = item?.scholarship ?? item;
  if (!raw?.id) {
    return null;
  }

  const deadlineSource = raw.application_deadline ?? raw.deadline ?? new Date().toISOString();

  return {
    id: String(raw.id),
    title: raw.title ?? 'Untitled Scholarship',
    deadline: new Date(deadlineSource),
  };
};

const normalizeRoadmap = (item: any): ApiRoadmap | null => {
  if (!item?.id) {
    return null;
  }

  const taskSource = Array.isArray(item.dailyTasks)
    ? item.dailyTasks
    : Array.isArray(item.daily_tasks)
    ? item.daily_tasks
    : [];

  return {
    id: String(item.id),
    scholarship_id: String(item.scholarship_id ?? ''),
    title: item.title ?? 'Roadmap',
    deadline: item.deadline,
    progress_percentage: Number(item.progress_percentage ?? 0),
    status: item.status ?? 'active',
    dailyTasks: taskSource.map((task: any) => ({
      id: String(task.id),
      title: task.title ?? 'Task',
      description: task.description ?? '',
      due_date: task.due_date,
      status: task.status ?? 'pending',
      day_number: Number(task.day_number ?? 0),
    })),
  };
};

export function TimelinePage() {
  const { user } = useAuth();
  const [bookmarkedScholarships, setBookmarkedScholarships] = useState<BookmarkedScholarship[]>([]);
  const [roadmaps, setRoadmaps] = useState<ApiRoadmap[]>([]);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const isPremiumOrAdmin = user?.role === 'premium' || user?.role === 'admin';

  const fetchTimelineData = async () => {
    try {
      setIsLoading(true);

      const [bookmarksResponse, roadmapsResponse] = await Promise.all([
        getBookmarks(),
        getRoadmaps(),
      ]);

      const bookmarkItems = bookmarksResponse?.data?.data?.scholarships ?? bookmarksResponse?.data ?? [];
      const normalizedBookmarks = bookmarkItems
        .map((item: any) => normalizeBookmarkedScholarship(item))
        .filter((item: BookmarkedScholarship | null): item is BookmarkedScholarship => item !== null);

      const roadmapItems = roadmapsResponse?.data?.data ?? roadmapsResponse?.data ?? [];
      const normalizedRoadmaps = roadmapItems
        .map((item: any) => normalizeRoadmap(item))
        .filter((item: ApiRoadmap | null): item is ApiRoadmap => item !== null);

      setBookmarkedScholarships(normalizedBookmarks);
      setRoadmaps(normalizedRoadmaps);

      if (!selectedScholarshipId && normalizedBookmarks.length > 0) {
        setSelectedScholarshipId(normalizedBookmarks[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch timeline data:', error);
      toast.error('Failed to load timeline data');
      setBookmarkedScholarships([]);
      setRoadmaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const selectedScholarship = useMemo(
    () => bookmarkedScholarships.find((item) => item.id === selectedScholarshipId),
    [bookmarkedScholarships, selectedScholarshipId]
  );

  const selectedRoadmap = useMemo(
    () => roadmaps.find((item) => item.scholarship_id === selectedScholarshipId && item.status !== 'abandoned'),
    [roadmaps, selectedScholarshipId]
  );

  const timelineTasks = useMemo(() => {
    if (!selectedRoadmap?.dailyTasks) {
      return [];
    }

    const now = new Date();

    return [...selectedRoadmap.dailyTasks]
      .sort((a, b) => {
        const dayA = a.day_number ?? 0;
        const dayB = b.day_number ?? 0;
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        return new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime();
      })
      .map((task) => {
        const targetDate = task.due_date ? new Date(task.due_date) : null;
        const isCompleted = task.status === 'completed';
        const isOverdue = Boolean(targetDate && targetDate < now && !isCompleted);

        return {
          ...task,
          targetDate,
          isCompleted,
          isOverdue,
        };
      });
  }, [selectedRoadmap]);

  const completedCount = timelineTasks.filter((task) => task.isCompleted).length;
  const progress = selectedRoadmap?.progress_percentage ?? (timelineTasks.length > 0
    ? Math.round((completedCount / timelineTasks.length) * 100)
    : 0);

  const handleGenerateRoadmap = async () => {
    if (!selectedScholarshipId) {
      return;
    }

    try {
      setIsGenerating(true);
      await generateRoadmap(selectedScholarshipId);
      toast.success('Roadmap generated successfully');
      await fetchTimelineData();
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      toast.error('Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteTask = async (taskId: string, alreadyCompleted: boolean) => {
    if (alreadyCompleted) {
      return;
    }

    try {
      setCompletingTaskId(taskId);
      await completeTask(taskId);
      toast.success('Task marked as completed');
      await fetchTimelineData();
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Preparation Timeline</h1>
          <p className="text-muted-foreground">
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select a Scholarship</label>
              <Select value={selectedScholarshipId} onValueChange={setSelectedScholarshipId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a scholarship to load roadmap" />
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
                    bookmarkedScholarships.map((scholarship) => (
                      <SelectItem key={scholarship.id} value={scholarship.id}>
                        {scholarship.title} - Deadline: {scholarship.deadline.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedScholarship && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium mb-1">{selectedScholarship.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Deadline: {selectedScholarship.deadline.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Link to={`/scholarships/${selectedScholarship.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-muted-foreground">Loading timeline...</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && selectedScholarship && !selectedRoadmap && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <h3 className="font-semibold text-lg">No Roadmap Yet</h3>
              <p className="text-muted-foreground">Generate roadmap otomatis untuk scholarship ini.</p>
              <Button onClick={handleGenerateRoadmap} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Roadmap'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && selectedScholarship && selectedRoadmap && (
          <>
            {isPremiumOrAdmin ? (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {completedCount} of {timelineTasks.length} tasks completed
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{timelineTasks.length - completedCount}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{progress}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preparation Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timelineTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                            task.isCompleted
                              ? 'bg-green-50 border-green-200'
                              : task.isOverdue
                              ? 'bg-red-50 border-red-200'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={() => handleCompleteTask(task.id, task.isCompleted)}
                            disabled={task.isCompleted || completingTaskId === task.id}
                            className="mt-1"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                              <Badge variant="outline">Task {task.day_number ?? '-'}</Badge>
                            </div>

                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className={`flex items-center gap-1 ${task.isOverdue && !task.isCompleted ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                <Clock className="w-4 h-4" />
                                <span>
                                  {task.targetDate
                                    ? task.targetDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })
                                    : 'No due date'}
                                </span>
                                {task.isOverdue && !task.isCompleted && <AlertCircle className="w-4 h-4 ml-1" />}
                              </div>

                              {task.isOverdue && !task.isCompleted && <Badge variant="destructive">Overdue</Badge>}
                              {task.isCompleted && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <PremiumFeatureLock
                feature="Automated Preparation Timeline"
                description="Track all your application tasks with intelligent deadline breakdown and progress monitoring"
                showBadge={true}
                showLockIcon={true}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Upgrade to premium to unlock roadmap task tracking.</p>
                  </CardContent>
                </Card>
              </PremiumFeatureLock>
            )}
          </>
        )}

        {!isLoading && !selectedScholarship && bookmarkedScholarships.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2">No Bookmarked Scholarships</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Bookmark scholarships first to generate timeline from roadmap API.
              </p>
              <Link to="/scholarships">
                <Button>Browse Scholarships</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
