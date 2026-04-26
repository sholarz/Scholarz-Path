import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  Calendar,
  X,
  Sparkles
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'match';
  read: boolean;
  createdAt: any;
  link?: string;
}

export function NotificationsMenu() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        
        // Sort in JS to avoid composite index requirement
        const sortedItems = items.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setNotifications(sortedItems);
        setUnreadCount(sortedItems.filter(n => !n.read).length);
      },
      (error) => {
        console.error("Firestore Notification Error:", error);
        if (error.code === 'permission-denied') {
          // Don't throw here to avoid crashing the whole UI, but log it properly if needed
          // or use handleFirestoreError if we want a hard failure
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'match': return <Sparkles className="h-4 w-4 text-indigo-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button className="relative p-2 rounded-full hover:bg-slate-50 transition-colors outline-none group">
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      } />
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-slate-100">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white">
          <h4 className="text-sm font-bold text-slate-900">Notifikasi</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-7"
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[350px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-default relative group ${!n.read ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-white' : 'bg-slate-50'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium">
                        {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Baru saja'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-xs font-bold text-slate-400">Belum ada notifikasi</p>
              <p className="text-[10px] text-slate-400 mt-1">Kami akan mengabari Anda jika ada beasiswa baru yang cocok!</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t border-slate-50 bg-slate-50/50 text-center">
           <Button variant="ghost" className="w-full text-[10px] font-bold text-slate-500 hover:text-slate-900 h-8">
             Lihat Semua Aktivitas
           </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
