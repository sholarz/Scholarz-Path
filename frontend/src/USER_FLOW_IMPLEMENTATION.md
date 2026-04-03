# 🚀 User Flow & State Logic Implementation

## Overview

This document outlines the comprehensive user flow and state logic implementation for ScholarPath, including authentication flows, role-based access control, and visual indicators for user types.

---

## 🔐 Authentication Flow

### Login Process

**Success Flow:**
1. User enters credentials (email + password) or uses Google OAuth
2. System validates credentials against test accounts
3. On success:
   - User data stored in state & localStorage
   - Toast notification: "Welcome back!"
   - **Automatic redirect to `/dashboard`**
4. Loading state shown during authentication (800ms simulated delay)

**Error Flow:**
1. Invalid credentials entered
2. Error message displayed: "Invalid email or password. Please try again."
3. User remains on login page
4. Can retry login or use "Forgot Password" link

**Test Accounts:**
```
Admin:
Email: admin@scholarpath.com
Password: admin123

Premium User:
Email: premium@test.com
Password: premium123

Free User:
Email: user@test.com
Password: user123
```

### Protected Routes

**Unauthenticated Access:**
- User tries to access protected route (dashboard, bookmarks, timeline, tests, calendar)
- **Automatic redirect to `/login` page**
- User must authenticate to access content

**Protected Pages:**
- `/dashboard` - User dashboard
- `/calendar` - Calendar view
- `/bookmarks` - Saved scholarships
- `/timeline` - Preparation timeline
- `/tests` - Test simulations
- `/tests/:id` - Individual test execution

**Public Pages:**
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/forgot-password` - Password reset
- `/scholarships` - Browse scholarships (accessible to all)
- `/scholarships/:id` - Scholarship details (accessible to all)

### Logout Flow

1. User clicks "Logout" in dropdown menu
2. User state cleared from memory and localStorage
3. **Automatic redirect to `/login` page**
4. User cannot access protected routes

---

## 👥 Role-Based UI States

### 1. Free User

**Limitations:**
- **Bookmark Limit:** Maximum 5 scholarships
- **Locked Features:** Automated Preparation Timeline
- **Advanced Filters:** Basic filters only

**Visual Indicators:**
- No role badge displayed
- "Upgrade to Premium" button in header (crown icon)
- Upgrade prompts when clicking locked features

**Bookmark Limits:**
- Alert shown when 2 or fewer bookmarks remaining (warning)
- Alert shown when bookmark limit reached
- Cannot bookmark more than 5 scholarships
- Must remove existing bookmarks to add new ones

**Locked Features:**
- **Preparation Timeline:** 
  - Blurred preview shown
  - Lock overlay with "Upgrade to Premium" button
  - Click triggers upgrade modal
  
### 2. Premium User

**Access:**
- **Unlimited bookmarks**
- **Full access to Preparation Timeline**
- **Advanced search filters**
- **Priority support**

**Visual Indicators:**
- 👑 **Crown badge** next to name in dropdown
- Small crown icon on profile avatar (top-right corner)
- Premium badge (yellow) in profile menu
- Badge displays: "👑 Premium"

**Features Unlocked:**
- All timeline tasks with progress tracking
- Advanced scholarship filters
- Export capabilities
- Custom deadline reminders

### 3. Admin User

**Access:**
- Full access to all features
- All premium features included
- Admin-specific UI elements

**Visual Indicators:**
- 🛡️ **Shield badge** next to name in dropdown
- Admin badge (blue) in profile menu
- Badge displays: "🛡️ Admin"
- No "Upgrade" button shown

**Special Access:**
- Admin panel access (planned)
- User management (planned)
- Content moderation (planned)

---

## 🔒 Locked Feature Component

### Visual Elements

**Lock Overlay:**
- Blurred background (preview of locked content)
- Semi-transparent backdrop (80% opacity)
- Center-aligned lock icon (yellow)
- Feature title
- Description text
- "Upgrade to Premium" button

**Behavior:**
- Free users see locked overlay
- Premium/Admin users see full content
- Click on button opens upgrade modal

**Example Implementation:**
```tsx
<LockedFeature feature="Automated Preparation Timeline">
  {/* Premium content here */}
