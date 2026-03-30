import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { scholarships } from '../../lib/scholarship-data';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get deadlines for current month
  const deadlinesThisMonth = scholarships.filter(s => {
    const deadlineMonth = s.deadline.getMonth();
    const deadlineYear = s.deadline.getFullYear();
    return deadlineMonth === currentMonth && deadlineYear === currentYear;
  }).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  // Get all upcoming deadlines
  const upcomingDeadlines = scholarships
    .filter(s => s.deadline >= new Date())
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Scholarship Calendar</h1>
          <p className="text-muted-foreground">
            Track all scholarship deadlines and never miss an opportunity
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {monthNames[currentMonth]} {currentYear}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {deadlinesThisMonth.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No scholarship deadlines in {monthNames[currentMonth]} {currentYear}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deadlinesThisMonth.map((scholarship) => (
                      <Link key={scholarship.id} to={`/scholarships/${scholarship.id}`}>
                        <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center shrink-0">
                            <div className="text-2xl font-bold">
                              {scholarship.deadline.getDate()}
                            </div>
                            <div className="text-xs uppercase">
                              {monthNames[scholarship.deadline.getMonth()].slice(0, 3)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-1">{scholarship.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {scholarship.provider}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {scholarship.educationLevel}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {scholarship.location}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>All Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming deadlines
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((scholarship) => {
                      const daysUntil = Math.ceil(
                        (scholarship.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isUrgent = daysUntil <= 30;

                      return (
                        <Link key={scholarship.id} to={`/scholarships/${scholarship.id}`}>
                          <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            isUrgent ? 'border-red-200 bg-red-50' : 'hover:bg-muted/50'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`} />
                              <span className={`text-sm font-medium ${isUrgent ? 'text-red-600' : ''}`}>
                                {scholarship.deadline.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1 line-clamp-2">
                              {scholarship.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {daysUntil > 0 ? `${daysUntil} days remaining` : 'Deadline passed'}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
