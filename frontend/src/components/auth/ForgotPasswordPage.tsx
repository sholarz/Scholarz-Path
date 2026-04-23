import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    setApiWarning(null);
    try {
      const result = await resetPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setApiMessage(result.message);
      setApiWarning(result.warning ?? null);
      setEmailSent(true);
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? `Reset link request submitted for ${email}`
              : "Enter your email to receive a password reset link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>{apiMessage}</strong>
              </p>
              {apiWarning ? (
                <p className="text-sm text-amber-700">{apiWarning}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Please check your email and follow the instructions to reset your password.
              </p>
              <Link to="/login">
                <Button className="w-full">Return to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <Link to="/login">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
