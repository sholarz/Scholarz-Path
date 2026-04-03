# User Subscription Snapshot Component

## Overview

The **User Subscription Snapshot** is a critical UI component designed to display a user's subscription status and payment history directly on the payment confirmation page. It prevents duplicate payment approvals by showing admins whether a user has already paid for a specific scholarship.

## Component Location

- **File:** `/components/payment/UserSubscriptionSnapshot.tsx`
- **Integration:** Placed in `/components/payment/PaymentConfirmation.tsx` directly above the "Confirm Payment" button
- **Demo:** Available at `/subscription-snapshot-demo`

## Design Specifications

### Dimensions
- **Width:** 320px (fixed)
- **Height:** Auto (dynamic based on content)
- **Padding:** 16px
- **Spacing:** 12px (vertical gap between elements)
- **Border Radius:** 12px
- **Background:** White (#FFFFFF)
- **Border:** 1px solid gray-200
- **Shadow:** Soft shadow (Tailwind `shadow-sm`)

### Visual Elements

1. **Card Title**
   - Text: "Subscription Snapshot"
   - Size: 14px
   - Weight: Bold
   - Color: Gray-600

2. **Status Indicator Dot**
   - Green (#22C55E) for Premium users
   - Gray (#9CA3AF) for Free users
   - Size: 8px (w-2 h-2)
   - Shape: Circle (rounded-full)

3. **Icons**
   - Check icon (green) for payment history exists
   - X icon (red) for no payment history
   - Alert Triangle (yellow) for duplicate payment warning

## Component Variants

### Variant A: Free User + Never Paid
**Most common for new users**

```tsx
<UserSubscriptionSnapshot 
  targetUserRole="free"
  isAdminView={false}
/>
```

**Display:**
- Gray dot + "Free" text
- Subtext: "Upgrade to unlock"
- Previously paid: No (with red X icon)
- No warning banner

---

### Variant B: Premium User + Never Paid (Rare)
**Occurs when user gets promotional upgrade or admin grants premium**

```tsx
<UserSubscriptionSnapshot 
  targetUserRole="premium"
  isAdminView={false}
/>
```

**Display:**
- Green dot + "Premium" text
- Subtext: "Active until [date]"
- Previously paid: No (with red X icon)
- No warning banner

---

### Variant C: Premium User + Already Paid
**Most common for paying premium users**

```tsx
<UserSubscriptionSnapshot 
  targetUserRole="premium"
  isAdminView={false}
/>
```

**Display:**
- Green dot + "Premium" text
- Subtext: "Active until [date]"
- Previously paid: Yes (with green check icon)
- Shows last payment date and method
- No warning banner (not admin view)

---

### Variant D: Admin View + Duplicate Payment Warning
**Critical variant for preventing double approvals**

```tsx
<UserSubscriptionSnapshot 
  targetUserRole="premium"
  scholarshipId="SCH001"
  isAdminView={true}
/>
```

**Display:**
- All elements from Variant C, PLUS:
- **Yellow warning banner** with:
  - Background: #FFF3CD (yellow-50)
  - Border: #FDE68A (yellow-200)
  - Alert triangle icon
  - Text: "⚠️ Check before approve. User already paid for this scholarship on [date]"

## Props Interface

```typescript
interface UserSubscriptionSnapshotProps {
  // For admin viewing another user's payment
  targetUserId?: string;
  
  // Override displayed role (for admin view)
  targetUserRole?: 'free' | 'premium';
  
  // Scholarship ID to check for duplicate payments
  scholarshipId?: string;
  
  // Enables admin-specific features (warning banner)
  isAdminView?: boolean;
}
```

## Integration Example

### In Payment Confirmation Page

```tsx
import { UserSubscriptionSnapshot } from './UserSubscriptionSnapshot';

export function PaymentConfirmation() {
  return (
    <div className="space-y-6">
      {/* Payment details above */}
      
      {/* Subscription Snapshot - Placed for visibility */}
      <div className="flex justify-center">
        <UserSubscriptionSnapshot />
      </div>

      {/* Confirm button below */}
      <div className="flex gap-3">
        <Button onClick={handleConfirm}>
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}
```

### In Admin Approval Page

```tsx
<UserSubscriptionSnapshot 
  targetUserId={user.id}
  targetUserRole={user.role}
  scholarshipId={scholarship.id}
  isAdminView={true}
/>
```

## Developer Notes

### Critical Logic

**Duplicate Payment Detection:**
```typescript
// If has_paid_before = true AND 
// current scholarship ID matches previous payment,
// show yellow banner.

const hasPaidForThisScholarship = scholarshipId 
  ? hasPaidForScholarship(scholarshipId) 
  : false;

if (isAdminView && hasPaidForThisScholarship) {
  // Show warning banner
}
```

### Payment Context Integration

The component uses `usePayment()` hook to access:
- `paymentHistory`: Array of all user payments
- `hasPaidForScholarship(id)`: Function to check scholarship-specific payments

```typescript
const { paymentHistory, hasPaidForScholarship } = usePayment();
```

### Date Formatting

Uses Indonesian locale for dates:
```typescript
const formattedDate = new Date(timestamp).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});
// Output: "12 Apr 2026"
```

## Testing

### Manual Testing Steps

1. **Test Variant A (Free + Never Paid)**
   - Login as free user without payment history
   - Navigate to payment confirmation
   - Verify gray dot, "Upgrade to unlock" text

2. **Test Variant C (Premium + Paid)**
   - Login as any user
   - Complete payment flow (Upgrade to Premium)
   - Navigate to payment confirmation again
   - Verify green dot, payment date, payment method

3. **Test Admin Warning**
   - Mock admin view with `isAdminView={true}`
   - Mock scholarship ID that matches payment history
   - Verify yellow warning banner appears

### Demo Page

Access comprehensive demos at: `/subscription-snapshot-demo`

Shows all variants side-by-side with explanations.

## Backend Integration (Future)

When connecting to Supabase:

### Database Schema

```sql
-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  scholarship_id UUID REFERENCES scholarships(id),
  amount INTEGER,
  currency VARCHAR(3),
  method VARCHAR(50),
  method_details VARCHAR(100),
  timestamp TIMESTAMP,
  status VARCHAR(20)
);

-- Query to check duplicate payments
SELECT * FROM payments 
WHERE user_id = $1 
  AND scholarship_id = $2 
  AND status = 'completed';
```

### API Endpoint

```typescript
// GET /api/users/:userId/subscription-snapshot?scholarshipId=XXX
{
  "role": "premium",
  "activeUntil": "2026-05-03T00:00:00Z",
  "hasPaidBefore": true,
  "lastPayment": {
    "timestamp": "2026-04-12T10:30:00Z",
    "methodDetails": "BCA Virtual Account",
    "scholarshipId": "SCH001"
  },
  "hasPaidForScholarship": true
}
```

## Accessibility

- ✅ Semantic HTML structure
- ✅ Color is not the only indicator (icons + text)
- ✅ Readable contrast ratios
- ✅ Flexible width (320px works on mobile)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Changelog

### Version 1.0.0 (2026-04-03)
- Initial implementation
- Three main variants (Free/Premium/Paid)
- Admin warning banner for duplicate payments
- Integration with payment context
- Demo page created

## Related Files

- `/components/payment/PaymentConfirmation.tsx` - Integration point
- `/lib/payment-context.tsx` - Payment state management
- `/components/payment/SubscriptionSnapshotDemo.tsx` - Demo page
- `/routes.ts` - Demo route configuration

## Support

For questions or issues:
1. Check the demo page: `/subscription-snapshot-demo`
2. Review this documentation
3. Check payment context implementation
4. Verify scholarshipId is being passed correctly
