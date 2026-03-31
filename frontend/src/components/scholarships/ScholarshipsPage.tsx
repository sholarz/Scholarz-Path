import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { Scholarship } from '../../lib/scholarship-data';
import { useBookmarks } from '../../lib/bookmark-context';
import { DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Calendar, MapPin, GraduationCap, Bookmark, BookmarkCheck } from 'lucide-react';
import { getScholarships } from '../../api/scholarship';

const levelLabel: Record<string, string> = {
  high_school: 'High School',
  bachelor: 'Undergraduate',
  master: "Master's",
  doctorate: 'PhD',
  postdoc: 'Postdoc',
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return [value];
    }
  }

  return [];
};

const mapApiScholarship = (item: any): Scholarship => {
  const amount = item?.formatted_amount
    ?? item?.amount
    ?? (item?.amount ? `${item.currency ?? 'USD'} ${item.amount}` : 'Amount not specified');

  const deadlineSource = item?.application_deadline ?? item?.deadline ?? new Date().toISOString();

  return {
    id: String(item.id),
    title: item.title ?? 'Untitled Scholarship',
    provider: item?.provider?.name ?? item?.provider ?? 'Unknown Provider',
    country: item?.target_countries?.[0] ?? item?.country ?? 'Indonesia',
    location: item?.target_countries?.[0] ?? item?.location ?? 'Indonesia',
    amount,
    deadline: new Date(deadlineSource),
    educationLevel: item?.educationLevel ?? levelLabel[item.level] ?? item.level ?? 'All Levels',
    fieldOfStudy: toStringArray(item.fields_of_study ?? item.fieldOfStudy),
    type: item.type ?? 'General',
    description: item.description ?? '',
    requirements: toStringArray(item.requirements),
    benefits: toStringArray(item.benefits),
    applicationUrl: item.application_url ?? item.applicationUrl ?? '#',
    verified: Boolean(item?.provider),
  };
};

export function ScholarshipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [educationFilter, setEducationFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setIsLoading(true);
        const response = await getScholarships();
        const apiScholarships = response?.data?.data?.scholarships ?? response?.data ?? [];
        setScholarships(apiScholarships.map((item: any) => mapApiScholarship(item)));
      } catch (error) {
        console.error('Failed to fetch scholarships:', error);
        setScholarships([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScholarships();
  }, []);

  const filteredScholarships = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return scholarships.filter((scholarship) => {
      const matchesSearch =
        !search ||
        scholarship.title.toLowerCase().includes(search) ||
        scholarship.provider.toLowerCase().includes(search) ||
        scholarship.location.toLowerCase().includes(search) ||
        scholarship.description.toLowerCase().includes(search) ||
        scholarship.fieldOfStudy.some((field) => field.toLowerCase().includes(search));

      const matchesEducation =
        educationFilter === 'all' || scholarship.educationLevel === educationFilter;

      const matchesField =
        fieldFilter === 'all' || scholarship.fieldOfStudy.includes(fieldFilter);

      return matchesSearch && matchesEducation && matchesField;
    });
  }, [scholarships, searchQuery, educationFilter, fieldFilter]);

  const allFields = Array.from(
    new Set(scholarships.flatMap(s => s.fieldOfStudy))
  ).sort();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Browse Scholarships</h1>
          <p className="text-muted-foreground">
            Discover scholarship opportunities in Java, Indonesia
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, provider, location, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Select value={educationFilter} onValueChange={setEducationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Education Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="Master's">Master's</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Master's & PhD">Master's & PhD</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Field of Study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    {allFields.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    {filteredScholarships.length} scholarship{filteredScholarships.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scholarships Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading scholarships...</p>
            </CardContent>
          </Card>
        ) : filteredScholarships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No scholarships found matching your criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScholarships.map((scholarship) => (
              <Card key={scholarship.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="flex-1 line-clamp-2">{scholarship.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        try {
                          await toggleBookmark(scholarship.id);
                        } catch (error) {
                          console.error('Failed to toggle bookmark:', error);
                        }
                      }}
                    >
                      {isBookmarked(scholarship.id) ? (
                        <BookmarkCheck className="w-5 h-5 text-primary fill-primary" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Deadline: {scholarship.deadline.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>{scholarship.amount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{scholarship.educationLevel}</Badge>
                    <Badge variant="secondary">{scholarship.type}</Badge>
                    <DeadlineBadge deadline={scholarship.deadline} />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {scholarship.description}
                  </p>
                </CardContent>

                <CardFooter>
                  <Link to={`/scholarships/${scholarship.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}