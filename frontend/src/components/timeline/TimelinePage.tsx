import { useState } from 'react';
import { Link } from 'react-router';
import { scholarships } from '../../lib/scholarship-data';
import { useBookmarks } from '../../lib/bookmark-context';
import { useAuth } from '../../lib/auth-context';
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
  AlertCircle
} from 'lucide-react';

interface TimelineTask {
  id: string;
  title: string;
  description: string;
  icon: any;
  daysBeforeDeadline: number;
  category: 'documents' | 'tests' | 'recommendations' | 'application';
  estimatedHours: number;
}

const taskTemplates: TimelineTask[] = [
  {
    id: 'toefl-ielts',
    title: 'Take English Language Test',
    description: 'Complete TOEFL iBT or IELTS and receive official scores',
    icon: BookOpen,
    daysBeforeDeadline: 90,
    category: 'tests',
    estimatedHours: 40,
  },
  {
    id: 'transcripts',
    title: 'Request Academic Transcripts',
    description: 'Order official transcripts from your institution',
    icon: FileText,
    daysBeforeDeadline: 60,
    category: 'documents',
    estimatedHours: 2,
  },
  {
    id: 'recommendations',
    title: 'Request Recommendation Letters',
    description: 'Contact professors or supervisors for recommendation letters',
    icon: Users,
    daysBeforeDeadline: 45,
    category: 'recommendations',
    estimatedHours: 5,
  },
  {
    id: 'statement',
    title: 'Write Statement of Purpose',
    description: 'Draft and refine your personal statement or statement of purpose',
    icon: FileText,
    daysBeforeDeadline: 40,
    category: 'documents',
    estimatedHours: 20,
  },
  {
    id: 'cv',
    title: 'Update Academic CV',
    description: 'Prepare or update your curriculum vitae',
    icon: FileText,
    daysBeforeDeadline: 35,
    category: 'documents',
    estimatedHours: 5,
  },
  {
    id: 'research-proposal',
    title: 'Prepare Research Proposal',
    description: 'Write research proposal (if required for graduate programs)',
    icon: FileText,
    daysBeforeDeadline: 50,
    category: 'documents',
    estimatedHours: 30,
  },
  {
    id: 'health-docs',
    title: 'Obtain Health Certificate',
    description: 'Complete medical examination and get health certificate',
    icon: FileText,
    daysBeforeDeadline: 30,
    category: 'documents',
    estimatedHours: 4,
  },
  {
    id: 'financial-docs',
    title: 'Prepare Financial Documents',
    description: 'Gather bank statements and financial guarantee documents',
    icon: FileText,
    daysBeforeDeadline: 25,
    category: 'documents',
    estimatedHours: 3,
  },
  {
    id: 'portfolio',
    title: 'Prepare Portfolio/Work Samples',
    description: 'Compile portfolio or writing samples (if required)',
    icon: FileText,
    daysBeforeDeadline: 45,
    category: 'documents',
    estimatedHours: 15,
  },
  {
    id: 'application-form',
    title: 'Complete Application Form',
    description: 'Fill out online application form with all required information',
    icon: FileText,
    daysBeforeDeadline: 14,
    category: 'application',
    estimatedHours: 3,
  },
  {
    id: 'review',
    title: 'Review Application',
    description: 'Review all documents and application materials',
    icon: CheckCircle,
    daysBeforeDeadline: 7,
    category: 'application',
    estimatedHours: 2,
  },
  {
    id: 'submit',
    title: 'Submit Application',
    description: 'Submit complete application before deadline',
    icon: Send,
    daysBeforeDeadline: 3,
    category: 'application',
    estimatedHours: 1,
  },
];

