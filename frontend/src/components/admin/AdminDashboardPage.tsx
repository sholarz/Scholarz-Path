import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';

/**
 * ADMIN DASHBOARD PAGE
 * 
 * Main admin dashboard with overview, statistics, and quick actions.
 * Only accessible by users with admin role.
 */

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
