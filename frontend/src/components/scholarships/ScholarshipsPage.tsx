import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { Header } from '../Header';
import { useBookmarks } from '../../lib/bookmark-context';
import { getScholarships, type Scholarship } from '../../lib/scholarship-api';
import { DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Calendar, MapPin, GraduationCap, Bookmark, BookmarkCheck, Loader2, AlertCircle } from 'lucide-react';

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Semua Jenjang' },
  { value: 'bachelor', label: 'S1 / Sarjana' },
  { value: 'master', label: 'S2 / Magister' },
  { value: 'doctorate', label: 'S3 / Doktor' },
  { value: 'postdoc', label: 'Pascadoktoral' },
];

function ScholarshipCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="flex gap-2">
        <div className="h-6 bg-muted rounded w-24" />
        <div className="h-6 bg-muted rounded w-20" />
      </div>
    </div>
  );
}

export function ScholarshipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toggleBookmark, isBookmarked } = useBookmarks();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [levelFilter]);

  const fetchScholarships = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getScholarships({
        search: debouncedSearch || undefined,
        level: levelFilter === 'all' ? undefined : levelFilter,
        page: currentPage,
        perPage: 15,
        sortBy: 'application_deadline',
        order: 'asc',
      });
      setScholarships(result.scholarships ?? []);
      setTotalCount(result.pagination?.total ?? 0);
      setLastPage(result.pagination?.lastPage ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data beasiswa.');
      setScholarships([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, levelFilter, currentPage]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Jelajahi Beasiswa</h1>
          <p className="text-muted-foreground">
            Temukan peluang beasiswa di seluruh Indonesia
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="scholarship-search"
                  type="text"
                  placeholder="Cari berdasarkan judul, deskripsi, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Select value={levelFilter} onValueChange={(v: string) => setLevelFilter(v)}>
                  <SelectTrigger id="level-filter">
                    <SelectValue placeholder="Jenjang Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? 'Memuat...'
                      : `${totalCount} beasiswa ditemukan`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-6 flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium">Gagal memuat data beasiswa</p>
                <p className="text-sm opacity-80">{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchScholarships}>
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scholarships Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ScholarshipCardSkeleton key={i} />
            ))}
          </div>
        ) : scholarships.length === 0 && !error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Tidak ada beasiswa yang sesuai dengan kriteria kamu. Coba ubah filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map(scholarship => (
                <Card
                  key={scholarship.id}
                  className="flex flex-col hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="flex-1 line-clamp-2">{scholarship.title}</CardTitle>
                      <Button
                        id={`bookmark-${scholarship.id}`}
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
                    <CardDescription className="line-clamp-1">
                      {scholarship.provider?.name ?? 'Penyedia Tidak Diketahui'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="space-y-2 text-sm">
                      {Array.isArray(scholarship.targetCountries) && scholarship.targetCountries.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {scholarship.targetCountries.join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          Batas akhir:{' '}
                          {new Date(scholarship.applicationDeadline).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {scholarship.formattedAmount && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span>{scholarship.formattedAmount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{scholarship.level}</Badge>
                      {scholarship.type && <Badge variant="secondary">{scholarship.type}</Badge>}
                      <DeadlineBadge deadline={new Date(scholarship.applicationDeadline)} />
                    </div>

                    {scholarship.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {scholarship.description}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Link to={`/scholarships/${scholarship.id}`} className="w-full">
                      <Button className="w-full">Lihat Detail</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {lastPage}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage >= lastPage || isLoading}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}