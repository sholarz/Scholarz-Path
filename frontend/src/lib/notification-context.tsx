// Notification Context for managing deadline notifications
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';

export interface NotificationPreference {
  scholarshipId: string;
  emailEnabled: boolean;
  notifyDaysBefore: number[]; // e.g., [7, 3, 1] means notify 7 days, 3 days, and 1 day before deadline
  calendarAdded: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreference[];
  getPreference: (scholarshipId: string) => NotificationPreference | undefined;
  updatePreference: (preference: NotificationPreference) => void;
  removePreference: (scholarshipId: string) => void;
  enableEmailNotifications: (scholarshipId: string, daysBefore: number[]) => void;
  disableEmailNotifications: (scholarshipId: string) => void;
  markCalendarAdded: (scholarshipId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const savePreferences = (newPreferences: NotificationPreference[]) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
  };

  const getPreference = (scholarshipId: string) => {
    return preferences.find(p => p.scholarshipId === scholarshipId);
  };

  const updatePreference = (preference: NotificationPreference) => {
    const existingIndex = preferences.findIndex(p => p.scholarshipId === preference.scholarshipId);
    let newPreferences: NotificationPreference[];

    if (existingIndex >= 0) {
      newPreferences = [...preferences];
      newPreferences[existingIndex] = preference;
    } else {
      newPreferences = [...preferences, preference];
    }

    savePreferences(newPreferences);
    toast.success('Notification settings updated');
  };

  const removePreference = (scholarshipId: string) => {
    savePreferences(preferences.filter(p => p.scholarshipId !== scholarshipId));
  };

  const enableEmailNotifications = (scholarshipId: string, daysBefore: number[]) => {
    const existing = getPreference(scholarshipId);
    updatePreference({
      scholarshipId,
      emailEnabled: true,
      notifyDaysBefore: daysBefore,
      calendarAdded: existing?.calendarAdded || false,
    });
  };

  const disableEmailNotifications = (scholarshipId: string) => {
    const existing = getPreference(scholarshipId);
    if (existing) {
      updatePreference({
        ...existing,
        emailEnabled: false,
      });
    }
  };

  const markCalendarAdded = (scholarshipId: string) => {
    const existing = getPreference(scholarshipId);
    updatePreference({
      scholarshipId,
      emailEnabled: existing?.emailEnabled || false,
      notifyDaysBefore: existing?.notifyDaysBefore || [7, 3, 1],
      calendarAdded: true,
    });
    toast.success('Calendar event exported');
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        getPreference,
        updatePreference,
        removePreference,
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
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}

// Helper function to calculate days until deadline
export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to check if deadline is approaching
export function isDeadlineApproaching(deadline: Date, threshold: number = 7): boolean {
  const days = getDaysUntilDeadline(deadline);
  return days >= 0 && days <= threshold;
}

// Helper function to check if deadline is overdue
export function isDeadlineOverdue(deadline: Date): boolean {
  return getDaysUntilDeadline(deadline) < 0;
}

// Helper function to generate ICS calendar file content
export function generateICSFile(
  scholarshipTitle: string,
  deadline: Date,
  description: string,
  applicationUrl: string
): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();
  const deadlineEnd = new Date(deadline);
  deadlineEnd.setHours(23, 59, 59);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarPath//Scholarship Deadline//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(deadline)}`,
    `DTEND:${formatDate(deadlineEnd)}`,
    `DTSTAMP:${formatDate(now)}`,
    `UID:scholarship-${Date.now()}@scholarpath.com`,
    `SUMMARY:Scholarship Deadline: ${scholarshipTitle}`,
    `DESCRIPTION:${description}\\n\\nApplication URL: ${applicationUrl}`,
    `URL:${applicationUrl}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Scholarship deadline in 7 days',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Scholarship deadline in 3 days',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Scholarship deadline tomorrow',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

// Helper function to download ICS file
export function downloadICSFile(
  scholarshipTitle: string,
  deadline: Date,
  description: string,
  applicationUrl: string
): void {
  const icsContent = generateICSFile(scholarshipTitle, deadline, description, applicationUrl);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scholarship-${scholarshipTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
