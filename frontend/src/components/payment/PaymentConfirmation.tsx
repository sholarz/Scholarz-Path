import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Building2, Wallet, CreditCard, Check, Loader2 } from 'lucide-react';
import { usePayment, formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';

interface PaymentConfirmationProps {
  paymentDetails: any;
  onConfirm: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function PaymentConfirmation({ paymentDetails, onConfirm, onBack, onSuccess }: PaymentConfirmationProps) {
  const { selectedMethod, processPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    onConfirm();

    try {
      const success = await processPayment(paymentDetails);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment failed:', error);
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

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          By confirming this payment, you agree to our terms of service. 
          Your premium access will be activated immediately upon successful payment verification.
        </p>
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
