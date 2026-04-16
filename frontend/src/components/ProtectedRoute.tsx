// Protected Route wrapper for authenticated routes
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isAuthReady, navigate]);

  // Show nothing while checking authentication
  if (!isAuthReady || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
