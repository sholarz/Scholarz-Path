import { useState } from 'react';
import { Bell, Calendar, Check, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { 
  useNotifications, 
  downloadICSFile,
  getDaysUntilDeadline,
  isDeadlineOverdue,
  isDeadlineApproaching 
} from '../lib/notification-context';
import { Scholarship } from '../lib/scholarship-data';
import { toast } from 'sonner@2.0.3';

interface NotificationSettingsProps {
  scholarship: Scholarship;
}

export function NotificationSettings({ scholarship }: NotificationSettingsProps) {
  const {
    getPreference,
    enableEmailNotifications,
    disableEmailNotifications,
    markCalendarAdded,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const preference = getPreference(scholarship.id);
  const [emailEnabled, setEmailEnabled] = useState(preference?.emailEnabled || false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    preference?.notifyDaysBefore || [7, 3, 1]
  );

  const daysUntilDeadline = getDaysUntilDeadline(scholarship.deadline);
  const isOverdue = isDeadlineOverdue(scholarship.deadline);
  const isApproaching = isDeadlineApproaching(scholarship.deadline);

  const handleSaveNotifications = () => {
    if (emailEnabled && selectedDays.length > 0) {
      enableEmailNotifications(scholarship.id, selectedDays);
      toast.success('Email notifications enabled', {
        description: `You'll receive reminders ${selectedDays.sort((a, b) => b - a).join(', ')} days before the deadline.`
      });
    } else if (!emailEnabled) {
      disableEmailNotifications(scholarship.id);
      toast.info('Email notifications disabled');
    } else {
      toast.error('Please select at least one notification day');
      return;
    }
    setOpen(false);
  };

  const handleDownloadCalendar = () => {
    downloadICSFile(
      scholarship.title,
      scholarship.deadline,
      scholarship.description,
      scholarship.applicationUrl
    );
    markCalendarAdded(scholarship.id);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="w-4 h-4" />
          Notifications
          {preference?.emailEnabled && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0">
              <Mail className="w-3 h-3" />
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Deadline Notifications
          </DialogTitle>
          <DialogDescription>
            Set up reminders for {scholarship.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Deadline Status */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-lg font-semibold">
                  {scholarship.deadline.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {isOverdue ? (
                <Badge variant="destructive">Overdue</Badge>
              ) : isApproaching ? (
                <Badge className="bg-yellow-500">
                  {daysUntilDeadline} days left
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {daysUntilDeadline} days left
                </Badge>
              )}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive deadline reminders via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            {emailEnabled && (
              <div className="pl-6 space-y-2 border-l-2 border-muted">
                <p className="text-sm font-medium">Notify me:</p>
                {[14, 7, 3, 1].map(days => (
                  <div key={days} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${days}`}
                      checked={selectedDays.includes(days)}
                      onCheckedChange={() => toggleDay(days)}
                    />
                    <label
                      htmlFor={`day-${days}`}
                      className="text-sm cursor-pointer"
                    >
                      {days === 1 ? '1 day' : `${days} days`} before deadline
                    </label>
                  </div>
                ))}
              </div>
            )}

            {emailEnabled && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Email notifications require backend setup. 
                  In this demo, notification preferences are saved locally.
                </p>
              </div>
            )}
          </div>

          {/* Calendar Export */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Add to Calendar
            </Label>
            <p className="text-sm text-muted-foreground">
              Download an ICS file to add this deadline to your calendar app
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleDownloadCalendar}
            >
              <Calendar className="w-4 h-4" />
              Download Calendar Event
              {preference?.calendarAdded && (
                <Check className="w-4 h-4 text-green-600 ml-auto" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveNotifications}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component for displaying deadline badge on scholarship cards
export function DeadlineBadge({ deadline }: { deadline: Date }) {
  const daysUntil = getDaysUntilDeadline(deadline);
  const isOverdue = isDeadlineOverdue(deadline);
  const isApproaching = isDeadlineApproaching(deadline);

  if (isOverdue) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Bell className="w-3 h-3" />
        Overdue
      </Badge>
    );
  }

  if (isApproaching) {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 gap-1">
        <Bell className="w-3 h-3" />
        {daysUntil} days left
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      {daysUntil} days left
    </Badge>
  );
}
