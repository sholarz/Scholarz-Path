# 🎨 ScholarzPath Color Palette - Quick Reference

## Color Values

| Name | Hex | RGB | Use Case |
|------|-----|-----|----------|
| **Navy** | `#2f4156` | `rgb(47, 65, 86)` | Primary - Headers, CTAs, Trust |
| **Teal** | `#567c8d` | `rgb(86, 124, 141)` | Accent - Links, Icons, Interactive |
| **Skyblue** | `#c8d9e6` | `rgb(200, 217, 230)` | Secondary - Backgrounds, Highlights |
| **Beige** | `#f5efeb` | `rgb(245, 239, 235)` | Muted - Inputs, Cards |
| **White** | `#ffffff` | `rgb(255, 255, 255)` | Background - Main background |

---

## CSS Variables

```css
/* Direct Color Access */
--color-navy: #2f4156;
--color-teal: #567c8d;
--color-skyblue: #c8d9e6;
--color-beige: #f5efeb;
--color-white: #ffffff;

/* Semantic Variables */
--primary: #2f4156;          /* Navy */
--primary-foreground: #ffffff;
--accent: #567c8d;           /* Teal */
--accent-foreground: #ffffff;
--secondary: #c8d9e6;        /* Skyblue */
--secondary-foreground: #2f4156;
--muted: #f5efeb;            /* Beige */
--muted-foreground: #567c8d;
--background: #ffffff;       /* White */
--foreground: #2f4156;
```

---

## Tailwind Classes

### Backgrounds
```tsx
// Navy (Primary)
<div className="bg-primary">...</div>

// Teal (Accent)
<div className="bg-accent">...</div>

// Skyblue (Secondary)
<div className="bg-secondary">...</div>

// Beige (Muted)
<div className="bg-muted">...</div>

// White (Background)
<div className="bg-background">...</div>
```

### Text Colors
```tsx
// Navy text
<p className="text-foreground">...</p>
<p className="text-primary">...</p>

// Teal text
<p className="text-accent">...</p>
<p className="text-muted-foreground">...</p>

// White text (on dark backgrounds)
<p className="text-primary-foreground">...</p>
```

### Borders
```tsx
// Default border (Navy 15%)
<div className="border border-border">...</div>

// Accent border (Teal)
<div className="border border-accent">...</div>

// Secondary border (Skyblue)
<div className="border border-secondary">...</div>
```

---

## Component Examples

### Buttons
```tsx
// Primary (Navy)
<Button>Apply Now</Button>
<Button className="bg-primary text-primary-foreground">Apply Now</Button>

// Secondary (Skyblue)
<Button variant="secondary">Learn More</Button>

// Outline (transparent with border)
<Button variant="outline">View Details</Button>

// Accent (Teal) - Custom
<Button className="bg-accent text-accent-foreground">Custom Action</Button>
```

### Cards
```tsx
// White background (default)
<Card>...</Card>

// Beige background
<Card className="bg-muted border-none">...</Card>

// Navy background
<Card className="bg-primary text-primary-foreground border-none">...</Card>

// Skyblue background
<Card className="bg-secondary border-none">...</Card>
```

### Badges
```tsx
// Primary (Navy)
<Badge className="bg-primary">Important</Badge>

// Accent (Teal)
<Badge className="bg-accent text-accent-foreground">Info</Badge>

// Secondary (Skyblue)
<Badge variant="secondary">Status</Badge>

// Outline
<Badge variant="outline">Label</Badge>
```

### Alerts
```tsx
// Info (Teal)
<Alert className="border-accent bg-accent/10">
  <AlertTitle className="text-accent">Info</AlertTitle>
  <AlertDescription>Informational message</AlertDescription>
</Alert>

// Notice (Skyblue)
<Alert className="border-secondary bg-secondary/30">
  <AlertTitle className="text-secondary-foreground">Notice</AlertTitle>
  <AlertDescription>General notification</AlertDescription>
</Alert>
```

### Input Fields
```tsx
// Beige background (recommended)
<input 
  className="bg-muted border border-border focus:ring-2 focus:ring-accent"
  placeholder="Enter text..."
/>

// With label
<div>
  <label className="text-sm font-medium text-foreground">
    Email
  </label>
  <input 
    type="email"
    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:ring-2 focus:ring-accent focus:outline-none"
  />
</div>
```

