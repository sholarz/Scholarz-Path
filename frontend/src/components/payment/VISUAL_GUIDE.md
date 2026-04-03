# User Subscription Snapshot - Visual Guide

## Component Visual Structure

```
┌─────────────────────────────────────────────┐
│  Subscription Snapshot                      │  ← Title (14px bold, gray-600)
│                                             │
│  ● Premium                                  │  ← Status (green dot + text)
│    Active until 3 Mei 2026                  │  ← Subtext (12px, gray-500)
│                                             │
│  ─────────────────────────────────────────  │  ← Separator
│                                             │
│  ✓ Previously paid: Yes (12 Apr 2026)      │  ← Payment history (green check)
│    Via BCA Virtual Account                  │  ← Payment method (12px, gray-500)
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ ⚠️ Check before approve.               ││  ← Admin warning (yellow banner)
│  │ User already paid for this             ││
│  │ scholarship on 12 Apr 2026             ││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
     320px wide, auto height
```

---

## Color Coding

### Status Indicators

**Premium User:**
```
● Green (#22C55E)
"Premium"
"Active until [date]"
```

**Free User:**
```
● Gray (#9CA3AF)
"Free"
"Upgrade to unlock"
```

### Payment History Icons

**Has Payment History:**
```
✓ Green check icon
"Previously paid: Yes (date)"
"Via [method name]"
```

**No Payment History:**
```
✗ Red X icon
"Previously paid: No"
```

### Warning Banner (Admin Only)

```
┌─────────────────────────────────────────┐
│ ⚠️  Check before approve.              │
│     User already paid for this          │
│     scholarship on [date]               │
└─────────────────────────────────────────┘

Background: #FFF3CD (yellow-50)
Border: #FDE68A (yellow-200)
Text: #78350F (yellow-900)
```

---

## Variant Comparisons

### Variant A: Free + Never Paid
```
┌─────────────────────────────────────────┐
│  Subscription Snapshot                  │
│                                         │
│  ● Free                                 │  ← Gray dot
│    Upgrade to unlock                    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ✗ Previously paid: No                 │  ← Red X
│                                         │
└─────────────────────────────────────────┘
```

### Variant B: Premium + Never Paid (Rare)
```
┌─────────────────────────────────────────┐
│  Subscription Snapshot                  │
│                                         │
│  ● Premium                              │  ← Green dot
│    Active until 3 Mei 2026              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ✗ Previously paid: No                 │  ← Red X
│                                         │
└─────────────────────────────────────────┘
```

### Variant C: Premium + Already Paid
```
┌─────────────────────────────────────────┐
│  Subscription Snapshot                  │
│                                         │
│  ● Premium                              │  ← Green dot
│    Active until 3 Mei 2026              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ✓ Previously paid: Yes (12 Apr 2026)  │  ← Green check
│    Via BCA Virtual Account              │
│                                         │
└─────────────────────────────────────────┘
```

### Variant D: Admin + Duplicate Warning
```
┌─────────────────────────────────────────┐
│  Subscription Snapshot                  │
│                                         │
│  ● Premium                              │  ← Green dot
│    Active until 3 Mei 2026              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ✓ Previously paid: Yes (12 Apr 2026)  │  ← Green check
│    Via BCA Virtual Account              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⚠️ Check before approve.         │ │  ← Yellow warning
│  │ User already paid for this        │ │
│  │ scholarship on 12 Apr 2026        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Integration in Payment Confirmation

```
┌──────────────────────────────────────────────┐
│  Review Payment Details                      │
│  Please review your payment information...   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Payment Information                         │
│  Bank: BCA                                   │
│  Account Number: 1234567890                  │
│  Account Holder: John Doe                    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Premium Subscription       Rp 99.000       │
│  ──────────────────────────────────────────  │
│  Total Amount               Rp 99.000       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  By confirming this payment, you agree to... │
└──────────────────────────────────────────────┘

        ┌──────────────────────────┐
        │  Subscription Snapshot   │  ← PLACED HERE
        │  ● Premium              │
        │  ✓ Previously paid: Yes  │
        └──────────────────────────┘

┌──────────────┐  ┌──────────────────────────┐
│     Back     │  │    Confirm Payment       │
└──────────────┘  └──────────────────────────┘
```

---

## Spacing & Layout

```
Component Structure:

┌─────────────────────────────────────────┐
│ ↕ 16px padding top                     │
│                                         │
│  Subscription Snapshot   ← 14px bold   │
│                                         │
│ ↕ 12px gap                              │
│                                         │
│  ● Premium              ← Row 1        │
│    Active until...                      │
│                                         │
│ ↕ 12px gap                              │
│                                         │
│  ✓ Previously paid...   ← Row 2        │
│    Via [method]                         │
│                                         │
│ ↕ 12px gap                              │
│                                         │
│  ⚠️ Warning banner      ← Row 3 (optional) │
│                                         │
│ ↕ 16px padding bottom                   │
└─────────────────────────────────────────┘
 ← 16px padding left/right →
```

---

## Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Title | 14px | Bold | Gray-600 |
| Status text | 16px | Semibold | Gray-900 |
| Subtext | 12px | Regular | Gray-500 |
| Payment history | 14px | Medium | Gray-900 |
| Payment method | 12px | Regular | Gray-500 |
| Warning text | 12px | Regular | Yellow-900 |
| Warning bold | 12px | Semibold | Yellow-900 |

---

## Interactive States

### Default State
```
background: white
border: 1px solid gray-200
shadow: sm
```

### Hover State
```
background: white
border: 1px solid gray-200
shadow: md (elevated)
transition: all 300ms
```

---

## Responsive Behavior

- **Fixed width:** 320px on all screen sizes
- **Mobile:** Centered in parent container
- **Desktop:** Centered in parent container
- **Tablet:** Centered in parent container

The component does NOT resize responsively. This ensures consistent appearance across all devices.

---

## Accessibility Features

✅ **Color + Icon:** Not relying on color alone (icons + text)  
✅ **Contrast:** All text meets WCAG AA standards  
✅ **Semantic HTML:** Proper heading hierarchy  
✅ **Screen readers:** Descriptive text for all status indicators  

---

## Animation Details

**Hover Effect:**
```css
transition: all 300ms ease-in-out
hover:shadow-md
```

**Entrance Animation (optional):**
```css
/* Can be added if needed */
animate-in fade-in slide-in-from-bottom-4
duration-300
```

---

## Dark Mode Support

Component currently designed for light mode. For dark mode support, add:

```tsx
className="bg-white dark:bg-gray-800 
           border-gray-200 dark:border-gray-700
           text-gray-900 dark:text-gray-100"
```

---

## Browser Rendering

Tested and works correctly in:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+
- ✅ Mobile Safari (iOS 16+)
- ✅ Chrome Mobile (Android 13+)

---

## Print Styles (Future)

For print-friendly version:

```css
@media print {
  .subscription-snapshot {
    box-shadow: none;
    border: 2px solid #000;
  }
}
```

---

This visual guide provides a complete reference for implementing and maintaining the User Subscription Snapshot component's appearance.
