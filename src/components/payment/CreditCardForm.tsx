import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { CreditCard, Lock } from 'lucide-react';
import { formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';

interface CreditCardFormProps {
  onSubmit: (details: any) => void;
  onBack: () => void;
}

export function CreditCardForm({ onSubmit, onBack }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardHolder,
      expiryMonth,
      expiryYear,
      cvv,
      amount: PREMIUM_PRICE_IDR,
    });
  };

  const isValid = 
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardHolder.length > 0 &&
    expiryMonth.length === 2 &&
    expiryYear.length === 2 &&
    cvv.length === 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Secure Payment</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your card information is encrypted and secure. We accept Visa, Mastercard, and JCB.
        </p>
      </div>

      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <div className="relative mt-2">
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            className="pr-12"
          />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <div>
        <Label htmlFor="cardHolder">Cardholder Name</Label>
        <Input
          id="cardHolder"
          type="text"
          placeholder="JOHN DOE"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expiryMonth">Month</Label>
          <Input
            id="expiryMonth"
            type="text"
            placeholder="MM"
            value={expiryMonth}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 2 && (!value || parseInt(value) <= 12)) {
                setExpiryMonth(value);
              }
            }}
            className="mt-2"
            maxLength={2}
          />
        </div>
        <div>
          <Label htmlFor="expiryYear">Year</Label>
          <Input
            id="expiryYear"
            type="text"
            placeholder="YY"
            value={expiryYear}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 2) {
                setExpiryYear(value);
              }
            }}
            className="mt-2"
            maxLength={2}
          />
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="text"
            placeholder="123"
            value={cvv}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 3) {
                setCvv(value);
              }
            }}
            className="mt-2"
            maxLength={3}
          />
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(PREMIUM_PRICE_IDR)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Pay Now
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        🔒 Secured by 256-bit SSL encryption
      </p>
    </form>
  );
}
