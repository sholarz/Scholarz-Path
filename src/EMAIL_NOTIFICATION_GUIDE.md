# Email Notification Backend Implementation Guide

This document outlines how to implement the email notification backend for scholarship deadline reminders.

## Overview

The frontend is already configured to:
- Store notification preferences locally (localStorage)
- Generate ICS calendar files for download
- Display deadline badges and warnings
- Allow users to configure notification settings (7, 3, 1 days before deadline)

## Backend Requirements

To enable actual email notifications, you need to implement a Supabase Edge Function with scheduled job capabilities.

### 1. Email Service Setup

Choose an email service provider:
- **Resend** (recommended for Supabase)
- **SendGrid**
- **Amazon SES**
- **Mailgun**

Example with Resend:
```typescript
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
```

### 2. Database Schema (Using KV Store)

Store notification preferences and email history:

```typescript
// Notification preferences key format: 
// "notification:user:{userId}:{scholarshipId}"
interface NotificationPref {
  scholarshipId: string;
  userId: string;
  email: string;
  emailEnabled: boolean;
  notifyDaysBefore: number[];
  lastNotified?: {
    [days: number]: string; // ISO date when last notified
  };
}

// Email history key format:
// "email_sent:{scholarshipId}:{userId}:{days}"
interface EmailRecord {
  sentAt: string;
  scholarshipId: string;
  userId: string;
  daysBeforeDeadline: number;
  status: 'sent' | 'failed';
}
```

### 3. Scheduled Job Implementation

Create a new Supabase Edge Function for checking and sending notifications:

**File: `/supabase/functions/notification-scheduler/index.ts`**

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';
import * as kv from '../server/kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function checkAndSendNotifications() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all notification preferences
  const prefs = await kv.getByPrefix('notification:user:');
  
  for (const pref of prefs) {
    if (!pref.emailEnabled) continue;
    
    // Load scholarship data
    const scholarship = await getScholarship(pref.scholarshipId);
    if (!scholarship) continue;
    
    const deadline = new Date(scholarship.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    const daysUntil = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if we should send notification
    for (const days of pref.notifyDaysBefore) {
      if (daysUntil === days) {
        // Check if already sent
        const emailKey = `email_sent:${pref.scholarshipId}:${pref.userId}:${days}`;
        const alreadySent = await kv.get(emailKey);
        
        if (!alreadySent) {
          await sendNotificationEmail(pref, scholarship, days);
          
          // Mark as sent
          await kv.set(emailKey, {
            sentAt: new Date().toISOString(),
            scholarshipId: pref.scholarshipId,
            userId: pref.userId,
            daysBeforeDeadline: days,
            status: 'sent',
          });
        }
      }
    }
  }
}

async function sendNotificationEmail(pref, scholarship, daysBeforeDeadline) {
  const subject = daysBeforeDeadline === 1
    ? `⏰ Tomorrow: ${scholarship.title} Deadline`
    : `⏰ ${daysBeforeDeadline} Days Left: ${scholarship.title} Deadline`;
  
  const html = generateEmailHTML(scholarship, daysBeforeDeadline);
  
  try {
    await resend.emails.send({
      from: 'ScholarPath <notifications@scholarpath.com>',
      to: pref.email,
      subject: subject,
      html: html,
    });
    
    console.log(`Notification sent to ${pref.email} for scholarship ${scholarship.id}`);
  } catch (error) {
    console.error(`Failed to send email to ${pref.email}:`, error);
  }
}

function generateEmailHTML(scholarship, days) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .deadline-box { 
          background: #fff3cd; 
          border-left: 4px solid #ffc107; 
          padding: 15px; 
          margin: 20px 0; 
        }
        .btn { 
          display: inline-block; 
          background: #0066cc; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px;
          margin: 10px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 ScholarPath Deadline Reminder</h1>
        </div>
        
        <div class="content">
          <h2>${scholarship.title}</h2>
          <p><strong>Provider:</strong> ${scholarship.provider}</p>
          <p><strong>Location:</strong> ${scholarship.location}, ${scholarship.country}</p>
          
          <div class="deadline-box">
            <h3 style="margin-top: 0;">⏰ Deadline Alert</h3>
            <p><strong>${days} day${days !== 1 ? 's' : ''} remaining until deadline!</strong></p>
            <p>Deadline: ${new Date(scholarship.deadline).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          
          <p><strong>Amount:</strong> ${scholarship.amount}</p>
          <p><strong>Education Level:</strong> ${scholarship.educationLevel}</p>
          
          <a href="${scholarship.applicationUrl}" class="btn" target="_blank">
            Apply Now
          </a>
          
          <p style="margin-top: 20px;">
            Don't forget to prepare all required documents and submit your application before the deadline!
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from ScholarPath</p>
          <p>To manage your notification settings, visit your bookmarks page</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Run the scheduler
Deno.serve(async (req) => {
  try {
    await checkAndSendNotifications();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 4. Schedule the Function

Use a cron service to trigger the notification function daily:

**Option 1: Supabase pg_cron**
```sql
SELECT cron.schedule(
  'notification-scheduler',
  '0 8 * * *', -- Run at 8:00 AM daily
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

**Option 2: External Cron Service**
- GitHub Actions
- AWS EventBridge
- Google Cloud Scheduler
- Vercel Cron Jobs

### 5. Sync Notification Preferences to Backend

Update frontend to sync preferences to backend:

```typescript
// After user saves notification settings
async function syncNotificationPreferences(
  userId: string,
  scholarshipId: string,
  preference: NotificationPreference
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/make-server-fa89ae13/notifications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId,
        scholarshipId,
        preference,
      }),
    }
  );
  
  return response.json();
}
```

### 6. Security Considerations

- Store API keys in Supabase secrets
- Validate user authentication for preference updates
- Rate limit email sending
- Implement unsubscribe functionality
- Comply with email regulations (CAN-SPAM, GDPR)

### 7. Testing

Test notifications without waiting for actual deadlines:

```typescript
// Add test mode parameter
const testMode = Deno.env.get('TEST_MODE') === 'true';

if (testMode) {
  // Simulate different days before deadline
  const testDaysUntil = 3; // Test 3-day notification
}
```

## Environment Variables Needed

Add these to your Supabase project:

```
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=notifications@scholarpath.com
ADMIN_EMAIL=admin@scholarpath.com
TEST_MODE=false
```

## Notes

- The current frontend implementation stores preferences locally
- Backend implementation is required for actual email delivery
- Consider implementing a notification history page for users
- Add email preference management (frequency, types, unsubscribe)
- Monitor email delivery rates and bounces
