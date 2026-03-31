import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { usePayment, formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';
import { PaymentMethodSelection } from './PaymentMethodSelection';
import { BankTransferForm } from './BankTransferForm';
import { EWalletForm } from './EWalletForm';
import { CreditCardForm } from './CreditCardForm';
import { PaymentConfirmation } from './PaymentConfirmation';
import { PaymentSuccess } from './PaymentSuccess';

type PaymentStep = 'method' | 'details' | 'confirmation' | 'processing' | 'success';

export function PaymentFlow() {
  const { isPaymentFlowOpen, closePaymentFlow, selectedMethod } = usePayment();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const handleClose = () => {
    closePaymentFlow();
    setCurrentStep('method');
    setPaymentDetails(null);
  };

  const handleMethodSelected = () => {
    setCurrentStep('details');
  };

  const handleDetailsSubmitted = (details: any) => {
    setPaymentDetails(details);
    setCurrentStep('confirmation');
  };

  const handleConfirmPayment = () => {
    setCurrentStep('processing');
    // Payment processing happens in PaymentConfirmation component
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('success');
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('method');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('details');
    }
  };

  return (
    <Dialog open={isPaymentFlowOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'method' && 'Upgrade to Premium'}
            {currentStep === 'details' && 'Payment Details'}
            {currentStep === 'confirmation' && 'Confirm Payment'}
            {currentStep === 'processing' && 'Processing Payment...'}
            {currentStep === 'success' && 'Payment Successful!'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'method' && (
          <PaymentMethodSelection onNext={handleMethodSelected} />
        )}

        {currentStep === 'details' && selectedMethod === 'bank-transfer' && (
          <BankTransferForm onSubmit={handleDetailsSubmitted} onBack={handleBack} />
        )}

        {currentStep === 'details' && selectedMethod === 'e-wallet' && (
          <EWalletForm onSubmit={handleDetailsSubmitted} onBack={handleBack} />
        )}

        {currentStep === 'details' && selectedMethod === 'credit-card' && (
          <CreditCardForm onSubmit={handleDetailsSubmitted} onBack={handleBack} />
        )}

        {currentStep === 'confirmation' && (
          <PaymentConfirmation
            paymentDetails={paymentDetails}
            onConfirm={handleConfirmPayment}
            onBack={handleBack}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {currentStep === 'success' && (
          <PaymentSuccess onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
