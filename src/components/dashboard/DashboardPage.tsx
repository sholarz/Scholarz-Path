import { Link, useNavigate } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { useBookmarks } from '../../lib/bookmark-context';
import { useNotifications, isDeadlineApproaching, isDeadlineOverdue, getDaysUntilDeadline } from '../../lib/notification-context';
import { scholarships } from '../../lib/scholarship-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Bookmark, Clock, TrendingUp, ArrowRight, Crown, Lock, Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useEffect } from 'react';
import { PremiumBadge } from '../PremiumFeatureLock';

export function DashboardPage() {
  const { user, isAuthenticated, upgradeToPremium } = useAuth();
  const { bookmarks, bookmarkLimit, canAddMore } = useBookmarks();
  const { preferences } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const bookmarkedScholarships = scholarships.filter(s => bookmarks.includes(s.id));
  
  // Get approaching deadlines from bookmarked scholarships
  const approachingDeadlines = bookmarkedScholarships
    .filter(s => {
      const days = getDaysUntilDeadline(s.deadline);
      return days >= 0 && days <= 7; // Within 7 days
    })
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const overdueBookmarks = bookmarkedScholarships
    .filter(s => isDeadlineOverdue(s.deadline));

  const upcomingDeadlines = scholarships
    .filter(s => s.deadline > new Date())
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 5);

  const activeNotifications = preferences.filter(p => p.emailEnabled).length;

  const stats = [
    {
      title: 'Total Scholarships',
      value: scholarships.length,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Bookmarked',
      value: bookmarkLimit ? `${bookmarks.length}/${bookmarkLimit}` : bookmarks.length,
      icon: Bookmark,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: bookmarkLimit && !canAddMore ? 'Limit reached' : undefined,
    },
    {
      title: 'Upcoming Deadlines',
      value: upcomingDeadlines.length,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Notifications',
      value: activeNotifications,
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1>Welcome back, {user?.name}!</h1>
            {user?.role === 'premium' && <PremiumBadge />}
            {user?.role === 'admin' && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Here's an overview of your scholarship journey
          </p>
        </div>

        {/* Urgent Deadline Alerts */}
        {(approachingDeadlines.length > 0 || overdueBookmarks.length > 0) && (
          <div className="mb-6 space-y-4">
            {overdueBookmarks.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-900">Overdue Deadlines</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-3">
                    {overdueBookmarks.length} bookmarked scholarship{overdueBookmarks.length !== 1 ? 's have' : ' has'} passed the deadline
                  </p>
                  <div className="space-y-2">
                    {overdueBookmarks.slice(0, 3).map(scholarship => (
                      <Link 
                        key={scholarship.id} 
                        to={`/scholarships/${scholarship.id}`}
                        className="block"
                      >
                        <div className="text-sm p-2 rounded bg-white hover:bg-red-100 transition-colors">
                          <p className="font-medium text-red-900">{scholarship.title}</p>
                          <p className="text-red-600 text-xs">
                            Deadline was {scholarship.deadline.toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {approachingDeadlines.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-yellow-900">Upcoming Deadlines</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-3">
                    {approachingDeadlines.length} bookmarked scholarship{approachingDeadlines.length !== 1 ? 's have' : ' has'} deadlines within 7 days
                  </p>
                  <div className="space-y-2">
                    {approachingDeadlines.map(scholarship => {
                      const days = getDaysUntilDeadline(scholarship.deadline);
                      return (
                        <Link 
                          key={scholarship.id} 
                          to={`/scholarships/${scholarship.id}`}
                          className="block"
                        >
                          <div className="text-sm p-2 rounded bg-white hover:bg-yellow-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-yellow-900">{scholarship.title}</p>
                              <Badge className="bg-yellow-500 text-white">
                                {days} day{days !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <p className="text-yellow-600 text-xs">
                              {scholarship.deadline.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Admin Notice */}
        {user?.role === 'admin' && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Crown className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Admin Access</h4>
                  <p className="text-sm text-blue-700">
                    You have full admin access to all features and scholarship management capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free User Upgrade Notice */}
        {user?.role === 'free' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-1">Unlock Premium Features</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Get unlimited bookmarks, automated preparation timeline, and more!
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Bookmark limit: {bookmarks.length}/{bookmarkLimit}
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Preparation Timeline locked
                      </li>
                    </ul>
                  </div>
                </div>
                <Button
                  onClick={upgradeToPremium}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white shrink-0"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-yellow-600 mt-1 font-medium">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Deadlines</CardTitle>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Don't miss these important dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming deadlines found
                </p>
              ) : (
                upcomingDeadlines.map((scholarship) => (
                  <Link key={scholarship.id} to={`/scholarships/${scholarship.id}`}>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 truncate">{scholarship.title}</h4>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {scholarship.provider}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{scholarship.deadline.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bookmarked Scholarships */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Bookmarks</CardTitle>
                <Link to="/bookmarks">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Scholarships you've saved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookmarkedScholarships.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't bookmarked any scholarships yet
                  </p>
                  <Link to="/scholarships">
                    <Button variant="outline" size="sm">
                      Browse Scholarships
                    </Button>
                  </Link>
                </div>
              ) : (
                bookmarkedScholarships.slice(0, 5).map((scholarship) => (
                  <Link key={scholarship.id} to={`/scholarships/${scholarship.id}`}>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                        <Bookmark className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 truncate">{scholarship.title}</h4>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {scholarship.location}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {scholarship.educationLevel}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/scholarships">
                <Button variant="outline" className="w-full h-full justify-start gap-3 p-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Browse Scholarships</p>
                    <p className="text-xs text-muted-foreground">Find new opportunities</p>
                  </div>
                </Button>
              </Link>
              
              <Link to="/calendar">
                <Button variant="outline" className="w-full h-full justify-start gap-3 p-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">View Calendar</p>
                    <p className="text-xs text-muted-foreground">Track all deadlines</p>
                  </div>
                </Button>
              </Link>
              
              <Link to="/timeline">
                <Button variant="outline" className="w-full h-full justify-start gap-3 p-4 relative">
                  {user?.role === 'free' && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 text-xs">
                        <Crown className="w-2.5 h-2.5 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Preparation Timeline</p>
                    <p className="text-xs text-muted-foreground">Plan your applications</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}