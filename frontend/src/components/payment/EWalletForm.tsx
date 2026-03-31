import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Wallet } from 'lucide-react';
import { formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';
import { cn } from '../../lib/utils';

interface EWalletFormProps {
  onSubmit: (details: any) => void;
  onBack: () => void;
}

const ewallets = [
  { id: 'gopay', name: 'GoPay', color: 'bg-[#00AA13]' },
  { id: 'ovo', name: 'OVO', color: 'bg-[#4C3494]' },
  { id: 'dana', name: 'DANA', color: 'bg-[#118EEA]' },
  { id: 'shopeepay', name: 'ShopeePay', color: 'bg-[#EE4D2D]' },
];

export function EWalletForm({ onSubmit, onBack }: EWalletFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('gopay');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }

    onSubmit({
      provider: selectedProvider,
      phoneNumber,
      amount: PREMIUM_PRICE_IDR,
    });
  };

  const isValid = phoneNumber.length >= 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-medium">E-Wallet Payment</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You'll receive a notification on your e-wallet app to complete the payment.
        </p>
      </div>

      <div>
        <Label className="mb-3 block">Select E-Wallet Provider</Label>
        <div className="grid grid-cols-2 gap-3">
          {ewallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => setSelectedProvider(wallet.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center',
                selectedProvider === wallet.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn('w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center', wallet.color)}>
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-sm">{wallet.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
          className="mt-2"
          maxLength={13}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the phone number linked to your {ewallets.find(w => w.id === selectedProvider)?.name} account
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Amount to Pay</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(PREMIUM_PRICE_IDR)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Payment request will be sent to your {ewallets.find(w => w.id === selectedProvider)?.name} app
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
