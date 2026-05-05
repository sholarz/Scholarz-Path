import React, { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { Bell, CheckCircle2, Info, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'match';
  read: boolean;
  createdAt: any;
  link?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as NotificationItem[];

      const sortedItems = items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setNotifications(sortedItems);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      toast.error('Gagal memuat notifikasi');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((notification) => {
        batch.update(doc(db, 'notifications', notification.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Gagal menandai semua notifikasi');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'match':
        return <Sparkles className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="sp-page-container space-y-6">
      <div className="sp-page-header flex items-end justify-between gap-4">
        <div>
          <h1 className="sp-page-title">Notifikasi</h1>
          <p className="sp-page-subtitle">Semua update akun, pembayaran, dan aktivitas penting tampil di sini.</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} className="bg-slate-900 text-white hover:bg-slate-800 font-bold">
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-sm font-bold">Daftar Notifikasi</CardTitle>
          <CardDescription className="text-xs">Klik notifikasi yang belum dibaca untuk menandainya sebagai sudah dibaca.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : notifications.length > 0 ? (
            <ScrollArea className="h-[70vh]">
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.read ? 'bg-indigo-50/20' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? 'bg-white' : 'bg-slate-50'}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {!notification.read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 uppercase">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {notification.createdAt?.toDate ? new Date(notification.createdAt.toDate()).toLocaleString('id-ID') : 'Baru saja'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center px-6 text-slate-400">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-500">Belum ada notifikasi</p>
              <p className="text-xs text-slate-400 mt-1">Kami akan mengirim update ketika ada perubahan penting di akun Anda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}