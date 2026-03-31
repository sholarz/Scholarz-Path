import { Lock, Crown } from 'lucide-react';
import { ReactNode } from 'react';
import { useAuth } from '../lib/auth-context';
import { usePayment } from '../lib/payment-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface PremiumFeatureLockProps {
  children: ReactNode;
  feature: string;
  description?: string;
  showBadge?: boolean;
  showLockIcon?: boolean;
  allowAdmin?: boolean;
}

export function PremiumFeatureLock({ 
  children, 
  feature,
  description,
  showBadge = false,
  showLockIcon = true,
  allowAdmin = true
}: PremiumFeatureLockProps) {
  const { user } = useAuth();
  const { openPaymentFlow } = usePayment();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isPremium = user?.role === 'premium';
  const isAdmin = user?.role === 'admin';
  const hasAccess = isPremium || (allowAdmin && isAdmin);

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleClick = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgrade = () => {
    openPaymentFlow();
    setShowUpgradeModal(false);
  };

  return (
    <>
      <div className="relative">
        <div className="relative filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showLockIcon && (
              <div className="bg-yellow-100 p-3 rounded-full inline-flex mb-2">
                <Lock className="w-6 h-6 text-yellow-600" />
              </div>
            )}
            {showBadge && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 mb-2">
                <Crown className="w-3 h-3 mr-1" />
                Premium Feature
              </Badge>
            )}
            <Button 
              onClick={handleClick}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 rounded-full">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center">Upgrade to Premium</DialogTitle>
            <DialogDescription className="text-center">
              Unlock {feature} and all premium features to maximize your scholarship success
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Premium Features Include:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Advanced search filters and sorting
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Automated preparation timeline with task tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Unlimited bookmarks
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Priority access to new scholarships
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Email deadline reminders
                </li>
              </ul>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground text-center">
                {description}
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component for inline premium badge (doesn't lock, just shows premium indicator)
export function PremiumBadge() {
  return (
    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  );
}

// Component for admin badge
export function AdminBadge() {
  return (
    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
      Admin
    </Badge>
  );
}
