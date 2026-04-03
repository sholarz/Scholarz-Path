import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNotifications } from '../../lib/notification-context';
import {
  Bell,
  Heart,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Calendar,
  GraduationCap,
  Megaphone,
  CheckCheck,
  Trash2,
  Archive,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { NotificationType } from '../../lib/notification-context';

const NOTIFICATION_ICONS: Record<NotificationType, any> = {
  post_like: Heart,
  post_comment: MessageSquare,
  comment_reply: MessageSquare,
  post_approved: Check,
  post_rejected: X,
  report_reviewed: AlertCircle,
  payment_approved: CreditCard,
  payment_rejected: CreditCard,
  deadline_reminder: Calendar,
  new_scholarship: GraduationCap,
  system_announcement: Megaphone,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  post_like: 'text-red-500 bg-red-50',
  post_comment: 'text-blue-500 bg-blue-50',
  comment_reply: 'text-blue-500 bg-blue-50',
  post_approved: 'text-green-500 bg-green-50',
  post_rejected: 'text-red-500 bg-red-50',
  report_reviewed: 'text-yellow-500 bg-yellow-50',
  payment_approved: 'text-green-500 bg-green-50',
  payment_rejected: 'text-red-500 bg-red-50',
  deadline_reminder: 'text-orange-500 bg-orange-50',
  new_scholarship: 'text-purple-500 bg-purple-50',
  system_announcement: 'text-blue-500 bg-blue-50',
};

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifikasi</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Tandai Semua Dibaca
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Semua
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              Semua ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Archive className="h-4 w-4" />
              Belum Dibaca ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'unread' ? 'Tidak Ada Notifikasi Baru' : 'Tidak Ada Notifikasi'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'unread'
                    ? 'Semua notifikasi sudah dibaca'
                    : 'Notifikasi Anda akan muncul di sini'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notification => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              const colorClasses = NOTIFICATION_COLORS[notification.type];

              return (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-primary' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.read && (
                                <Badge variant="default" className="h-5 px-2 text-xs">
                                  Baru
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                              locale: localeId,
                            })}
                            {notification.actionBy && ` • oleh ${notification.actionBy}`}
                          </p>

                          {notification.link && (
                            <Link
                              to={notification.link}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                Lihat Detail →
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