### Icons
```tsx
import { Search, Calendar, Bell } from 'lucide-react';

// Navy icons (primary)
<Search className="w-5 h-5 text-primary" />

// Teal icons (accent)
<Calendar className="w-5 h-5 text-accent" />

// Muted icons
<Bell className="w-5 h-5 text-muted-foreground" />

// White icons (on dark background)
<div className="bg-primary p-4">
  <Search className="w-5 h-5 text-primary-foreground" />
</div>
```

---

## Common Patterns

### Hero Section
```tsx
<section className="bg-gradient-to-br from-primary/5 to-primary/10">
  <h1>Main Heading</h1>
  <p className="text-muted-foreground">Subheading</p>
  <Button>Get Started</Button>
</section>
```

### Feature Card
```tsx
<Card className="border-2">
  <CardContent>
    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3>Feature Title</h3>
    <p className="text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

### CTA Section
```tsx
<section className="bg-primary text-primary-foreground">
  <h2>Call to Action Heading</h2>
  <p className="opacity-90">Supporting text</p>
  <Button variant="secondary">Take Action</Button>
</section>
```

### Status Indicators
```tsx
// Success (green - not in palette, use sparingly)
<Badge className="bg-green-500 text-white">Verified</Badge>

// Warning (yellow)
<Badge className="bg-yellow-400 text-yellow-900">Approaching</Badge>

// Error/Urgent
<Badge variant="destructive">Overdue</Badge>

// Info (Teal)
<Badge className="bg-accent text-accent-foreground">Info</Badge>
```

---

## Gradients

```tsx
// Navy gradient (hero sections)
<div className="bg-gradient-to-br from-primary/5 to-primary/10">

// Teal gradient
<div className="bg-gradient-to-r from-accent/10 to-accent/5">

// Skyblue gradient
<div className="bg-gradient-to-b from-secondary to-secondary/50">

// Multi-color gradient
<div className="bg-gradient-to-r from-primary via-accent to-secondary">
```

---

## Opacity Variations

```tsx
// Navy with opacity
bg-primary/10   // 10% opacity
bg-primary/20   // 20% opacity
bg-primary/50   // 50% opacity

// Teal with opacity
bg-accent/10
text-accent/80

// Skyblue with opacity
bg-secondary/30
border-secondary/50
```

---

## Hover States

```tsx
// Link hover (Teal)
<Link className="text-accent hover:underline">

// Button hover
<Button className="bg-primary hover:bg-primary/90">

// Card hover
<Card className="hover:border-accent transition-colors">

// Icon hover
<Icon className="text-muted-foreground hover:text-accent transition-colors" />
```

---

## Focus States

```tsx
// Input focus (Teal ring)
<input className="focus:ring-2 focus:ring-accent focus:outline-none" />

// Button focus
<Button className="focus-visible:ring-2 focus-visible:ring-accent" />
```

---

## Dark Mode (Optional)

```css
.dark {
  --background: #2f4156;      /* Navy becomes background */
  --foreground: #ffffff;
  --primary: #c8d9e6;         /* Skyblue becomes primary */
  --accent: #567c8d;          /* Teal stays */
  --secondary: #567c8d;
  --muted: #567c8d;
}
```

---

## Design Principles

### ✓ DO:
- Use navy for main CTAs and headers (trust, professionalism)
- Use teal for interactive elements (clarity, action)
- Use beige for input backgrounds (comfort, ease)
- Use skyblue for subtle backgrounds (calm, organization)
- Maintain high contrast for accessibility

### ✗ DON'T:
- Don't use hardcoded hex colors
- Don't override the palette without reason
- Don't create low-contrast combinations
- Don't mix too many colors in one section

---

## Accessibility

| Combination | Contrast Ratio | WCAG Level |
|-------------|---------------|------------|
| Navy on White | 10.3:1 | AAA ✅ |
| Teal on White | 5.1:1 | AA ✅ |
| White on Navy | 10.3:1 | AAA ✅ |
| Navy on Beige | 9.2:1 | AAA ✅ |
| Skyblue on White | 1.7:1 | Decorative only ⚠️ |

**Note:** Always use navy text on skyblue backgrounds, never skyblue text.

---

## Quick Tips

1. **Primary actions:** Navy buttons
2. **Links:** Teal with underline on hover
3. **Input fields:** Beige background with teal focus
4. **Cards:** White or beige, never skyblue
5. **Icons:** Navy for primary, teal for accent
6. **Badges:** Match the context (primary/accent/secondary)
7. **Alerts:** Teal for info, yellow for warning, red for error

---

## Demo Pages

- **Color Palette:** `/color-demo`
- **Usage Guide:** `/color-guide`
- **Live Examples:** All pages use the palette

---

**Last Updated:** 30 March 2026
