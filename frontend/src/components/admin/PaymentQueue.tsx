import { useState } from 'react';
import { Search, Filter, Download, ChevronDown, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import { formatCurrency } from '../../lib/utils';

export interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'premium';
  amount: number;
  paymentMethod: string;
  submittedAt: Date;
  referenceNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl: string;
  userNote?: string;
  processedBy?: string;
  processedAt?: Date;
  rejectionReason?: string;
}

// Mock data
const MOCK_PAYMENTS: PaymentSubmission[] = [
  {
    id: 'PAY001',
    userId: 'user001',
    userName: 'Budi Santoso',
    userEmail: 'budi.santoso@email.com',
    plan: 'premium',
    amount: 300000,
    paymentMethod: 'Bank Transfer (BCA)',
    submittedAt: new Date('2026-04-03T10:30:00'),
    referenceNumber: 'TRX20260403001',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1554224311-beee4c27c98d?w=800',
    userNote: 'Sudah transfer pagi ini jam 09.00 WIB',
  },
  {
    id: 'PAY002',
    userId: 'user002',
    userName: 'Siti Nurhaliza',
    userEmail: 'siti.nurhaliza@email.com',
    plan: 'premium',
    amount: 300000,
    paymentMethod: 'E-Wallet (GoPay)',
    submittedAt: new Date('2026-04-03T09:15:00'),
    referenceNumber: 'TRX20260403002',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    userNote: 'Pembayaran melalui GoPay',
  },
  {
    id: 'PAY003',
    userId: 'user003',
    userName: 'Ahmad Fauzi',
    userEmail: 'ahmad.fauzi@email.com',
    plan: 'premium',
    amount: 300000,
    paymentMethod: 'Bank Transfer (Mandiri)',
    submittedAt: new Date('2026-04-02T15:45:00'),
    referenceNumber: 'TRX20260402001',
    status: 'approved',
    proofUrl: 'https://images.unsplash.com/photo-1554224311-beee4c27c98d?w=800',
    processedBy: 'Admin',
    processedAt: new Date('2026-04-02T16:00:00'),
  },
  {
    id: 'PAY004',
    userId: 'user004',
    userName: 'Dewi Lestari',
    userEmail: 'dewi.lestari@email.com',
    plan: 'premium',
    amount: 300000,
    paymentMethod: 'E-Wallet (OVO)',
    submittedAt: new Date('2026-04-02T14:20:00'),
    referenceNumber: 'TRX20260402002',
    status: 'rejected',
    proofUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    processedBy: 'Admin',
    processedAt: new Date('2026-04-02T14:30:00'),
    rejectionReason: 'Bukti pembayaran tidak jelas',
  },
  {
    id: 'PAY005',
    userId: 'user005',
    userName: 'Rizki Ramadhan',
    userEmail: 'rizki.ramadhan@email.com',
    plan: 'premium',
    amount: 300000,
    paymentMethod: 'QRIS',
    submittedAt: new Date('2026-04-03T08:00:00'),
    referenceNumber: 'TRX20260403003',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
  },
];

export function PaymentQueue() {
  const [payments, setPayments] = useState<PaymentSubmission[]>(MOCK_PAYMENTS);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter payments
  const filteredPayments = payments
    .filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (methodFilter !== 'all' && !p.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase())) return false;
      if (searchQuery && !p.userName.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const handleViewDetails = (payment: PaymentSubmission) => {
    setSelectedPayment(payment);
    setDrawerOpen(true);
  };

  const handleApprove = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? { ...p, status: 'approved', processedBy: 'Admin', processedAt: new Date() }
          : p
      )
    );
    setDrawerOpen(false);
  };

  const handleReject = (paymentId: string, reason: string) => {
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? { ...p, status: 'rejected', processedBy: 'Admin', processedAt: new Date(), rejectionReason: reason }
          : p
      )
    );
    setDrawerOpen(false);
  };

  const getStatusBadge = (status: PaymentSubmission['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const approvedCount = payments.filter(p => p.status === 'approved').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or reference number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="wallet">E-Wallet</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No payments found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'No payments match your filters. Try adjusting your search criteria.'
                  : 'No payment submissions yet. Payments will appear here when users submit them.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.userName}</p>
                          <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                          Premium
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{payment.paymentMethod}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {payment.submittedAt.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.submittedAt.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.referenceNumber}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Drawer */}
      {selectedPayment && (
        <PaymentDetailDrawer
          payment={selectedPayment}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
