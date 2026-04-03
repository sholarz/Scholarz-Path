// Locked Feature component for premium-only content
import { ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { UpgradeModal } from './UpgradeModal';
import { Button } from './ui/button';

interface LockedFeatureProps {
  children: ReactNode;
  feature: string;
  description?: string;
  showBadge?: boolean;
  showLockIcon?: boolean;
  requiresPremium?: boolean;
  requiresAdmin?: boolean;
}

export function LockedFeature({ 
  children, 
  feature,
  description,
  showBadge = false,
  showLockIcon = true,
  requiresPremium = true,
  requiresAdmin = false 
}: LockedFeatureProps) {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check access
  const hasAccess = user && (
    user.role === 'admin' ||
    (requiresPremium && user.role === 'premium') ||
    (!requiresPremium && !requiresAdmin)
  );

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show locked version for free users
  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
          <div className="text-center space-y-4 max-w-sm px-4">
            {showLockIcon && (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full">
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold mb-2">{feature}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {description || 'Upgrade to Premium to unlock this feature and get full access to all scholarship tools.'}
              </p>
              <Button onClick={() => setShowUpgradeModal(true)}>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature={feature}
      />
    </>
  );
}

// Simpler locked button for individual features
interface LockedButtonProps {
  feature: string;
  children: ReactNode;
  className?: string;
}

export function LockedButton({ feature, children, className = '' }: LockedButtonProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowUpgradeModal(true)}
        className={className}
      >
        <Lock className="w-4 h-4 mr-2" />
        {children}
      </Button>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature={feature}
      />
    </>
  );
}