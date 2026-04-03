import { useAuth } from '../../lib/auth-context';
import { usePayment } from '../../lib/payment-context';
import { Check, X, AlertTriangle } from 'lucide-react';

interface UserSubscriptionSnapshotProps {
  targetUserId?: string;
  targetUserRole?: 'free' | 'premium';
  scholarshipId?: string;
  isAdminView?: boolean;
}

export function UserSubscriptionSnapshot({ 
  targetUserId,
  targetUserRole,
  scholarshipId,
  isAdminView = false 
}: UserSubscriptionSnapshotProps) {
  const { user } = useAuth();
  const { paymentHistory, hasPaidForScholarship } = usePayment();

  const displayRole = isAdminView && targetUserRole ? targetUserRole : user?.role || 'free';
  const isPremium = displayRole === 'premium';
  
  const hasPaidBefore = paymentHistory.length > 0;
  const lastPayment = paymentHistory[paymentHistory.length - 1];
  const hasPaidForThisScholarship = scholarshipId ? hasPaidForScholarship(scholarshipId) : false;
  
  const premiumActiveUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const formattedActiveDate = premiumActiveUntil.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const lastPaymentDate = lastPayment 
    ? new Date(lastPayment.timestamp).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : null;

  const paymentMethodName = lastPayment?.methodDetails || 'Unknown method';

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md"
      style={{ 
        width: '320px',
        padding: '16px',
        gap: '12px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 className="text-sm font-bold text-gray-600">
        Subscription Snapshot
      </h3>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              isPremium ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="font-semibold text-gray-900">
            {isPremium ? 'Premium' : 'Free'}
          </span>
        </div>
        <p className="text-xs text-gray-500 ml-4">
          {isPremium 
            ? `Active until ${formattedActiveDate}` 
            : 'Upgrade to unlock'
          }
        </p>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-start gap-2">
          {hasPaidBefore ? (
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              {hasPaidBefore ? (
                <>
                  <span className="font-medium">Previously paid: Yes</span>
                  <span className="text-gray-500"> ({lastPaymentDate})</span>
                </>
              ) : (
                <span className="font-medium">Previously paid: No</span>
              )}
            </p>
            
            {hasPaidBefore && lastPayment && (
              <p className="text-xs text-gray-500 mt-1">
                Via {paymentMethodName}
              </p>
            )}
          </div>
        </div>
      </div>

      {isAdminView && hasPaidForThisScholarship && (
        <div 
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-900 leading-relaxed">
            <span className="font-semibold">⚠️ Duplicate Payment Warning</span>
            <br />
            User already paid for this scholarship on {lastPaymentDate}. Please verify before approving.
          </p>
        </div>
      )}
    </div>
  );
}
