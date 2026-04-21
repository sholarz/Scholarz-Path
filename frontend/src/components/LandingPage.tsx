import { Link } from 'react-router';
import { Header } from './Header';
import { Button } from './ui/button';
import { GraduationCap, Search, Calendar, Bookmark, CheckCircle, Clock, Globe } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function LandingPage() {
  const features = [
    {
      icon: Search,
      title: 'Beasiswa Terkurasi',
      description: 'Akses beasiswa terkurasi untuk kampus terbaik di seluruh Indonesia',
    },
    {
      icon: Calendar,
      title: 'Kalender Beasiswa',
      description: 'Jangan lewatkan tenggat penting dengan tampilan kalender yang lengkap',
    },
    {
      icon: Clock,
      title: 'Timeline Persiapan',
      description: 'Timeline otomatis membantu kamu menyusun semua tugas sebelum tenggat',
    },
    {
      icon: Bookmark,
      title: 'Simpan & Pantau',
      description: 'Simpan dan kelola beasiswa yang ingin kamu daftar',
    },
    {
      icon: CheckCircle,
      title: 'Informasi Terverifikasi',
      description: 'Semua data beasiswa diverifikasi dan diperbarui secara berkala',
    },
    {
      icon: Globe,
      title: 'Fokus Indonesia',
      description: 'Dirancang untuk pencarian peluang beasiswa di Indonesia',
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Jalurmu Mencari Beasiswa di Indonesia</span>
          </div>
          
          <h1 className="mb-6 max-w-4xl mx-auto">Temukan Beasiswa Terbaik untuk Studi di Indonesia</h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cari beasiswa, pantau tenggat, dan siapkan pendaftaranmu dengan timeline otomatis.
            Semua yang kamu butuhkan untuk kuliah di kampus terbaik Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Mulai Gratis
              </Button>
            </Link>
            <Link to="/scholarships">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Jelajahi Beasiswa
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Gratis selamanya. Tanpa kartu kredit.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Semua yang Kamu Butuhkan untuk Berhasil</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ScholarPath menyediakan alat lengkap untuk mencari, memantau, dan mendaftar beasiswa di Indonesia dengan lebih efisien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2">
                <CardContent className="pt-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="mb-4">Siap Memulai Perjalananmu?</h2>
          <p className="text-lg mb-8 opacity-90">
            Bergabung dengan ribuan pelajar yang menggunakan ScholarPath untuk meraih tujuan pendidikan di Indonesia.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary">
              Buat Akun Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ScholarPath. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}