import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * ADMIN ROUTE COMPONENT
 * 
 * Protects admin-only routes. Only users with 'admin' role can access.
 * Redirects non-admin users to dashboard with error message.
 */

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not admin, show access denied
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2f4156] mb-3">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">
            Halaman ini hanya bisa diakses oleh administrator. Silakan hubungi tim dukungan jika ini adalah kesalahan.
          </p>
          <Link to="/dashboard">
            <Button className="bg-[#2f4156] hover:bg-[#567c8d]">
              Kembali ke Dasbor
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // User is admin, render children
  return <>{children}</>;
}
