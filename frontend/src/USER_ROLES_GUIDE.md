# User Roles & Features Guide

This guide explains the 3 user roles in ScholarPath and how to test each one.

## 🎭 User Roles

### 1. **Free User** (Default)
- Default role for all new signups
- Limited features with upgrade prompts

**Features:**
- ✅ Browse all scholarships
- ✅ Search and filter scholarships
- ✅ View scholarship details
- ✅ Calendar view with deadlines
- ⚠️ **Limited to 3 bookmarks** (with upgrade prompt)
- 🔒 **Preparation Timeline locked** (premium feature)

**Visual Indicators:**
- Bookmark counter shows "X/3" in dashboard
- Yellow upgrade notice card on dashboard
- Premium badge on Timeline quick action button
- Lock icon overlay on Timeline page
- Toast notification when bookmark limit reached

---

### 2. **Premium User**
- Paid subscription tier
- Full access to all features

**Features:**
- ✅ Browse all scholarships
- ✅ Search and filter scholarships
- ✅ View scholarship details
- ✅ Calendar view with deadlines
- ✅ **Unlimited bookmarks**
- ✅ **Full Preparation Timeline access** with task tracking

**Visual Indicators:**
- Premium badge (gold crown) next to name in header dropdown
- Premium badge in dashboard welcome section
- Gold crown icon on user avatar in header
- No bookmark limits shown
- No upgrade prompts

---

### 3. **Admin User**
- Full administrative access
- Access to all premium features + admin capabilities

**Features:**
- ✅ All Premium features
- ✅ **Unlimited bookmarks**
- ✅ **Full Preparation Timeline access**
- ✅ Admin-specific dashboard notice

**Visual Indicators:**
- Blue "Admin" badge in header dropdown
- Blue "Admin" badge in dashboard welcome section
- Blue admin notice card on dashboard
- No limitations or locks

---

## 🧪 How to Test Each Role

### Testing as **Free User**
1. Sign up with any email (e.g., `test@example.com`)
2. Or use Google OAuth
3. Default role will be `free`
4. Try to bookmark more than 3 scholarships - you'll see an error toast
5. Visit Timeline page - you'll see the premium lock overlay

### Testing as **Premium User**
1. Sign up or login as a free user
2. Click the "Upgrade" button in:
   - Header (top right, gold button)
   - Dashboard upgrade notice card
   - Timeline premium lock modal
3. Your role will change to `premium`
4. Refresh the page to see premium features unlocked

### Testing as **Admin User**
1. Login with email: `admin@scholarpath.com`
2. Use any password
3. You'll automatically get admin role
4. See admin notice on dashboard
5. All features are unlocked

---

## 🎨 Visual Differences Summary

### Dashboard
- **Free**: Yellow upgrade card, bookmark limit shown (X/3), Premium badge on Timeline button
- **Premium**: Gold Premium badge, no limits, no upgrade prompts
- **Admin**: Blue Admin badge, blue admin notice card, no limits

### Header
- **Free**: "Upgrade" button visible, plain user icon
- **Premium**: Gold crown on user avatar, Premium badge in dropdown
- **Admin**: Admin badge in dropdown, no upgrade button

### Timeline Page
- **Free**: Blurred preview with lock overlay and upgrade modal
- **Premium**: Full access with task tracking
- **Admin**: Full access with task tracking

### Bookmarks
- **Free**: Toast error after 3 bookmarks, "Limit reached" text on dashboard
- **Premium**: No limits, unlimited bookmarks
- **Admin**: No limits, unlimited bookmarks

---

## 💡 Quick Test Script

```
# Test Free User Flow
1. Sign up → See free user dashboard
2. Bookmark 3 scholarships → See "X/3" counter
3. Try to bookmark 4th → See error toast
4. Click Timeline → See premium lock
5. Click Upgrade → Become premium user

# Test Premium User Flow
1. After upgrading → See Premium badge
2. Bookmark unlimited scholarships
3. Access Timeline → Full task tracking
4. No upgrade prompts anywhere

# Test Admin Flow
1. Login as admin@scholarpath.com
2. See Admin badge and notice
3. Full access to everything
4. No limitations
```

---

## 🔄 Role Persistence

User roles are saved in localStorage, so they persist across page refreshes. To reset:
- Logout and login again
- Clear localStorage in browser DevTools
