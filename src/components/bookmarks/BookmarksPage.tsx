import { Link } from 'react-router';
import { Header } from '../Header';
import { scholarships } from '../../lib/scholarship-data';
import { useBookmarks } from '../../lib/bookmark-context';
import { NotificationSettings, DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bookmark, Calendar, MapPin, GraduationCap, BookmarkX, Bell } from 'lucide-react';
import { toast } from 'sonner';

export function BookmarksPage() {
  const { bookmarks, removeBookmark } = useBookmarks();
  
  const bookmarkedScholarships = scholarships
    .filter(s => bookmarks.includes(s.id))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const handleRemoveBookmark = (scholarshipId: string, scholarshipTitle: string) => {
    removeBookmark(scholarshipId);
    toast.success(`Removed "${scholarshipTitle}" from bookmarks`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Your Bookmarks</h1>
          <p className="text-muted-foreground">
            {bookmarks.length} scholarship{bookmarks.length !== 1 ? 's' : ''} saved • Manage deadline notifications
          </p>
        </div>

        {bookmarkedScholarships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Bookmark className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2">No Bookmarks Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start bookmarking scholarships to keep track of opportunities you're interested in
              </p>
              <Link to="/scholarships">
                <Button>Browse Scholarships</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedScholarships.map((scholarship) => {
              const daysUntilDeadline = Math.ceil(
                (scholarship.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const isUrgent = daysUntilDeadline <= 30 && daysUntilDeadline > 0;

              return (
                <Card key={scholarship.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="flex-1 line-clamp-2">{scholarship.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveBookmark(scholarship.id, scholarship.title)}
                      >
                        <BookmarkX className="w-5 h-5" />
                      </Button>
                    </div>
                    <CardDescription className="line-clamp-1">{scholarship.provider}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{scholarship.location}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isUrgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {scholarship.deadline.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          {daysUntilDeadline > 0 && (
                            <span className="ml-1">
                              ({daysUntilDeadline} days left)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-4 h-4 shrink-0" />
                        <span>{scholarship.amount}</span>
                      </div>
                    </div>

                    {isUrgent && (
                      <Badge variant="destructive" className="w-fit">
                        Deadline Soon!
                      </Badge>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{scholarship.educationLevel}</Badge>
                      <Badge variant="secondary">{scholarship.type}</Badge>
                      <DeadlineBadge deadline={scholarship.deadline} />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {scholarship.description}
                    </p>
                  </CardContent>

                  <CardFooter className="flex-col gap-2">
                    <NotificationSettings scholarship={scholarship} />
                    <Link to={`/scholarships/${scholarship.id}`} className="w-full">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}