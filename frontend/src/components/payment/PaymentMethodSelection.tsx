import { CreditCard, Building2, Wallet, Crown, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { usePayment, formatCurrency, PREMIUM_PRICE_IDR, PaymentMethod } from '../../lib/payment-context';
import { cn } from '../../lib/utils';

interface PaymentMethodSelectionProps {
  onNext: () => void;
}

export function PaymentMethodSelection({ onNext }: PaymentMethodSelectionProps) {
  const { selectedMethod, setSelectedMethod } = usePayment();

  const paymentMethods: { id: PaymentMethod; label: string; icon: any; description: string }[] = [
    {
      id: 'bank-transfer',
      label: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer from any Indonesian bank',
    },
    {
      id: 'e-wallet',
      label: 'E-Wallet',
      icon: Wallet,
      description: 'GoPay, OVO, DANA, ShopeePay',
    },
    {
      id: 'credit-card',
      label: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB',
    },
  ];

  const handleSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Benefits */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Premium Benefits</h3>
        </div>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Unlimited scholarship bookmarks
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Automated preparation timeline
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Access to all test simulations
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Priority email support
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Ad-free experience
          </li>
        </ul>
      </div>

      {/* Pricing */}
      <div className="text-center py-4 border-y">
        <p className="text-sm text-muted-foreground mb-1">Premium Plan</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold">{formatCurrency(PREMIUM_PRICE_IDR)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h4 className="font-medium mb-3">Select Payment Method</h4>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                selectedMethod === method.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  selectedMethod === method.id ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <method.icon className={cn(
                    'w-5 h-5',
                    selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{method.label}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <div className="bg-primary rounded-full p-1">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="w-full"
        size="lg"
      >
        Continue to Payment
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secure and encrypted. Cancel anytime.
      </p>
    </div>
  );
}
