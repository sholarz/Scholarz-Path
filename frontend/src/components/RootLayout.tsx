import { Outlet } from 'react-router';
import { BookmarkProvider } from '../lib/bookmark-context';
import { NotificationProvider } from '../lib/notification-context';
import { PaymentProvider } from '../lib/payment-context';
import { PaymentFlow } from './payment/PaymentFlow';
import { Toaster } from './ui/sonner';

export function RootLayout() {
  return (
    <BookmarkProvider>
      <NotificationProvider>
        <PaymentProvider>
          <Outlet />
          <PaymentFlow />
          <Toaster />
        </PaymentProvider>
      </NotificationProvider>
    </BookmarkProvider>
  );
}