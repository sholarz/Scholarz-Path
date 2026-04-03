import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
  post_like: 'text-red-500',
  post_comment: 'text-blue-500',
  comment_reply: 'text-blue-500',
  post_approved: 'text-green-500',
  post_rejected: 'text-red-500',
  report_reviewed: 'text-yellow-500',
  payment_approved: 'text-green-500',
  payment_rejected: 'text-red-500',
  deadline_reminder: 'text-orange-500',
  new_scholarship: 'text-purple-500',
  system_announcement: 'text-blue-500',
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifikasi</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} belum dibaca
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Tandai semua
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Hapus semua
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const Icon = NOTIFICATION_ICONS[notification.type];
                const iconColor = NOTIFICATION_COLORS[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    {notification.link ? (
                      <Link
                        to={notification.link}
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                        className="block"
                      >
                        <NotificationContent
                          notification={notification}
                          Icon={Icon}
                          iconColor={iconColor}
                        />
                      </Link>
                    ) : (
                      <div onClick={() => markAsRead(notification.id)}>
                        <NotificationContent
                          notification={notification}
                          Icon={Icon}
                          iconColor={iconColor}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link to="/notifications" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full text-sm">
                  Lihat Semua Notifikasi
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({
  notification,
  Icon,
  iconColor,
}: {
  notification: any;
  Icon: any;
  iconColor: string;
}) {
  return (
    <div className="flex gap-3">
      <div className={`mt-1 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-1">{notification.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(notification.createdAt, {
              addSuffix: true,
              locale: localeId,
            })}
          </p>
          {!notification.read && (
            <Badge variant="default" className="h-5 px-1.5 text-xs">
              Baru
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
