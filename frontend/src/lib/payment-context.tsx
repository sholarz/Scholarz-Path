// Payment Context for handling premium upgrades
import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';

export type PaymentMethod = 'bank-transfer' | 'e-wallet' | 'credit-card';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'rejected';
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
  processPayment: (details: any, scholarshipId?: string) => Promise<{ success: boolean; message?: string }>;
  paymentHistory: PaymentDetails[];
  hasPaidForScholarship: (scholarshipId: string) => boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const PREMIUM_PRICE = 99000; // IDR 99,000 per month

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentFlowOpen, setIsPaymentFlowOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentDetails[]>([]);
  const { refreshUser } = useAuth();

  const openPaymentFlow = () => {
    setIsPaymentFlowOpen(true);
    setSelectedMethod(null);
  };

  const closePaymentFlow = () => {
    setIsPaymentFlowOpen(false);
    setSelectedMethod(null);
  };

  const processPayment = async (details: any, scholarshipId?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${((import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')}/subscriptions/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            payment_method: selectedMethod,
            payment_reference: details?.paymentReference,
            payment_proof_url: details?.paymentProofUrl,
            payment_note: details?.paymentNote,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Subscription API error: ${response.status}`;
        try {
          const errorPayload = await response.json();
          errorMessage = errorPayload?.message || errorPayload?.error?.message || errorMessage;
        } catch {
          // Keep default message if response body is not JSON.
        }
        console.error(errorMessage);
        return { success: false, message: errorMessage };
      }

      const payload = await response.json();
      const subscriptionStatus = payload?.data?.subscription?.status;
      if (subscriptionStatus !== 'pending') {
        console.error('Unexpected subscription status:', subscriptionStatus);
        return { success: false, message: 'Status subscription tidak valid setelah submit pembayaran.' };
      }

      // Determine payment method details for local history
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
        status: 'pending',
        scholarshipId,
        methodDetails,
      };

      setPaymentHistory(prev => [...prev, payment]);

      // Refresh user so frontend stays in sync with backend role (should remain free until admin confirms).
      await refreshUser();

      return { success: true };
    } catch (err) {
      console.error('Payment processing error:', err);
      return { success: false, message: 'Terjadi kesalahan saat memproses pembayaran.' };
    }
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