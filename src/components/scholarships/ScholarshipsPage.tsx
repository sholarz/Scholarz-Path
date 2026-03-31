import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { scholarships, filterScholarships } from '../../lib/scholarship-data';
import { useBookmarks } from '../../lib/bookmark-context';
import { DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Calendar, MapPin, GraduationCap, Bookmark, BookmarkCheck } from 'lucide-react';

export function ScholarshipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [educationFilter, setEducationFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();

  const filteredScholarships = filterScholarships(
    searchQuery,
    educationFilter === 'all' ? undefined : educationFilter,
    fieldFilter === 'all' ? undefined : fieldFilter
  );

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
        {filteredScholarships.length === 0 ? (
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
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        toggleBookmark(scholarship.id);
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