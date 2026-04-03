// Protected Route wrapper for authenticated routes
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
