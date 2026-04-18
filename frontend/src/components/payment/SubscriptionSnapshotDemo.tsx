import { UserSubscriptionSnapshot } from './UserSubscriptionSnapshot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/api-client';

export function SubscriptionSnapshotDemo() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<{ bookmarks_count: number; roadmaps_count: number } | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [currentData, usageData, invoiceData] = await Promise.all([
          apiGet<{ subscription: any | null }>('/subscriptions/current'),
          apiGet<{ bookmarks_count: number; roadmaps_count: number }>('/subscriptions/usage'),
          apiGet<{ invoices: any[] }>('/subscriptions/invoices'),
        ]);

        setSubscription(currentData?.subscription ?? null);
        setUsage(usageData ?? null);
        setInvoices(Array.isArray(invoiceData?.invoices) ? invoiceData.invoices : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription data.');
        setSubscription(null);
        setUsage(null);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const snapshotData = useMemo(() => {
    const status = String(subscription?.status || '').toLowerCase();
    const isPremium = status === 'active' || status === 'confirmed';
    const latestInvoice = invoices[0] || null;

    const paymentMethodMap: Record<string, string> = {
      'bank-transfer': 'Bank Transfer',
      'e-wallet': 'E-Wallet',
      'credit-card': 'Credit Card',
    };

    return {
      role: (isPremium ? 'premium' : (user?.role === 'premium' ? 'premium' : 'free')) as 'free' | 'premium',
      activeUntil: subscription?.expires_at || null,
      hasPaidBefore: Boolean(subscription) || invoices.length > 0,
      lastPaymentDate: latestInvoice?.issued_at || subscription?.started_at || subscription?.created_at || null,
      paymentMethodName: paymentMethodMap[String(subscription?.payment_method || '')] || subscription?.payment_method || null,
    };
  }, [invoices, subscription, user?.role]);

  const currencyFormatter = (amount: number, currency = 'IDR') =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">User Subscription Snapshot</h1>
        <p className="text-muted-foreground">
          Subscription monitor terhubung ke backend
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Subscription Saat Ini</CardTitle>
          <CardDescription>
            Snapshot user real-time berdasarkan data subscription backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading subscription data...</div>
          ) : error ? (
            <div className="w-full max-w-md rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load: {error}
            </div>
          ) : (
            <UserSubscriptionSnapshot snapshot={snapshotData} isAdminView={false} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Usage</CardTitle>
          <CardDescription>
            Ringkasan pemakaian fitur subscription dari backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Bookmarked Scholarships</div>
              <div className="text-2xl font-semibold mt-1">{usage?.bookmarks_count ?? 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Active Roadmaps</div>
              <div className="text-2xl font-semibold mt-1">{usage?.roadmaps_count ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice & Billing</CardTitle>
          <CardDescription>
            Riwayat invoice terbaru berdasarkan subscription aktif user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada invoice.</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{invoice.description || 'Subscription Invoice'}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {invoice.issued_at ? new Date(invoice.issued_at).toLocaleString('id-ID') : '-'}
                    </div>
                    <div className="text-sm mt-2">Status: <span className="font-medium uppercase">{invoice.status || '-'}</span></div>
                  </div>
                  <div className="text-right font-semibold">
                    {currencyFormatter(Number(invoice.amount || 0), invoice.currency || 'IDR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}