import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';
import { ApiError, apiDelete, apiGet, apiPut } from './api-client';

export type NotificationType = 
  | 'post_like'
  | 'post_comment'
  | 'comment_reply'
  | 'post_approved'
  | 'post_rejected'
  | 'report_reviewed'
  | 'payment_approved'
  | 'payment_rejected'
  | 'deadline_reminder'
  | 'new_scholarship'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  actionBy?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  scholarshipId: string;
  emailEnabled: boolean;
  notifyDaysBefore: number[];
  calendarAdded: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getPreference: (scholarshipId: string) => NotificationPreference | undefined;
  enableEmailNotifications: (scholarshipId: string, daysBefore: number[]) => void;
  disableEmailNotifications: (scholarshipId: string) => void;
  markCalendarAdded: (scholarshipId: string) => void;
}

type BackendNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string | null;
  action_by?: string | null;
  metadata?: Record<string, any> | null;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'post_like',
    title: 'Post Anda disukai',
    message: 'Budi Santoso menyukai post Anda "Tips Lolos Beasiswa LPDP 2026"',
    read: false,
    createdAt: new Date('2026-04-03T10:30:00'),
    link: '/forum/1',
    actionBy: 'Budi Santoso',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'post_comment',
    title: 'Komentar baru',
    message: 'Siti Nurhaliza berkomentar pada post Anda',
    read: false,
    createdAt: new Date('2026-04-03T09:15:00'),
    link: '/forum/1',
    actionBy: 'Siti Nurhaliza',
  },
  {
    id: '3',
    userId: 'user1',
    type: 'deadline_reminder',
    title: 'Pengingat Deadline',
    message: 'Beasiswa LPDP 2026 akan ditutup dalam 7 hari',
    read: true,
    createdAt: new Date('2026-04-02T08:00:00'),
    link: '/scholarships/lpdp-2026',
  },
  {
    id: '4',
    userId: 'user1',
    type: 'new_scholarship',
    title: 'Beasiswa Baru!',
    message: 'Beasiswa Chevening 2026 telah ditambahkan',
    read: true,
    createdAt: new Date('2026-04-01T14:00:00'),
    link: '/scholarships/chevening-2026',
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const mapBackendNotification = (row: BackendNotification): Notification => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: Boolean(row.is_read),
    createdAt: new Date(row.created_at),
    link: row.link || undefined,
    actionBy: row.action_by || undefined,
    metadata: row.metadata || undefined,
  });

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const rows = await apiGet<BackendNotification[]>(`/notifications`);
        setNotifications(rows.map(mapBackendNotification));
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setNotifications([]);
          return;
        }

        setNotifications([]);
      }
    };

    void loadNotifications();
  }, [user?.id]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    if (user) {
      void apiPut(`/notifications/${id}/read`).catch(() => {
        // Keep optimistic UI state.
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );

    if (user) {
      void apiPut('/notifications/mark-all-read').catch(() => {
        // Keep optimistic UI state.
      });
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (user) {
      void apiDelete(`/notifications/${id}`).catch(() => {
        // Keep optimistic UI state.
      });
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getPreference = (scholarshipId: string) => {
    return preferences.find(p => p.scholarshipId === scholarshipId);
  };

  const enableEmailNotifications = (scholarshipId: string, daysBefore: number[]) => {
    setPreferences(prev => {
      const existingPreference = prev.find(p => p.scholarshipId === scholarshipId);
      if (existingPreference) {
        return prev.map(p => 
          p.scholarshipId === scholarshipId ? { ...p, emailEnabled: true, notifyDaysBefore: daysBefore } : p
        );
      } else {
        return [...prev, { scholarshipId, emailEnabled: true, notifyDaysBefore: daysBefore, calendarAdded: false }];
      }
    });
  };

  const disableEmailNotifications = (scholarshipId: string) => {
    setPreferences(prev => {
      const existingPreference = prev.find(p => p.scholarshipId === scholarshipId);
      if (existingPreference) {
        return prev.map(p => 
          p.scholarshipId === scholarshipId ? { ...p, emailEnabled: false } : p
        );
      } else {
        return [...prev, { scholarshipId, emailEnabled: false, notifyDaysBefore: [], calendarAdded: false }];
      }
    });
  };

  const markCalendarAdded = (scholarshipId: string) => {
    setPreferences(prev => {
      const existingPreference = prev.find(p => p.scholarshipId === scholarshipId);
      if (existingPreference) {
        return prev.map(p => 
          p.scholarshipId === scholarshipId ? { ...p, calendarAdded: true } : p
        );
      } else {
        return [...prev, { scholarshipId, emailEnabled: false, notifyDaysBefore: [], calendarAdded: true }];
      }
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        getPreference,
        enableEmailNotifications,
        disableEmailNotifications,
        markCalendarAdded,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

// Utility functions for deadline notifications
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isDeadlineOverdue(deadline: Date): boolean {
  return getDaysUntilDeadline(deadline) < 0;
}

export function isDeadlineApproaching(deadline: Date): boolean {
  const days = getDaysUntilDeadline(deadline);
  return days >= 0 && days <= 7; // Within 7 days
}

// Download ICS file for calendar
export function downloadICSFile(scholarship: { title: string; deadline: Date; description?: string; location?: string }) {
  const { title, deadline, description, location } = scholarship;
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarPath//Scholarship Reminder//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(deadline)}`,
    `DTEND:${formatDate(deadline)}`,
    `SUMMARY:Deadline: ${title}`,
    `DESCRIPTION:${description || `Deadline untuk ${title}`}`,
    `LOCATION:${location || 'Online'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Pengingat: Deadline ${title} dalam 7 hari`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/[^a-z0-9]/gi, '-')}-reminder.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}