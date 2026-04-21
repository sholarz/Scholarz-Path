import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../Header';
import { useAuth } from '../../lib/auth-context';
import { PaymentQueue } from './PaymentQueue';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function AdminPaymentPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dasbor
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Verifikasi Pembayaran</h1>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              Khusus Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Tinjau dan verifikasi pengajuan pembayaran langganan premium
          </p>
        </div>

        {/* Payment Queue */}
        <PaymentQueue />
      </main>
    </div>
  );
}
