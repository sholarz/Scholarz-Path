import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  ChevronDown,
  Loader2,
  FileX
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

/**
 * PAYMENT QUEUE TABLE - DEVELOPER NOTES
 * 
 * Mock Data Structure:
 * interface Payment {
 *   id: string;
 *   userId: string;
 *   userName: string;
 *   userEmail: string;
 *   userAvatar?: string;
 *   plan: 'premium-monthly' | 'premium-yearly';
 *   amount: number;
 *   paymentMethod: 'bank-transfer' | 'e-wallet' | 'retail';
 *   submittedAt: string; // ISO date string
 *   referenceNumber: string;
 *   status: 'pending' | 'approved' | 'rejected';
 *   proofUrl: string;
 *   userNote?: string;
 * }
 */

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  plan: 'premium-monthly' | 'premium-yearly';
  amount: number;
  paymentMethod: 'bank-transfer' | 'e-wallet' | 'retail';
  submittedAt: string;
  referenceNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl: string;
  userNote?: string;
}

interface PaymentQueueTableProps {
  onViewDetails: (payment: Payment) => void;
}

// Mock data
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY001',
    userId: 'USR001',
    userName: 'Budi Santoso',
    userEmail: 'budi.santoso@email.com',
    plan: 'premium-monthly',
    amount: 49000,
    paymentMethod: 'bank-transfer',
    submittedAt: '2026-04-03T08:30:00Z',
    referenceNumber: 'BCA20260403001',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    userNote: 'Transfer dari BCA a.n. Budi Santoso',
  },
  {
    id: 'PAY002',
    userId: 'USR002',
    userName: 'Siti Nurhaliza',
    userEmail: 'siti.nurhaliza@email.com',
    plan: 'premium-yearly',
    amount: 490000,
    paymentMethod: 'e-wallet',
    submittedAt: '2026-04-03T09:15:00Z',
    referenceNumber: 'GOPAY20260403002',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    userNote: 'Pembayaran via GoPay',
  },
  {
    id: 'PAY003',
    userId: 'USR003',
    userName: 'Ahmad Fauzi',
    userEmail: 'ahmad.fauzi@email.com',
    plan: 'premium-monthly',
    amount: 49000,
    paymentMethod: 'retail',
    submittedAt: '2026-04-02T14:20:00Z',
    referenceNumber: 'INDOMARET20260402003',
    status: 'approved',
    proofUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
  },
  {
    id: 'PAY004',
    userId: 'USR004',
    userName: 'Dewi Lestari',
    userEmail: 'dewi.lestari@email.com',
    plan: 'premium-yearly',
    amount: 490000,
    paymentMethod: 'bank-transfer',
    submittedAt: '2026-04-02T11:00:00Z',
    referenceNumber: 'MANDIRI20260402004',
    status: 'rejected',
    proofUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    userNote: 'Transfer dari Mandiri',
  },
  {
    id: 'PAY005',
    userId: 'USR005',
    userName: 'Rudi Hermawan',
    userEmail: 'rudi.hermawan@email.com',
    plan: 'premium-monthly',
    amount: 49000,
    paymentMethod: 'e-wallet',
    submittedAt: '2026-04-03T10:45:00Z',
    referenceNumber: 'OVO20260403005',
    status: 'pending',
    proofUrl: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=800',
  },
];

export function PaymentQueueTable({ onViewDetails }: PaymentQueueTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading
  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  // Filter payments
  const filteredPayments = MOCK_PAYMENTS.filter((payment) => {
    const matchesSearch = 
      payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    
    // Date filter logic
    const matchesDate = dateFilter === 'all' || (() => {
      const submittedDate = new Date(payment.submittedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      if (dateFilter === 'today') {
        return submittedDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        return submittedDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'week') {
        return submittedDate >= lastWeek;
      }
      return true;
    })();

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getPlanLabel = (plan: Payment['plan']) => {
    return plan === 'premium-monthly' ? 'Premium Monthly' : 'Premium Yearly';
  };

  const getMethodLabel = (method: Payment['paymentMethod']) => {
    const labels = {
      'bank-transfer': 'Bank Transfer',
      'e-wallet': 'E-Wallet',
      'retail': 'Retail',
    };
    return labels[method];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Empty state
  if (!isLoading && filteredPayments.length === 0 && (searchQuery || statusFilter !== 'all' || methodFilter !== 'all' || dateFilter !== 'all')) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleRefresh}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-[#f5efeb] rounded-full flex items-center justify-center mb-4">
            <FileX className="h-8 w-8 text-[#567c8d]" />
          </div>
          <h3 className="text-lg font-semibold text-[#2f4156] mb-2">No payments found</h3>
          <p className="text-gray-500 text-center max-w-md">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setMethodFilter('all');
              setDateFilter('all');
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleRefresh}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Loader2 className="h-8 w-8 text-[#567c8d] animate-spin mb-4" />
          <p className="text-gray-500">Loading payments...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5efeb] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Reference Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#f5efeb]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#567c8d] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {payment.userName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#2f4156] truncate">
                            {payment.userName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {payment.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getPlanLabel(payment.plan)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#2f4156]">
                        {formatAmount(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getMethodLabel(payment.paymentMethod)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(payment.submittedAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{payment.referenceNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(payment)}
                        className="text-[#567c8d] hover:text-[#2f4156] hover:bg-[#c8d9e6]/50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium text-[#2f4156]">{filteredPayments.length}</span> of{' '}
              <span className="font-medium text-[#2f4156]">{MOCK_PAYMENTS.length}</span> payments
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
