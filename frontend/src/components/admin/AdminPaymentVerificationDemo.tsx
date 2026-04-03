import { AdminLayout } from './AdminLayout';
import { PaymentVerificationPage } from './PaymentVerificationPage';

/**
 * ADMIN PAYMENT VERIFICATION DEMO PAGE
 * 
 * This is a complete demo of the Admin Payment Verification system.
 * 
 * Components included:
 * - AdminLayout: Sidebar and top header navigation
 * - PaymentVerificationPage: Main payment verification page with stats
 * - PaymentQueueTable: Table with filters, search, and states (normal, empty, loading)
 * - PaymentDetailDrawer: Drawer for reviewing payment details
 * 
 * Features:
 * - Complete UI/UX for payment verification workflow
 * - Filter by status, payment method, and date
 * - Search functionality
 * - Loading and empty states
 * - Payment proof preview and download
 * - Approve/Reject workflow with admin notes
 * - Mock data ready for Supabase integration
 * 
 * Color Palette Used:
 * - Navy #2f4156 (primary, text, buttons)
 * - Teal #567c8d (accents, badges)
 * - Skyblue #c8d9e6 (backgrounds, highlights)
 * - Beige #f5efeb (page background, table header)
 * - White #ffffff (cards, modals)
 */

export function AdminPaymentVerificationDemo() {
  return (
    <AdminLayout>
      <PaymentVerificationPage />
    </AdminLayout>
  );
}
