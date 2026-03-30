import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Building2, Copy, Check } from 'lucide-react';
import { formatCurrency, PREMIUM_PRICE_IDR } from '../../lib/payment-context';
import { toast } from 'sonner@2.0.3';

interface BankTransferFormProps {
  onSubmit: (details: any) => void;
  onBack: () => void;
}

const bankAccounts = [
  {
    id: 'bca',
    name: 'BCA',
    accountNumber: '1234567890',
    accountHolder: 'PT ScholarPath Indonesia',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    accountNumber: '9876543210',
    accountHolder: 'PT ScholarPath Indonesia',
  },
  {
    id: 'bni',
    name: 'BNI',
    accountNumber: '5555666677',
    accountHolder: 'PT ScholarPath Indonesia',
  },
];

export function BankTransferForm({ onSubmit, onBack }: BankTransferFormProps) {
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(selectedBank.accountNumber);
    setCopied(true);
    toast.success('Account number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    onSubmit({
      bankName: selectedBank.name,
      accountNumber: selectedBank.accountNumber,
      accountHolder: selectedBank.accountHolder,
      amount: PREMIUM_PRICE_IDR,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Bank Transfer Instructions</h3>
        </div>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Select your preferred bank below</li>
          <li>Transfer the exact amount to the account</li>
          <li>Save your transfer receipt</li>
          <li>Your premium access will be activated within 1 hour</li>
        </ol>
      </div>

      <div>
        <Label className="mb-3 block">Select Bank</Label>
        <div className="space-y-2">
          {bankAccounts.map((bank) => (
            <button
              key={bank.id}
              onClick={() => setSelectedBank(bank)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedBank.id === bank.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">{bank.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 bg-card border rounded-lg p-4">
        <div>
          <Label className="text-xs text-muted-foreground">Bank Name</Label>
          <p className="font-medium">{selectedBank.name}</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Account Number</Label>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-lg font-bold flex-1">{selectedBank.accountNumber}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAccountNumber}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Account Holder</Label>
          <p className="font-medium">{selectedBank.accountHolder}</p>
        </div>

        <div className="pt-3 border-t">
          <Label className="text-xs text-muted-foreground">Transfer Amount</Label>
          <p className="text-2xl font-bold text-primary">{formatCurrency(PREMIUM_PRICE_IDR)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please transfer the exact amount for automatic verification
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> After completing the transfer, click "I've Made the Transfer" 
          to proceed. Your premium access will be activated automatically once we verify the payment.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          I've Made the Transfer
        </Button>
      </div>
    </div>
  );
}
