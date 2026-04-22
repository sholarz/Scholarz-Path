import { useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { useBookmarks } from '../../lib/bookmark-context';
import { performMatching, type ScholarshipMatch } from '../../lib/matching-api';
import { DeadlineBadge } from '../NotificationSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, AlertCircle, Sparkles, TrendingUp, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [matches, setMatches] = useState<ScholarshipMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchUsageLabel, setMatchUsageLabel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');

  const runMatching = useCallback(async () => {
    if (!isAuthenticated) {
      setMatchingError('Silakan masuk untuk melihat rekomendasi beasiswa.');
      return;
    }

    setIsMatching(true);
    setMatchingError(null);

    try {
      const result = await performMatching();
      setMatches(result.matches);

      if (result.usage?.dailyLimit != null) {
        setMatchUsageLabel(
          `Penggunaan paket gratis: ${result.usage.usedToday}/${result.usage.dailyLimit} hari ini`
        );
      } else {
        setMatchUsageLabel('Paket premium: pencocokan tanpa batas');
      }

      if (result.matches.length === 0) {
        toast.info('Tidak ada rekomendasi saat ini. Lengkapi profil Anda untuk hasil yang lebih baik.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menjalankan pencocokan beasiswa.';
      if (errorMessage.includes('429')) {
        setMatchingError('Batas pencocokan harian paket gratis sudah tercapai. Coba lagi besok atau upgrade untuk akses tanpa batas.');
      } else {
        setMatchingError(errorMessage);
      }
      setMatches([]);
    } finally {
      setIsMatching(false);
    }
  }, [isAuthenticated]);

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'match') {
      return b.matchScore - a.matchScore;
    } else {
      const deadlineA = new Date(a.scholarship.applicationDeadline || '').getTime();
      const deadlineB = new Date(b.scholarship.applicationDeadline || '').getTime();
      return deadlineA - deadlineB;
    }
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1>Rekomendasi Beasiswa</h1>
          </div>
          <p className="text-muted-foreground">
            Beasiswa yang direkomendasikan berdasarkan profil dan kriteria kelayakan Anda
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={runMatching}
            disabled={isMatching}
            className="flex-shrink-0"
          >
            {isMatching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sedang Mencari...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Jalankan Pencocokan
              </>
            )}
          </Button>

          {matches.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'match' ? 'default' : 'outline'}
                onClick={() => setSortBy('match')}
              >
                Urutkan Kecocokan
              </Button>
              <Button
                variant={sortBy === 'deadline' ? 'default' : 'outline'}
                onClick={() => setSortBy('deadline')}
              >
                Urutkan Tenggat
              </Button>
            </div>
          )}
        </div>

        {/* Usage Info */}
        {matchUsageLabel && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-blue-900">{matchUsageLabel}</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {matchingError && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-6 flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium">Gagal menjalankan pencocokan</p>
                <p className="text-sm opacity-80">{matchingError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={runMatching}>
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isMatching && matches.length === 0 && !matchingError && (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Belum ada hasil pencocokan. Klik tombol di atas untuk memulai.
              </p>
              {user?.role === 'free' && (
                <p className="text-sm text-muted-foreground mb-4">
                  Paket gratis dibatasi 1 kali pencocokan per hari.
                </p>
              )}
              <Link to="/profile">
                <Button variant="outline">Lengkapi Profil</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Grid */}
        {sortedMatches.length > 0 && (
          <div className="grid gap-6">
            {sortedMatches.map((match) => (
              <Card key={match.scholarship.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{match.scholarship.title}</CardTitle>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600">
                          {Math.round(match.matchScore)}% Cocok
                        </Badge>
                      </div>
                      <CardDescription>
                        {match.scholarship.provider?.name || 'Penyedia tidak diketahui'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(match.scholarship.id)}
                      className={isBookmarked(match.scholarship.id) ? 'text-primary' : ''}
                    >
                      {isBookmarked(match.scholarship.id) ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm font-medium text-green-900 mb-2">Kriteria Terpenuhi</p>
                      <ul className="text-sm text-green-800 space-y-1">
                        {match.criteriaMet.length > 0 ? (
                          match.criteriaMet.map((criterion, idx) => (
                            <li key={idx}>✓ {criterion}</li>
                          ))
                        ) : (
                          <li>Tidak ada kriteria terpenuhi</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-sm font-medium text-amber-900 mb-2">Kriteria Kurang</p>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {match.criteriaMissing.length > 0 ? (
                          match.criteriaMissing.map((criterion, idx) => (
                            <li key={idx}>◆ {criterion}</li>
                          ))
                        ) : (
                          <li>Semua kriteria terpenuhi!</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {match.recommendations && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">Saran & Panduan</p>
                      <p className="text-sm text-blue-800">{match.recommendations}</p>
                    </div>
                  )}

                  {/* Scholarship Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t">
                    {match.scholarship.applicationDeadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="text-muted-foreground">Tenggat</p>
                          <DeadlineBadge deadline={new Date(match.scholarship.applicationDeadline)} />
                        </div>
                      </div>
                    )}
                    
                    {match.scholarship.targetCountries?.[0] && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="text-muted-foreground">Lokasi</p>
                          <p className="font-medium">{match.scholarship.targetCountries[0]}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/scholarships/${match.scholarship.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        Lihat Detail
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
