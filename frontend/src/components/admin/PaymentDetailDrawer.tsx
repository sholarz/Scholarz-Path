import { useState } from 'react';
import { X, Download, User, Mail, Calendar, Hash, CreditCard, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Payment } from './PaymentQueueTable';
import { toast } from 'sonner';

interface PaymentDetailDrawerProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (paymentId: string, note: string) => void;
  onReject?: (paymentId: string, reason: string) => void;
}

export function PaymentDetailDrawer({ 
  payment, 
  isOpen, 
  onClose,
  onApprove,
  onReject 
}: PaymentDetailDrawerProps) {
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!payment) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
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

  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Payment approved successfully!');
    
    if (onApprove) {
      onApprove(payment.id, adminNote);
    }
    
    setIsProcessing(false);
    setAdminNote('');
    onClose();
  };

  const handleReject = async () => {
    if (!adminNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Payment rejected');
    
    if (onReject) {
      onReject(payment.id, adminNote);
    }
    
    setIsProcessing(false);
    setAdminNote('');
    onClose();
  };

  const handleDownloadProof = () => {
    // In production, download the actual proof file
    window.open(payment.proofUrl, '_blank');
    toast.success('Downloading payment proof...');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-[#2f4156]">Payment Details</h2>
            <p className="text-sm text-gray-500 mt-1">Transaction ID: {payment.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-[#f5efeb] rounded-lg">
            <span className="text-sm font-medium text-[#2f4156]">Payment Status</span>
            {getStatusBadge(payment.status)}
          </div>

          {/* User Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2f4156] uppercase tracking-wide">
              User Information
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#567c8d] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">
                    {payment.userName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#2f4156]">{payment.userName}</div>
                  <div className="text-sm text-gray-500">{payment.userEmail}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <div className="font-mono text-[#2f4156] mt-1">{payment.userId}</div>
                </div>
                <div>
                  <span className="text-gray-500">Plan:</span>
                  <div className="font-medium text-[#2f4156] mt-1">{getPlanLabel(payment.plan)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Proof Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2f4156] uppercase tracking-wide">
                Payment Proof
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadProof}
                className="text-[#567c8d] border-[#567c8d] hover:bg-[#567c8d] hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <img
                src={payment.proofUrl}
                alt="Payment Proof"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2f4156] uppercase tracking-wide">
              Payment Details
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Amount</span>
                </div>
                <span className="font-semibold text-[#2f4156]">
                  {formatAmount(payment.amount)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Payment Method</span>
                </div>
                <span className="font-medium text-[#2f4156]">
                  {getMethodLabel(payment.paymentMethod)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm">Reference Number</span>
                </div>
                <span className="font-mono text-sm text-[#2f4156]">
                  {payment.referenceNumber}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Submitted Date</span>
                </div>
                <span className="text-sm text-[#2f4156]">
                  {formatDate(payment.submittedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* User Note */}
          {payment.userNote && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2f4156] uppercase tracking-wide">
                User Note
              </h3>
              <div className="bg-[#f5efeb] border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{payment.userNote}</p>
              </div>
            </div>
          )}

          {/* Admin Note (only for pending payments) */}
          {payment.status === 'pending' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2f4156] uppercase tracking-wide">
                Admin Note {payment.status === 'pending' && '(Optional)'}
              </h3>
              <Textarea
                placeholder="Add a note for this payment (required for rejection)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        {/* Action Buttons (only for pending payments) */}
        {payment.status === 'pending' && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-[#2f4156] hover:bg-[#567c8d]"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Payment
              </Button>
            </div>
          </div>
        )}

        {/* Already Processed Message */}
        {payment.status !== 'pending' && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className={`p-4 rounded-lg text-center ${
              payment.status === 'approved' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <p className="text-sm font-medium">
                This payment has been {payment.status === 'approved' ? 'approved' : 'rejected'}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
