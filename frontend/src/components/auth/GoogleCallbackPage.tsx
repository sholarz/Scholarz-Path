import { useEffect, useState } from "react";
import { Link } from "react-router";
import { setStoredToken } from "../../api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export function GoogleCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const token = hashParams.get("token") || currentUrl.searchParams.get("token");
    const errorParam =
      currentUrl.searchParams.get("error") ||
      currentUrl.searchParams.get("error_description");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!token) {
      setError("Missing authentication token. Please try again.");
      return;
    }

    setStoredToken(token);
    window.location.replace("/dashboard");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{error ? "Sign in failed" : "Signing you in"}</CardTitle>
          <CardDescription>
            {error
              ? "We could not complete Google sign in."
              : "Please wait while we finish your login."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {error ? (
            <>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Link to="/login">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
