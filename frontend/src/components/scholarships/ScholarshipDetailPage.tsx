import { useParams, useNavigate, Link } from 'react-router';
import { Header } from '../Header';
import { getScholarshipById } from '../../lib/scholarship-data';
import { useBookmarks } from '../../lib/bookmark-context';
import { NotificationSettings, DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const scholarship = id ? getScholarshipById(id) : undefined;

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Scholarship not found</p>
              <Button onClick={() => navigate('/scholarships')}>
                Back to Scholarships
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleBookmarkToggle = async () => {
    try {
      const wasBookmarked = isBookmarked(scholarship.id);
      await toggleBookmark(scholarship.id);
      toast.success(
        wasBookmarked
          ? 'Removed from bookmarks' 
          : 'Added to bookmarks'
      );
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const daysUntilDeadline = Math.ceil(
    (scholarship.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate('/scholarships')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scholarships
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="mb-3">{scholarship.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {scholarship.provider}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{scholarship.educationLevel}</Badge>
                  <Badge variant="secondary">{scholarship.type}</Badge>
                  {scholarship.verified && (
                    <Badge className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                  <DeadlineBadge deadline={scholarship.deadline} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={isBookmarked(scholarship.id) ? "default" : "outline"}
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
                <NotificationSettings scholarship={scholarship} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Information */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{scholarship.location}</p>
                  <p className="text-sm text-muted-foreground">{scholarship.country}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{scholarship.amount}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  daysUntilDeadline <= 30 ? 'bg-red-100' : 'bg-primary/10'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    daysUntilDeadline <= 30 ? 'text-red-600' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">
                    {scholarship.deadline.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilDeadline > 0 
                      ? `${daysUntilDeadline} days remaining` 
                      : 'Deadline passed'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="mb-3">About This Scholarship</h3>
              <p className="text-muted-foreground leading-relaxed">
                {scholarship.description}
              </p>
            </div>

            {/* Fields of Study */}
            <div>
              <h3 className="mb-3">Fields of Study</h3>
              <div className="flex flex-wrap gap-2">
                {scholarship.fieldOfStudy.map((field) => (
                  <Badge key={field} variant="outline">{field}</Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Requirements */}
            <div>
              <h3 className="mb-3">Requirements</h3>
              <ul className="space-y-2">
                {scholarship.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="mb-3">Benefits</h3>
              <ul className="space-y-2">
                {scholarship.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="flex-1">
                <a 
                  href={scholarship.applicationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Visit Application Page
                </a>
              </Button>
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