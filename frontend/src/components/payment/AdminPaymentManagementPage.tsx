import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { useAuth } from '../../lib/auth-context';
import { PaymentApprovalDialog } from './PaymentApprovalDialog';
import { PaymentActionHistory, PaymentAction } from './PaymentActionHistory';
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

// Mock pending payments
const MOCK_PENDING_PAYMENTS = [
  {
    id: 'pay-003',
    userName: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    method: 'Bank Transfer',
    amount: 49000,
    createdAt: new Date('2026-04-03T08:30:00'),
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
  },
  {
    id: 'pay-004',
    userName: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@email.com',
    method: 'E-Wallet',
    amount: 490000,
    createdAt: new Date('2026-04-03T09:15:00'),
    proofUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
  },
];

// Mock payment action history
const MOCK_ACTIONS: PaymentAction[] = [
  {
    id: '1',
    paymentId: 'pay-001',
    action: 'approved',
    adminName: 'Admin ScholarPath',
    adminId: 'admin1',
    timestamp: new Date('2026-04-02T14:30:00'),
    validUntil: '12 Bulan (1 Tahun)',
    notes: 'Bukti pembayaran valid, transfer terverifikasi',
  },
  {
    id: '2',
    paymentId: 'pay-002',
    action: 'rejected',
    adminName: 'Admin ScholarPath',
    adminId: 'admin1',
    timestamp: new Date('2026-04-01T10:15:00'),
    reason: 'Bukti pembayaran tidak jelas, nominal tidak sesuai',
    notes: 'User diminta untuk upload ulang bukti pembayaran yang lebih jelas',
  },
];

export function AdminPaymentManagementPage() {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState(MOCK_PENDING_PAYMENTS);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [actionHistory, setActionHistory] = useState<PaymentAction[]>(MOCK_ACTIONS);

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

  const handleApprove = (paymentId: string, validUntil: string) => {
    const newAction: PaymentAction = {
      id: Date.now().toString(),
      paymentId,
      action: 'approved',
      adminName: user?.name || 'Admin',
      adminId: user?.id || '',
      timestamp: new Date(),
      validUntil,
    };
    setActionHistory(prev => [newAction, ...prev]);
    setSelectedPayment(null);
  };

  const handleReject = (paymentId: string, reason: string) => {
    const newAction: PaymentAction = {
      id: Date.now().toString(),
      paymentId,
      action: 'rejected',
      adminName: user?.name || 'Admin',
      adminId: user?.id || '',
      timestamp: new Date(),
      reason,
    };
    setActionHistory(prev => [newAction, ...prev]);
    setSelectedPayment(null);
  };

  const filteredPayments = pendingPayments.filter(payment =>
    payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
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
            {filteredPayments.length === 0 ? (
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
                          <a
                            href={payment.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Lihat Bukti Pembayaran →
                          </a>
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
    </div>
  );
}