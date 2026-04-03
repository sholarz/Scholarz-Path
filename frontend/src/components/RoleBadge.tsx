// Role Badge components for displaying user roles
import { Crown, Shield } from 'lucide-react';
import { UserRole } from '../lib/auth-context';
import { Badge } from './ui/badge';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  if (role === 'free') {
    return null; // Don't show badge for free users
  }

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (role === 'premium') {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        <Crown className={`${iconSize} mr-1`} />
        Premium
      </Badge>
    );
  }

  if (role === 'admin') {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        <Shield className={`${iconSize} mr-1`} />
        Admin
      </Badge>
    );
  }

  return null;
}

// Inline role indicator for smaller spaces
export function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'free') return null;

  if (role === 'premium') {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full" title="Premium User">
        <Crown className="w-3 h-3 text-yellow-600" />
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full" title="Admin">
        <Shield className="w-3 h-3 text-blue-600" />
      </div>
    );
  }

  return null;
}
