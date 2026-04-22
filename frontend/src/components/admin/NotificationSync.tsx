import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RefreshCw } from 'lucide-react';

export function NotificationSync() {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync gagal dijalankan');
      }

      alert('Notification sync berhasil dijalankan.');
    } catch (error) {
      console.error('Notification sync error:', error);
      alert('Notification sync gagal. Silakan coba lagi.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Sync</CardTitle>
          <CardDescription>
            Jalankan sinkronisasi notifikasi admin secara manual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}