// Payment Context for handling premium upgrades
import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';

export type PaymentMethod = 'bank-transfer' | 'e-wallet' | 'credit-card';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency: string;
  timestamp: string;
  scholarshipId?: string; // Track which scholarship this payment is for
  methodDetails?: string; // E.g., "BCA Virtual Account", "GoPay", etc.
}

export interface BankTransferDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
}

export interface EWalletDetails {
  provider: 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  phoneNumber: string;
  amount: number;
}

export interface CreditCardDetails {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  amount: number;
}

interface PaymentContextType {
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: (method: PaymentMethod | null) => void;
  isPaymentFlowOpen: boolean;
  openPaymentFlow: () => void;
  closePaymentFlow: () => void;
  processPayment: (details: any, scholarshipId?: string) => Promise<boolean>;
  paymentHistory: PaymentDetails[];
  hasPaidForScholarship: (scholarshipId: string) => boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const PREMIUM_PRICE = 99000; // IDR 99,000 per month

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentFlowOpen, setIsPaymentFlowOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentDetails[]>([]);
  const { upgradeToPremium } = useAuth();

  const openPaymentFlow = () => {
    setIsPaymentFlowOpen(true);
    setSelectedMethod(null);
  };

  const closePaymentFlow = () => {
    setIsPaymentFlowOpen(false);
    setSelectedMethod(null);
  };

  const processPayment = async (details: any, scholarshipId?: string): Promise<boolean> => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Determine payment method details
        let methodDetails = '';
        switch (selectedMethod) {
          case 'bank-transfer':
            methodDetails = `${details.bankName} Virtual Account`;
            break;
          case 'e-wallet':
            methodDetails = details.provider?.toUpperCase() || 'E-Wallet';
            break;
          case 'credit-card':
            methodDetails = 'Credit Card';
            break;
        }

        const payment: PaymentDetails = {
          method: selectedMethod!,
          amount: PREMIUM_PRICE,
          currency: 'IDR',
          timestamp: new Date().toISOString(),
          scholarshipId,
          methodDetails,
        };

        setPaymentHistory(prev => [...prev, payment]);
        
        // Upgrade user to premium after successful payment
        upgradeToPremium();
        
        resolve(true);
      }, 2000); // Simulate 2 second processing time
    });
  };

  const hasPaidForScholarship = (scholarshipId: string): boolean => {
    return paymentHistory.some(payment => payment.scholarshipId === scholarshipId);
  };

  return (
    <PaymentContext.Provider
      value={{
        selectedMethod,
        setSelectedMethod,
        isPaymentFlowOpen,
        openPaymentFlow,
        closePaymentFlow,
        processPayment,
        paymentHistory,
        hasPaidForScholarship,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }

  return context;
}

export const PREMIUM_PRICE_IDR = PREMIUM_PRICE;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}