</LockedFeature>
```

---

## 🎨 Visual Indicators

### Role Badges

**Premium Badge:**
- Background: Yellow (bg-yellow-100)
- Text: Yellow-700
- Icon: Crown (👑)
- Size: Small (sm) or Medium (md)

**Admin Badge:**
- Background: Blue (bg-blue-100)
- Text: Blue-700
- Icon: Shield (🛡️)
- Size: Small (sm) or Medium (md)

**Free User:**
- No badge displayed
- Clean, simple UI

### Lock Icons

**Locked Features:**
- Lock icon (🔒) displayed on restricted content
- Yellow color scheme (matches premium theme)
- Clear "Premium Only" or "Locked" labels

### Progress Indicators

**Bookmark Limits (Free Users):**
- Info alert when 2 or fewer bookmarks left
- Warning alert when limit reached
- Crown icon in alerts

**Timeline Progress:**
- Progress bar showing completion percentage
- Stats cards: Completed, Remaining, Hours Done, Hours Left
- Task status badges: Completed, In Progress, Overdue

---

## 🎯 Interaction Flows

### Free User Clicks Locked Feature

1. User clicks on locked feature (e.g., Timeline)
2. Upgrade modal appears with:
   - Premium features list
   - Pricing information (Rp 99,000/month)
   - "Upgrade Now" button
   - "Maybe Later" button
3. Click "Upgrade Now":
   - Modal closes
   - Redirect to dashboard upgrade tab
4. Click "Maybe Later":
   - Modal closes
   - User remains on current page

### User Logs Out

1. User clicks profile dropdown
2. Clicks "Logout" option
3. Confirmation (none - instant logout)
4. State cleared
5. **Redirect to `/login` page**
6. Cannot access protected routes without re-authentication

### Bookmark Management (Free User)

1. User has 5 bookmarks (limit reached)
2. Alert displayed: "You have reached the bookmark limit..."
3. User tries to bookmark new scholarship:
   - Toast error: "Bookmark limit reached"
   - Prompt to upgrade or remove existing bookmarks
4. User can:
   - Remove existing bookmarks to make space
   - Upgrade to Premium for unlimited bookmarks

---

## 📊 State Management

### Auth State

```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Methods:**
- `login(email, password)` - Email/password auth
- `loginWithGoogle()` - Google OAuth auth
- `signup(email, password, name)` - Create new account
- `logout()` - Clear session
- `resetPassword(email)` - Password reset flow
- `upgradeToPremium()` - Upgrade user role
- `clearError()` - Clear error messages

### Bookmark State

```typescript
{
  bookmarks: string[];
  addBookmark(id): void;
  removeBookmark(id): void;
  hasBookmark(id): boolean;
}
```

**Free User Limits:**
- Maximum 5 bookmarks
- Visual warnings at 2 remaining
- Cannot add more when limit reached

---

## 🎨 Design Consistency

### Color Palette

**Premium Features:**
- Primary: Yellow (#FCD34D)
- Background: Yellow-100 (#FEF3C7)
- Text: Yellow-700 (#CA8A04)
- Icon: Crown (👑)

**Admin Features:**
- Primary: Blue (#60A5FA)
- Background: Blue-100 (#DBEAFE)
- Text: Blue-700 (#1D4ED8)
- Icon: Shield (🛡️)

**Locked Features:**
- Overlay: Background 80% opacity
- Blur: 2px backdrop blur + 4px content blur
- Icon: Lock (🔒) with yellow theme

### Typography

**Badges:**
- Font: Medium weight (500)
- Size: Small (0.875rem)
- Padding: Compact

**Alerts:**
- Font: Regular weight (400)
- Size: Small (0.875rem)
- Icon: Left-aligned

---

## ✅ Implementation Checklist

### Authentication
- [x] Login with email/password
- [x] Login with Google OAuth
- [x] Error state handling
- [x] Loading states
- [x] Redirect to dashboard on success
- [x] Protected route middleware
- [x] Logout with redirect to login

### Role-Based Access
- [x] Free user limitations
- [x] Premium user full access
- [x] Admin user full access
- [x] Role badges in UI
- [x] Visual role indicators

### Locked Features
- [x] LockedFeature component
- [x] Blur + lock overlay
- [x] Upgrade modal
- [x] Premium-only timeline
- [x] Feature restriction logic

### Visual Indicators
- [x] Premium badge (crown)
- [x] Admin badge (shield)
- [x] Lock icons
- [x] Bookmark limit warnings
- [x] Progress indicators

### User Flows
- [x] Login → Dashboard flow
- [x] Logout → Login flow
- [x] Locked feature → Upgrade modal
- [x] Bookmark limit handling
- [x] Protected route redirects

---

## 🚀 Usage Examples

### Check User Role

```typescript
const { user } = useAuth();

if (user?.role === 'free') {
  // Show locked features
}

if (user?.role === 'premium' || user?.role === 'admin') {
  // Show full features
}
```

### Protect a Feature

```typescript
<LockedFeature feature="Automated Timeline">
  <TimelineContent />
</LockedFeature>
```

### Check Bookmark Limit

```typescript
const { bookmarks } = useBookmarks();
const { user } = useAuth();

const FREE_LIMIT = 5;
const canBookmark = user?.role !== 'free' || bookmarks.length < FREE_LIMIT;
```

### Show Role Badge

```typescript
import { RoleBadge } from './components/RoleBadge';

{user && <RoleBadge role={user.role} size="sm" />}
```

---

## 📝 Notes

- All authentication currently uses mock data
- In production, replace with real API calls
- Role changes are stored in localStorage
- Logout clears all user data
- Protected routes automatically redirect
- Upgrade flow connects to payment system

---

**Status:** ✅ **COMPLETE**
**Last Updated:** March 30, 2026
