import { UserSubscriptionSnapshot } from './UserSubscriptionSnapshot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { usePayment } from '../../lib/payment-context';
import { useAuth } from '../../lib/auth-context';

/**
 * Demo page showcasing all variants of UserSubscriptionSnapshot
 * This demonstrates how the component appears in different scenarios
 */
export function SubscriptionSnapshotDemo() {
  const { paymentHistory, openPaymentFlow } = usePayment();
  const { user } = useAuth();
  const hasMadePayment = paymentHistory.length > 0;

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">User Subscription Snapshot</h1>
        <p className="text-muted-foreground">
          Component variants for different user states and scenarios
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>🔗 Access this demo:</strong> Navigate to <code className="bg-white px-2 py-0.5 rounded">/subscription-snapshot-demo</code>
          </p>
        </div>
        
        {/* Interactive Test Section */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-1">
                🎯 Interactive Demo
              </p>
              <p className="text-xs text-green-700 dark:text-green-200">
                {hasMadePayment ? (
                  <>You have {paymentHistory.length} payment(s) in history. The "Premium + Already Paid" variant now shows real data!</>
                ) : (
                  <>Make a test payment to see how the component changes with real payment history.</>
                )}
              </p>
            </div>
            {!hasMadePayment && user && (
              <Button 
                size="sm" 
                onClick={openPaymentFlow}
                className="whitespace-nowrap"
              >
                Make Test Payment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Variant A: Free + Never Paid */}
      <Card>
        <CardHeader>
          <CardTitle>Variant A: Free User + Never Paid</CardTitle>
          <CardDescription>
            A free user who has never made any payment. Shows "Upgrade to unlock" message.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <UserSubscriptionSnapshot 
            targetUserRole="free"
            isAdminView={false}
          />
        </CardContent>
      </Card>

      {/* Variant B: Premium + Never Paid (Rare) */}
      <Card>
        <CardHeader>
          <CardTitle>Variant B: Premium User + Never Paid (Rare)</CardTitle>
          <CardDescription>
            A premium user who somehow hasn't made payment yet (promotional upgrade, admin granted, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <UserSubscriptionSnapshot 
            targetUserRole="premium"
            isAdminView={false}
          />
        </CardContent>
      </Card>

      {/* Variant C: Premium + Already Paid */}
      <Card>
        <CardHeader>
          <CardTitle>Variant C: Premium User + Already Paid</CardTitle>
          <CardDescription>
            A premium user with payment history. Most common scenario for paying users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-sm text-muted-foreground mb-4 text-center">
            Note: Make a payment first using the Upgrade to Premium flow to see this variant with real data
          </div>
          <UserSubscriptionSnapshot 
            targetUserRole="premium"
            isAdminView={false}
          />
        </CardContent>
      </Card>

      {/* Admin View: With Warning Banner */}
      <Card className="border-yellow-200 bg-yellow-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Admin View: Duplicate Payment Warning</span>
            <span className="text-yellow-600">⚠️</span>
          </CardTitle>
          <CardDescription>
            When admin is reviewing a payment and user has already paid for the same scholarship,
            a warning banner appears to prevent double approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground text-center max-w-md">
              <strong>Developer Note:</strong> This variant only appears when:
              <ul className="list-disc text-left mt-2 ml-6 space-y-1">
                <li>isAdminView = true</li>
                <li>User has payment history (has_paid_before = true)</li>
                <li>Current scholarship ID matches previous payment</li>
              </ul>
            </div>
            <UserSubscriptionSnapshot 
              targetUserRole="premium"
              scholarshipId="SCH001"
              isAdminView={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>Integration in Payment Confirmation Page</CardTitle>
          <CardDescription>
            The component is placed directly above the "Confirm Payment" button
            to ensure visibility before approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="text-sm text-muted-foreground">
              Payment confirmation flow (simplified):
            </div>
            
            {/* Mock payment details */}
            <div className="bg-card border rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Payment Information</div>
              <div className="text-sm text-muted-foreground">
                BCA Virtual Account • Rp 99.000
              </div>
            </div>

            {/* Snapshot placement */}
            <div className="flex justify-center py-4 bg-blue-50/50 rounded-lg border-2 border-blue-200 border-dashed">
              <UserSubscriptionSnapshot />
            </div>

            {/* Mock buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-gray-50">
                Back
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                Confirm Payment
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}