// Upgrade to Premium Modal
import { Crown, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useNavigate } from 'react-router';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/dashboard?tab=upgrade');
  };

  const premiumFeatures = [
    'Unlimited bookmarks',
    'Advanced search filters',
    'Automated preparation timeline',
    'Priority support',
    'Early access to new scholarships',
    'Detailed analytics & insights',
    'Custom deadline reminders',
    'Export data (PDF, Excel)',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle>Upgrade to Premium</DialogTitle>
          </div>
          <DialogDescription>
            {feature ? (
              <>
                Unlock <span className="font-semibold text-foreground">{feature}</span> and all premium features
              </>
            ) : (
              'Get access to all premium features and maximize your scholarship success'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {premiumFeatures.map((feat, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">Rp 99,000</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}