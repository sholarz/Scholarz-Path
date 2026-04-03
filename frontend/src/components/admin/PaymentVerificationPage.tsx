import { useState } from 'react';
import { CreditCard, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PaymentQueueTable, Payment } from './PaymentQueueTable';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';

/**
 * PAYMENT VERIFICATION PAGE - DEVELOPER NOTES
 * 
 * This is the main admin page for managing payment verifications.
 * 
 * Features:
 * - Statistics cards (Total Payments, Pending, Approved, Rejected)
 * - Payment queue table with filters and search
 * - Payment detail drawer for reviewing payments
 * - Approve/Reject workflow
 * 
 * Integration with Supabase:
 * - Fetch payments from 'payments' table
 * - Update payment status on approve/reject
 * - Real-time updates using Supabase subscriptions
 * - Send notifications to users on status change
 */

interface PaymentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}

// Mock stats - in production, fetch from backend/Supabase
const MOCK_STATS: PaymentStats = {
  total: 48,
  pending: 12,
  approved: 31,
  rejected: 5,
  totalAmount: 15680000,
};

export function PaymentVerificationPage() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPayment(null), 300);
  };

  const handleApprove = (paymentId: string, note: string) => {
    console.log('Approving payment:', paymentId, 'Note:', note);
    // In production: update payment status in Supabase, send notification to user
  };

  const handleReject = (paymentId: string, reason: string) => {
    console.log('Rejecting payment:', paymentId, 'Reason:', reason);
    // In production: update payment status in Supabase, send notification to user with reason
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2f4156] mb-2">Payment Verification</h1>
        <p className="text-gray-600">
          Review and approve payment submissions from users
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payments */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#c8d9e6] rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-[#2f4156]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase">Total</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-[#2f4156]">{MOCK_STATS.total}</div>
            <div className="text-sm text-gray-500">All Payments</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">Total Amount</div>
            <div className="text-sm font-semibold text-[#567c8d] mt-1">
              {formatAmount(MOCK_STATS.totalAmount)}
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-[#2f4156]">{MOCK_STATS.pending}</div>
            <div className="text-sm text-gray-500">Awaiting Review</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-yellow-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Needs Action</span>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-800">Approved</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-[#2f4156]">{MOCK_STATS.approved}</div>
            <div className="text-sm text-gray-500">Verified Payments</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">Success Rate</div>
            <div className="text-sm font-semibold text-green-600 mt-1">
              {((MOCK_STATS.approved / MOCK_STATS.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-[#2f4156]">{MOCK_STATS.rejected}</div>
            <div className="text-sm text-gray-500">Declined Payments</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">Rejection Rate</div>
            <div className="text-sm font-semibold text-red-600 mt-1">
              {((MOCK_STATS.rejected / MOCK_STATS.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Payment Queue Table */}
      <PaymentQueueTable onViewDetails={handleViewDetails} />

      {/* Payment Detail Drawer */}
      <PaymentDetailDrawer
        payment={selectedPayment}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
