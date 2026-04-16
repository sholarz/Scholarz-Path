import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Header } from '../Header';
import { getScholarshipById, type Scholarship as ApiScholarship } from '../../lib/scholarship-api';
import { useBookmarks } from '../../lib/bookmark-context';
import { NotificationSettings, DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  MapPin,
  GraduationCap,
  CheckCircle,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type NotificationScholarship = {
  id: string;
  title: string;
  provider: string;
  country: string;
  location: string;
  amount: string;
  deadline: Date;
  educationLevel: string;
  fieldOfStudy: string[];
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applicationUrl: string;
  verified: boolean;
};

const toNotificationScholarship = (scholarship: ApiScholarship): NotificationScholarship => ({
  id: scholarship.id,
  title: scholarship.title,
  provider: scholarship.provider?.name ?? 'Unknown Provider',
  country: scholarship.provider?.country ?? '-',
  location: scholarship.targetCountries?.join(', ') || scholarship.provider?.country || '-',
  amount: scholarship.formattedAmount || (scholarship.amount != null ? `${scholarship.currency ?? 'USD'} ${scholarship.amount}` : 'Amount not specified'),
  deadline: new Date(scholarship.applicationDeadline),
  educationLevel: scholarship.level,
  fieldOfStudy: scholarship.fieldsOfStudy ?? [],
  type: scholarship.type ?? '-',
  description: scholarship.description ?? '',
  requirements: scholarship.requirements ?? [],
  benefits: scholarship.benefits ?? [],
  applicationUrl: scholarship.applicationUrl ?? '',
  verified: scholarship.status === 'active',
});

export function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [scholarship, setScholarship] = useState<ApiScholarship | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setScholarship(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getScholarshipById(id);
        setScholarship(data.scholarship);
      } catch (err) {
        setScholarship(null);
        toast.error(err instanceof Error ? err.message : 'Failed to load scholarship');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  const notificationScholarship = useMemo(
    () => (scholarship ? toNotificationScholarship(scholarship) : null),
    [scholarship]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading scholarship details...
        </main>
      </div>
    );
  }

  if (!scholarship || !notificationScholarship) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Scholarship not found</p>
              <Button onClick={() => navigate('/scholarships')}>Back to Scholarships</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const deadline = new Date(scholarship.applicationDeadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const handleBookmarkToggle = () => {
    toggleBookmark(scholarship.id);
    toast.success(isBookmarked(scholarship.id) ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate('/scholarships')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Scholarships
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="mb-3">{scholarship.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">{scholarship.provider?.name ?? 'Unknown Provider'}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{scholarship.level}</Badge>
                  {scholarship.type ? <Badge variant="secondary">{scholarship.type}</Badge> : null}
                  {scholarship.status === 'active' ? (
                    <Badge className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  ) : null}
                  <DeadlineBadge deadline={deadline} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={isBookmarked(scholarship.id) ? 'default' : 'outline'}
                  size="lg"
                  className="gap-2 shrink-0"
                  onClick={handleBookmarkToggle}
                >
                  {isBookmarked(scholarship.id) ? (
                    <>
                      <BookmarkCheck className="w-5 h-5" />
                      Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-5 h-5" />
                      Bookmark
                    </>
                  )}
                </Button>
                <NotificationSettings scholarship={notificationScholarship} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Countries</p>
                  <p className="font-medium">{scholarship.targetCountries?.join(', ') || scholarship.provider?.country || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{scholarship.formattedAmount || 'Amount not specified'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${daysUntilDeadline <= 30 ? 'bg-red-100' : 'bg-primary/10'}`}>
                  <Calendar className={`w-5 h-5 ${daysUntilDeadline <= 30 ? 'text-red-600' : 'text-primary'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">{deadline.toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : 'Deadline passed'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3">About This Scholarship</h3>
              <p className="text-muted-foreground leading-relaxed">{scholarship.description || 'No description available.'}</p>
            </div>

            <div>
              <h3 className="mb-3">Fields of Study</h3>
              <div className="flex flex-wrap gap-2">
                {(scholarship.fieldsOfStudy ?? []).map((field) => (
                  <Badge key={field} variant="outline">{field}</Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3">Requirements</h3>
              <ul className="space-y-2">
                {(scholarship.requirements ?? []).map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3">Benefits</h3>
              <ul className="space-y-2">
                {(scholarship.benefits ?? []).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-4">
              {scholarship.applicationUrl ? (
                <Button asChild size="lg" className="flex-1">
                  <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Visit Application Page
                  </a>
                </Button>
              ) : null}
              <Link to="/timeline" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Clock className="w-5 h-5" />
                  View Preparation Timeline
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
