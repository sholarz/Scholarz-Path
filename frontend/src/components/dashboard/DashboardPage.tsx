import { Link, useNavigate } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { usePayment } from '../../lib/payment-context';
import { useBookmarks } from '../../lib/bookmark-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Bookmark, Clock, TrendingUp, ArrowRight, Crown, Lock, Bell } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import { PremiumBadge } from '../PremiumFeatureLock';
import { getTestHistory, type TestHistorySummary } from '../../lib/test-prep-api';
import { getDashboardData, type DashboardData } from '../../lib/dashboard-api';
import { getBookmarks, type BookmarkedScholarship } from '../../lib/scholarship-api';

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { openPaymentFlow } = usePayment();
  const { bookmarks, bookmarkLimit, canAddMore } = useBookmarks();
  const navigate = useNavigate();
  const [testSummary, setTestSummary] = useState<TestHistorySummary | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bookmarkedScholarships, setBookmarkedScholarships] = useState<BookmarkedScholarship[]>([]);
  const [bookmarkTotal, setBookmarkTotal] = useState<number>(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboardData = async () => {
      setDashboardLoading(true);

      try {
        const [testPayload, dashboardPayload, bookmarksPayload] = await Promise.all([
          getTestHistory(),
          getDashboardData(),
          getBookmarks(),
        ]);

        setTestSummary(testPayload.summary);
        setDashboardData(dashboardPayload);
        setBookmarkedScholarships(bookmarksPayload.scholarships);
        setBookmarkTotal(bookmarksPayload.pagination.total);
      } catch {
        setTestSummary(null);
        setDashboardData(null);
        setBookmarkedScholarships([]);
        setBookmarkTotal(0);
      } finally {
        setDashboardLoading(false);
      }
    };

    void loadDashboardData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const approachingDeadlines = (dashboardData?.upcomingDeadlines ?? []).filter(item => item.daysUntilDeadline <= 7);

  const displayedBookmarkCount = bookmarkTotal || bookmarks.length;

  const stats = [
    {
      title: 'Rekomendasi Teratas',
      value: dashboardData?.topMatches.length ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Tersimpan',
      value: bookmarkLimit ? `${displayedBookmarkCount}/${bookmarkLimit}` : displayedBookmarkCount,
      icon: Bookmark,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: bookmarkLimit && !canAddMore ? 'Batas tercapai' : undefined,
    },
    {
      title: 'Tenggat Mendatang',
      value: dashboardData?.upcomingDeadlines.length ?? 0,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Notifikasi Aktif',
      value: dashboardData?.activeNotificationsCount ?? 0,
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
            <h1>Selamat datang kembali, {user?.name}!</h1>
            {user?.role === 'premium' && <PremiumBadge />}
            {user?.role === 'admin' && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Berikut ringkasan perjalanan beasiswa kamu
          </p>
        </div>

        {/* Urgent Deadline Alerts */}
        {approachingDeadlines.length > 0 && (
          <div className="mb-6 space-y-4">
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  <CardTitle className="text-yellow-900">Tenggat Mendatang</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 mb-3">
                  {approachingDeadlines.length} beasiswa tersimpan memiliki tenggat dalam 7 hari ke depan
                </p>
                <div className="space-y-2">
                  {approachingDeadlines.map((deadline) => (
                    <Link
                      key={deadline.scholarshipId}
                      to={`/scholarships/${deadline.scholarshipId}`}
                      className="block"
                    >
                      <div className="text-sm p-2 rounded bg-white hover:bg-yellow-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-yellow-900">{deadline.title}</p>
                          <Badge className="bg-yellow-500 text-white">
                            {deadline.daysUntilDeadline} hari
                          </Badge>
                        </div>
                        <p className="text-yellow-600 text-xs">
                          {new Date(deadline.applicationDeadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <h4 className="font-medium text-blue-900 mb-1">Akses Admin</h4>
                  <p className="text-sm text-blue-700">
                    Kamu memiliki akses admin penuh untuk semua fitur dan manajemen beasiswa.
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
                    <h4 className="font-medium text-yellow-900 mb-1">Buka Fitur Premium</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Dapatkan bookmark tanpa batas, timeline persiapan otomatis, dan banyak lagi!
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Batas bookmark: {displayedBookmarkCount}/{bookmarkLimit}
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Timeline persiapan terkunci
                      </li>
                    </ul>
                  </div>
                </div>
                <Button
                  onClick={openPaymentFlow}
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

        {dashboardLoading && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50/40">
            <CardContent className="pt-6 text-sm text-yellow-800">Memuat data dasbor dari backend...</CardContent>
          </Card>
        )}

        {/* Test Performance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performa Tes</CardTitle>
                <CardDescription>Ringkasan hasil tes terbaru</CardDescription>
              </div>
              <Link to="/tests">
                <Button variant="ghost" size="sm" className="gap-2">
                  Lihat Riwayat Tes
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!testSummary || testSummary.total_attempts === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada riwayat tes.</p>
            ) : (
              <div className="grid md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Percobaan</p>
                  <p className="text-2xl font-bold">{testSummary.total_attempts}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Lulus</p>
                  <p className="text-2xl font-bold text-green-600">{testSummary.passed_attempts}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Nilai Terbaik</p>
                  <p className="text-2xl font-bold">{testSummary.best_score}%</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Nilai Terakhir</p>
                  <p className="text-2xl font-bold">{testSummary.last_score ?? '-'}{testSummary.last_score !== null ? '%' : ''}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenggat Mendatang</CardTitle>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm" className="gap-2">
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Jangan lewatkan tanggal penting berikut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(dashboardData?.upcomingDeadlines.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada tenggat dalam waktu dekat
                </p>
              ) : (
                (dashboardData?.upcomingDeadlines ?? []).map((deadline) => (
                  <Link key={deadline.scholarshipId} to={`/scholarships/${deadline.scholarshipId}`}>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 truncate">{deadline.title}</h4>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          Tenggat dalam {deadline.daysUntilDeadline} hari
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(deadline.applicationDeadline).toLocaleDateString('id-ID', {
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
                <CardTitle>Beasiswa Tersimpan</CardTitle>
                <Link to="/bookmarks">
                  <Button variant="ghost" size="sm" className="gap-2">
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Daftar beasiswa yang sudah kamu simpan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookmarkedScholarships.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Kamu belum menyimpan beasiswa apa pun
                  </p>
                  <Link to="/scholarships">
                    <Button variant="outline" size="sm">
                      Jelajahi Beasiswa
                    </Button>
                  </Link>
                </div>
              ) : (
                bookmarkedScholarships.slice(0, 5).map((item) => (
                  <Link key={item.scholarship.id} to={`/scholarships/${item.scholarship.id}`}>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                        <Bookmark className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 truncate">{item.scholarship.title}</h4>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {item.scholarship.provider?.name ?? 'Beasiswa'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.scholarship.level}
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
                    <p className="font-medium">Jelajahi Beasiswa</p>
                    <p className="text-xs text-muted-foreground">Temukan peluang baru di Indonesia</p>
                  </div>
                </Button>
              </Link>
              
              <Link to="/calendar">
                <Button variant="outline" className="w-full h-full justify-start gap-3 p-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Lihat Kalender</p>
                    <p className="text-xs text-muted-foreground">Pantau semua tenggat</p>
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
                    <p className="font-medium">Timeline Persiapan</p>
                    <p className="text-xs text-muted-foreground">Rencanakan pendaftaranmu</p>
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