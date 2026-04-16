import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashToken = new URLSearchParams(hash).get('token');

  if (hashToken) {
    return hashToken;
  }

  const queryToken = new URLSearchParams(window.location.search).get('token');
  return queryToken;
};

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const token = getTokenFromUrl();

      if (!token) {
        setError('Missing Google auth token. Please try again.');
        return;
      }

      try {
        const loggedInUser = await completeGoogleLogin(token);
        toast.success(`Welcome, ${loggedInUser.name}!`);

        if (loggedInUser.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed. Please try again.');
      }
    };

    run();
  }, [completeGoogleLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Signing you in</CardTitle>
          <CardDescription>Completing Google authentication...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {!error && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
