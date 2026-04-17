import { useState } from 'react';
import { Button } from '../ui/button';
import { Building2, Wallet, CreditCard, Check, Loader2 } from 'lucide-react';
import { usePayment, formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';
import { UserSubscriptionSnapshot } from './UserSubscriptionSnapshot';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface PaymentConfirmationProps {
  paymentDetails: any;
  onConfirm: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function PaymentConfirmation({ paymentDetails, onConfirm, onBack, onSuccess }: PaymentConfirmationProps) {
  const { selectedMethod, processPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const handleConfirm = async () => {
    if (!paymentProofUrl.trim()) {
      toast.error('Silakan isi URL bukti pembayaran terlebih dahulu.');
      return;
    }

    try {
      // Validate URL format before submit to avoid backend 422.
      new URL(paymentProofUrl);
    } catch {
      toast.error('Format URL bukti pembayaran tidak valid.');
      return;
    }

    setIsProcessing(true);
    onConfirm();

    try {
      const payload = {
        ...paymentDetails,
        paymentProofUrl: paymentProofUrl.trim(),
        paymentReference: paymentReference.trim() || undefined,
        paymentNote: paymentNote.trim() || undefined,
      };

      // Pass scholarship ID 'SCH001' for demo purposes
      // In production, this would come from props or context
      const result = await processPayment(payload, 'SCH001');
      if (result.success) {
        onSuccess();
        return;
      }

      toast.error(result.message || 'Gagal mengirim pembayaran. Silakan coba lagi.');
      setIsProcessing(false);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Gagal mengirim pembayaran. Silakan coba lagi.');
      setIsProcessing(false);
    }
  };

  const getMethodIcon = () => {
    switch (selectedMethod) {
      case 'bank-transfer':
        return Building2;
      case 'e-wallet':
        return Wallet;
      case 'credit-card':
        return CreditCard;
      default:
        return Check;
    }
  };

  const MethodIcon = getMethodIcon();

  const renderPaymentDetails = () => {
    switch (selectedMethod) {
      case 'bank-transfer':
        return (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{paymentDetails.bankName}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono font-medium">{paymentDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Holder</span>
              <span className="font-medium">{paymentDetails.accountHolder}</span>
            </div>
          </div>
        );

      case 'e-wallet':
        return (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium uppercase">{paymentDetails.provider}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Phone Number</span>
              <span className="font-medium">{paymentDetails.phoneNumber}</span>
            </div>
          </div>
        );

      case 'credit-card':
        return (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Card Number</span>
              <span className="font-mono font-medium">
                •••• •••• •••• {paymentDetails.cardNumber.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Cardholder</span>
              <span className="font-medium">{paymentDetails.cardHolder}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Expiry</span>
              <span className="font-medium">
                {paymentDetails.expiryMonth}/{paymentDetails.expiryYear}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isProcessing) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Processing Payment...</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your payment. This may take a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MethodIcon className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Review Payment Details</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Please review your payment information before confirming.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h4 className="font-medium mb-4">Payment Information</h4>
        {renderPaymentDetails()}
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Premium Subscription</span>
            <span className="font-medium">{formatCurrency(PREMIUM_PRICE_IDR)}</span>
          </div>
          <div className="flex justify-between py-2 border-t pt-3">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(PREMIUM_PRICE_IDR)}</span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Bukti Pembayaran</h4>

        <div className="space-y-2">
          <Label htmlFor="paymentProofUrl">URL Bukti Pembayaran *</Label>
          <Input
            id="paymentProofUrl"
            type="url"
            placeholder="https://contoh.com/bukti-transfer.jpg"
            value={paymentProofUrl}
            onChange={(e) => setPaymentProofUrl(e.target.value)}
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground">
            Upload bukti pembayaran Anda ke cloud storage, lalu tempel URL publiknya di sini.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentReference">Nomor Referensi (Opsional)</Label>
          <Input
            id="paymentReference"
            placeholder="Contoh: TRX-123456"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentNote">Catatan Admin (Opsional)</Label>
          <Textarea
            id="paymentNote"
            rows={3}
            placeholder="Tambahkan catatan jika diperlukan"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          By confirming this payment, you agree to our terms of service. 
          Your submission will be reviewed by admin first. Premium access is activated only after admin confirmation.
        </p>
      </div>

      {/* User Subscription Snapshot - placed above button for visibility */}
      <div className="flex justify-center">
        <UserSubscriptionSnapshot />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isProcessing}>
          Back
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing}>
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}