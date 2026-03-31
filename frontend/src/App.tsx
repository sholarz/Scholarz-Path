import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth-context';
import { BookmarkProvider } from './lib/bookmark-context';
import { NotificationProvider } from './lib/notification-context';
import { PaymentProvider } from './lib/payment-context';
import { PaymentFlow } from './components/payment/PaymentFlow';

export default function App() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <NotificationProvider>
          <PaymentProvider>
            <RouterProvider router={router} />
            <PaymentFlow />
            <Toaster />
          </PaymentProvider>
        </NotificationProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}