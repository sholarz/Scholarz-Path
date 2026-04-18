import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { useAuth } from '../../lib/auth-context';
import { PaymentApprovalDialog } from './PaymentApprovalDialog';
import { PaymentActionHistory, PaymentAction } from './PaymentActionHistory';
import { ApiError, apiGet, apiPut } from '../../lib/api-client';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatCurrency } from '../../lib/utils';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AdminLayout } from '../admin/AdminLayout';

type BackendPayment = {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_proof_url?: string | null;
  payment_note?: string | null;
  admin_note?: string | null;
  reviewed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
  };
  plan?: {
    name?: string;
    price?: number;
  };
};

type PaymentView = {
  id: string;
  userName: string;
  email: string;
  method: string;
  amount: number;
  createdAt: Date;
  proofUrl: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  adminNote?: string;
  reviewedAt?: Date;
  expiresAt?: Date;
};

function deriveUserName(payment: BackendPayment): string {
  const email = payment.user?.email || '';
  if (!email.includes('@')) {
    return 'Unknown User';
  }

  return email.split('@')[0];
}

function mapBackendPayment(row: BackendPayment): PaymentView {
  return {
    id: row.id,
    userName: deriveUserName(row),
    email: row.user?.email || 'unknown@email.com',
    method: row.payment_method || 'Unknown',
    amount: Number(row.plan?.price || 0),
    createdAt: new Date(row.created_at),
    proofUrl: row.payment_proof_url || '#',
    status: row.status,
    adminNote: row.admin_note || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

function mapReviewedToAction(payment: PaymentView, adminName: string, adminId: string): PaymentAction | null {
  if (payment.status !== 'confirmed' && payment.status !== 'rejected') {
    return null;
  }

  return {
    id: payment.id,
    paymentId: payment.id,
    action: payment.status === 'confirmed' ? 'approved' : 'rejected',
    adminName,
    adminId,
    timestamp: payment.reviewedAt || payment.createdAt,
    reason: payment.status === 'rejected' ? payment.adminNote : undefined,
    validUntil: payment.status === 'confirmed' && payment.expiresAt
      ? payment.expiresAt.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : undefined,
    notes: payment.adminNote,
  };
}

export function AdminPaymentManagementPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentView | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  const loadPayments = async (status?: 'pending' | 'confirmed' | 'rejected') => {
    setIsLoading(true);
    try {
      const query = status ? `?status=${status}` : '';
      const payload = await apiGet<{ payments?: { data?: BackendPayment[] } | BackendPayment[] }>(`/admin/payments${query}`);

      let rows: BackendPayment[] = [];
      if (Array.isArray(payload?.payments)) {
        rows = payload.payments;
      } else if (Array.isArray((payload as any)?.payments?.data)) {
        rows = (payload as any).payments.data;
      }

      setPayments(rows.map(mapBackendPayment));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Gagal memuat pembayaran';
      toast.error(message);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadPayments();
    }
  }, [user?.role]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-4">
            Halaman ini hanya dapat diakses oleh admin.
          </p>
          <Link to="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = async (paymentId: string, validUntil: string) => {
    try {
      await apiPut(`/admin/payments/${paymentId}/review`, {
        decision: 'confirmed',
        admin_note: `Subscription duration: ${validUntil}`,
        duration: validUntil,
      });

      toast.success('Pembayaran disetujui dan role user diupgrade di server');
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Gagal menyetujui pembayaran';
      toast.error(message);
    }
  };

  const handleReject = async (paymentId: string, reason: string) => {
    try {
      await apiPut(`/admin/payments/${paymentId}/review`, {
        decision: 'rejected',
        admin_note: reason,
      });

      toast.success('Pembayaran ditolak');
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Gagal menolak pembayaran';
      toast.error(message);
    }
  };

  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === 'pending'),
    [payments]
  );

  const actionHistory = useMemo(() => {
    const adminName = user?.name || 'Admin';
    const adminId = user?.id || '';

    return payments
      .map((payment) => mapReviewedToAction(payment, adminName, adminId))
      .filter((entry): entry is PaymentAction => entry !== null)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [payments, user?.id, user?.name]);

  const filteredPayments = pendingPayments.filter(payment =>
    payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Manajemen Pembayaran</h1>
            <p className="text-muted-foreground">
              Verifikasi dan kelola pembayaran premium users
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <div className="text-sm text-muted-foreground">Pending Verification</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disetujui</p>
                  <p className="text-2xl font-bold">
                    {actionHistory.filter(a => a.action === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ditolak</p>
                  <p className="text-2xl font-bold">
                    {actionHistory.filter(a => a.action === 'rejected').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tindakan</p>
                  <p className="text-2xl font-bold">{actionHistory.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Riwayat Tindakan ({actionHistory.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Payments */}
          <TabsContent value="pending" className="space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payments List */}
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Memuat pembayaran...</p>
                </CardContent>
              </Card>
            ) : filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchQuery
                      ? 'Tidak ada hasil pencarian'
                      : 'Tidak ada pembayaran yang perlu diverifikasi'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPayments.map(payment => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                          <Badge variant="secondary">{payment.method}</Badge>
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          {payment.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {payment.email}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Jumlah</p>
                            <p className="font-semibold text-lg">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Waktu Upload</p>
                            <p>
                              {formatDistanceToNow(payment.createdAt, {
                                addSuffix: true,
                                locale: localeId,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          {payment.proofUrl !== '#' ? (
                            <a
                              href={payment.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Lihat Bukti Pembayaran →
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">Bukti pembayaran belum diunggah</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedPayment(payment)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Tinjau
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Action History */}
          <TabsContent value="history">
            <PaymentActionHistory actions={actionHistory} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Dialog */}
      {selectedPayment && (
        <PaymentApprovalDialog
          payment={selectedPayment}
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onApprove={(validUntil) => handleApprove(selectedPayment.id, validUntil)}
          onReject={(reason) => handleReject(selectedPayment.id, reason)}
        />
      )}
    </AdminLayout>
  );
}