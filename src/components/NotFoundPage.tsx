import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl mb-8 text-muted-foreground">Page not found</p>
        <Link to="/" className="text-primary hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
