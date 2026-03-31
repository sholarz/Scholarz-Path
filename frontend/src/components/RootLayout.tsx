import { Outlet } from 'react-router';
import { AuthProvider } from '../lib/auth-context';
import { BookmarkProvider } from '../lib/bookmark-context';
import { NotificationProvider } from '../lib/notification-context';
import { PaymentProvider } from '../lib/payment-context';
import { PaymentFlow } from './payment/PaymentFlow';
import { Toaster } from './ui/sonner';

export function RootLayout() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <NotificationProvider>
          <PaymentProvider>
            <Outlet />
            <PaymentFlow />
            <Toaster />
          </PaymentProvider>
        </NotificationProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}