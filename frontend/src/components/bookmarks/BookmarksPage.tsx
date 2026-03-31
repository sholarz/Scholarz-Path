import { Link } from 'react-router';
import { Header } from '../Header';
import { useBookmarks } from '../../lib/bookmark-context';
import { NotificationSettings, DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bookmark, Calendar, MapPin, GraduationCap, BookmarkX, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getBookmarks } from '../../api/scholarship';

interface BookmarkedScholarship {
  id: string | number;
  title: string;
  provider: string;
  location: string;
  amount: string;
  application_deadline: string;
  level: string;
  type: string;
  description: string;
}

export function BookmarksPage() {
  const { removeBookmark, isLoading } = useBookmarks();
  const [bookmarkedScholarships, setBookmarkedScholarships] = useState<BookmarkedScholarship[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookmarks from API
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await getBookmarks();
        setBookmarkedScholarships(response.data.data.scholarships);
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error);
        toast.error('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (scholarshipId: string | number, scholarshipTitle: string) => {
    try {
      await removeBookmark(String(scholarshipId));
      setBookmarkedScholarships(prev => prev.filter(s => s.id !== scholarshipId));
      toast.success(`Removed "${scholarshipTitle}" from bookmarks`);
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const sortedScholarships = [...bookmarkedScholarships].sort((a, b) => {
    const dateA = new Date(a.application_deadline).getTime();
    const dateB = new Date(b.application_deadline).getTime();
    return dateA - dateB;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading bookmarks...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Your Bookmarks</h1>
          <p className="text-muted-foreground">
            {bookmarkedScholarships.length} scholarship{bookmarkedScholarships.length !== 1 ? 's' : ''} saved • Manage deadline notifications
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
            {sortedScholarships.map((scholarship) => {
              const deadline = new Date(scholarship.application_deadline);
              const daysUntilDeadline = Math.ceil(
                (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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
                        disabled={isLoading}
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
                          {deadline.toLocaleDateString('en-US', { 
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
                      <Badge variant="outline">{scholarship.level}</Badge>
                      <Badge variant="secondary">{scholarship.type}</Badge>
                      <DeadlineBadge deadline={deadline} />
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