export function TimelinePage() {
  const { bookmarks } = useBookmarks();
  const { user } = useAuth();
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const bookmarkedScholarships = scholarships.filter(s => bookmarks.includes(s.id));
  const selectedScholarship = scholarships.find(s => s.id === selectedScholarshipId);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getTimelineTasks = () => {
    if (!selectedScholarship) return [];

    const deadline = selectedScholarship.deadline;
    const now = new Date();

    return taskTemplates
      .map(task => {
        const taskDate = new Date(deadline);
        taskDate.setDate(taskDate.getDate() - task.daysBeforeDeadline);

        return {
          ...task,
          targetDate: taskDate,
          isPast: taskDate < now,
          isOverdue: taskDate < now && !completedTasks.includes(task.id),
        };
      })
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  };

  const timelineTasks = getTimelineTasks();
  const progress = timelineTasks.length > 0 
    ? (completedTasks.length / timelineTasks.length) * 100 
    : 0;

  const totalEstimatedHours = timelineTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const completedHours = timelineTasks
    .filter(task => completedTasks.includes(task.id))
    .reduce((sum, task) => sum + task.estimatedHours, 0);

  const categoryIcons = {
    documents: FileText,
    tests: BookOpen,
    recommendations: Users,
    application: Send,
  };

  const isPremiumOrAdmin = user?.role === 'premium' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Preparation Timeline</h1>
          <p className="text-muted-foreground">
            Automated timeline breaks down all tasks you need to complete before the deadline
          </p>
        </div>

        {/* Scholarship Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select a Scholarship
                </label>
                <Select value={selectedScholarshipId} onValueChange={setSelectedScholarshipId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a scholarship to see the preparation timeline" />
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
                      bookmarkedScholarships.map(scholarship => (
                        <SelectItem key={scholarship.id} value={scholarship.id}>
                          {scholarship.title} - Deadline: {scholarship.deadline.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
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
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <Link to={`/scholarships/${selectedScholarship.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedScholarship && (
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
                          {completedTasks.length} of {timelineTasks.length} tasks completed
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{completedTasks.length}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{timelineTasks.length - completedTasks.length}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{completedHours}h</p>
                        <p className="text-xs text-muted-foreground">Hours Done</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{totalEstimatedHours - completedHours}h</p>
                        <p className="text-xs text-muted-foreground">Hours Left</p>
                      </div>
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
                      {timelineTasks.map((task, index) => {
                        const isCompleted = completedTasks.includes(task.id);
                        const CategoryIcon = categoryIcons[task.category];

                        return (
                          <div
                            key={task.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200' 
                                : task.isOverdue 
                                ? 'bg-red-50 border-red-200' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="mt-1"
                            />

                            <div className={`p-2 rounded-lg shrink-0 ${
                              isCompleted 
                                ? 'bg-green-100' 
                                : task.isOverdue 
                                ? 'bg-red-100' 
                                : 'bg-primary/10'
                            }`}>
                              <task.icon className={`w-5 h-5 ${
                                isCompleted 
                                  ? 'text-green-600' 
                                  : task.isOverdue 
                                  ? 'text-red-600' 
                                  : 'text-primary'
                              }`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h4>
                                <Badge variant="outline" className="shrink-0">
                                  <CategoryIcon className="w-3 h-3 mr-1" />
                                  {task.category}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className={`flex items-center gap-1 ${task.isOverdue && !isCompleted ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {task.targetDate.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  {task.isOverdue && !isCompleted && (
                                    <AlertCircle className="w-4 h-4 ml-1" />
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  Estimated: {task.estimatedHours}h
                                </div>
                                {task.isPast && !task.isOverdue && !isCompleted && (
                                  <Badge variant="secondary">In Progress</Badge>
                                )}
                                {task.isOverdue && !isCompleted && (
                                  <Badge variant="destructive">Overdue</Badge>
                                )}
                                {isCompleted && (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
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
              <LockedFeature
                feature="Automated Preparation Timeline"
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                          0 of 12 tasks completed
                        </span>
                      </div>
                      <Progress value={25} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">3</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">9</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">15h</p>
                        <p className="text-xs text-muted-foreground">Hours Done</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">65h</p>
                        <p className="text-xs text-muted-foreground">Hours Left</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </LockedFeature>
            )}
          </>
        )}

        {!selectedScholarship && bookmarkedScholarships.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2">No Bookmarked Scholarships</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Bookmark scholarships first to see personalized preparation timelines with automated task breakdowns
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