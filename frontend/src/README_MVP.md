# ScholarzPath - Scholarship Platform MVP

## Overview
ScholarzPath is a comprehensive scholarship platform focused on helping international students find and apply for scholarships to study in Java, Indonesia. The MVP includes all essential features for scholarship discovery, tracking, application preparation, and deadline notification management.

## MVP Features Implemented

### 1. ✅ Authentication
- **Google OAuth Integration** (Mock implementation - ready for production OAuth)
- **Email/Password Login & Signup**
- **Forgot Password Flow**
- User session management with localStorage (ready to migrate to Supabase)
- **3-Tier User System**: Admin, Premium, Free users with role-based access

### 2. ✅ Search and Filter
- Full-text search across scholarships
- Filter by education level (Undergraduate, Master's, PhD)
- Filter by field of study
- Real-time results update

### 3. ✅ Scholarship Database
- **12 curated scholarships** focused on Java/Indonesia:
  - Indonesian Government Scholarship (KNB)
  - University of Indonesia
  - Gadjah Mada University (UGM)
  - Institut Teknologi Bandung (ITB)
  - LPDP Scholarship
  - And 7 more verified opportunities
- All scholarships include: title, provider, location, amount, deadline, requirements, benefits, and application URL
- **Regional Focus**: Exclusively covers scholarships in Java, Indonesia (Jakarta, Bandung, Yogyakarta, Surabaya, Semarang, Solo)

### 4. ✅ Scholarship Calendar
- Visual calendar view of all deadlines
- Month navigation
- Upcoming deadlines sidebar
- Color-coded urgent deadlines (30 days or less)

### 5. ✅ Bookmark System
- Save scholarships for later
- View all bookmarked scholarships
- Quick access from dashboard
- **Free user limit**: 3 bookmarks (Premium: unlimited)
- Persistent storage (localStorage, ready for Supabase migration)

### 6. ✅ Automated Preparation Timeline
- **Intelligent task breakdown** based on scholarship deadlines:
  - English language tests (TOEFL/IELTS)
  - Academic transcripts
  - Recommendation letters
  - Statement of purpose
  - Research proposals
  - Health certificates
  - Financial documents
  - Application submission
- **Automatic scheduling** - tasks are scheduled based on days before deadline
- **Progress tracking** - check off completed tasks
- **Time estimation** - estimated hours for each task
- **Visual progress indicators**
- **Overdue alerts** for missed tasks
- **Premium Feature**: Free users see preview only

### 7. ✅ Deadline Notifications & Calendar Integration ⭐ NEW
- **Visual Deadline Badges**:
  - Color-coded indicators (overdue, approaching, normal)
  - Days-left countdown on all scholarship cards
  - Bell icon alerts for urgent deadlines
  
- **Email Notification Settings** (per scholarship):
  - Configure notification preferences (14, 7, 3, 1 days before deadline)
  - Enable/disable email reminders
  - Notification status indicators
  - Preference management UI
  - Backend-ready structure (see EMAIL_NOTIFICATION_GUIDE.md)
  
- **Calendar Export**:
  - Download ICS files for any scholarship
  - Automatic deadline reminders in calendar apps
  - Works with Google Calendar, Outlook, Apple Calendar, etc.
  - Pre-configured alerts (7, 3, 1 days before deadline)
  - One-click export from bookmark and detail pages

## Project Structure

```
/
├── components/
│   ├── auth/                    # Authentication pages
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── dashboard/               # Dashboard
│   │   └── DashboardPage.tsx
│   ├── scholarships/            # Scholarship pages
│   │   ├── ScholarshipsPage.tsx
│   │   └── ScholarshipDetailPage.tsx
│   ├── calendar/                # Calendar view
│   │   └── CalendarPage.tsx
│   ├── bookmarks/               # Bookmarks
│   │   └── BookmarksPage.tsx
│   ├── timeline/                # Preparation timeline
│   │   └── TimelinePage.tsx
│   ├── Header.tsx               # Main navigation
│   ├── LandingPage.tsx          # Public landing page
│   ├── RootLayout.tsx           # Layout wrapper
│   ├── NotFoundPage.tsx         # 404 page
│   ├── NotificationSettings.tsx # Deadline notification management ⭐ NEW
│   └── PremiumFeatureLock.tsx   # Role-based access control
│
├── lib/
│   ├── auth-context.tsx         # Authentication state management
│   ├── bookmark-context.tsx     # Bookmark state management
│   ├── notification-context.tsx # Notification preferences ⭐ NEW
│   └── scholarship-data.ts      # Scholarship database
│
├── App.tsx                      # Main app component
├── routes.ts                    # React Router configuration
└── EMAIL_NOTIFICATION_GUIDE.md  # Backend implementation guide ⭐ NEW
```

## Key Technologies

- **React** with TypeScript
- **React Router** (Data mode) for navigation
- **Context API** for state management (Auth, Bookmarks, Notifications)
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **LocalStorage** for data persistence (migration path to Supabase available)

## Notification Features

### Frontend (Implemented)
✅ Notification preference UI
✅ ICS calendar file generation
✅ Deadline calculation and badges
✅ Notification status indicators
✅ Local preference storage

### Backend (Implementation Guide Provided)
📄 See `EMAIL_NOTIFICATION_GUIDE.md` for complete setup instructions:
- Email service integration (Resend/SendGrid)
- Scheduled job for daily checks
- Email template with deadline info
- Notification history tracking
- Unsubscribe functionality

## Getting Started

1. Visit the landing page at `/`
2. Click "Get Started" or "Sign Up" to create an account
3. Browse scholarships at `/scholarships`
4. Bookmark interesting opportunities
5. Set up deadline notifications for bookmarked scholarships
6. Export deadlines to your calendar
7. View deadlines in the calendar at `/calendar`
8. Generate personalized preparation timeline at `/timeline`

## Data Persistence

Currently using **localStorage** for:
- User authentication state
- Bookmarked scholarships
- Timeline task completion
- Notification preferences ⭐ NEW

This implementation provides a working MVP and can easily be migrated to **Supabase** for production use with proper backend persistence, authentication, real-time sync, and email delivery.

## Next Steps for Production

1. **Supabase Integration**:
   - Replace mock auth with Supabase Auth (Google OAuth + email/password)
   - Move bookmarks to Supabase database
   - Store timeline progress per user
   - Sync notification preferences to backend
   - Add user profiles

2. **Email Notification System** ⭐:
   - Set up email service (Resend recommended)
   - Implement scheduled notification checks
   - Deploy notification-scheduler Edge Function
   - Configure cron jobs for daily checks
   - Add email delivery monitoring

3. **Enhanced Features**:
   - Document upload and tracking
   - Application status tracking
   - Scholarship recommendations based on profile
   - In-app notifications (push notifications)
   - Email unsubscribe management

4. **Web Scraping**:
   - Automated scholarship data collection from Indonesian university websites
   - Regular updates to scholarship information
   - Deadline monitoring and alerts

## Regional Focus

ScholarzPath exclusively features scholarships for studying in **Java, Indonesia**, covering:
- **Jakarta** - University of Indonesia, BINUS University
- **Bandung** - Institut Teknologi Bandung (ITB), Telkom University, Universitas Padjadjaran
- **Yogyakarta** - Universitas Gadjah Mada (UGM)
- **Surabaya** - Universitas Airlangga
- **Semarang** - Universitas Diponegoro
- **Solo (Surakarta)** - Universitas Sebelas Maret
- **Malang** - Universitas Brawijaya

This focused approach allows students to find region-specific opportunities without being overwhelmed by international scholarships.

## Notes

- All scholarship data is currently static mock data focused on Java, Indonesia
- Google OAuth is mocked - ready for production OAuth implementation
- The platform is fully responsive and works on mobile devices
- All dates are properly calculated relative to current date
- Email notifications require backend implementation (guide provided)
- ICS calendar export works client-side (no backend needed)