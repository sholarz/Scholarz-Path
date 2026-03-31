# 🚀 Panduan Migrasi ke Next.js 14

## ⚠️ PENTING
Environment Figma Make saat ini menggunakan **React dengan React Router**. Untuk menggunakan Next.js 14, Anda perlu melakukan migrasi manual ke environment Next.js yang sebenarnya.

---

## 📋 Struktur File Next.js 14 (App Router)

### Current Structure (React Router)
```
/
├── App.tsx                    # Entry point dengan RouterProvider
├── routes.ts                  # Routing config
├── components/
│   ├── LandingPage.tsx
│   ├── Header.tsx
│   ├── auth/
│   ├── dashboard/
│   └── ...
└── styles/
    └── globals.css
```

### Next.js 14 Structure (Harus dibuat manual)
```
your-nextjs-project/
├── app/
│   ├── layout.tsx             # Root layout (replace App.tsx)
│   ├── page.tsx               # Landing page (/)
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── scholarships/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── calendar/
│   │   └── page.tsx
│   ├── bookmarks/
│   │   └── page.tsx
│   ├── timeline/
│   │   └── page.tsx
│   └── tests/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── ui/
│   └── ...
├── lib/
├── styles/
│   └── globals.css
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🔧 Langkah-langkah Migrasi

### 1. Setup Next.js 14 Project

```bash
npx create-next-app@latest scholarzpath --typescript --tailwind --app --no-src-dir
cd scholarzpath
```

### 2. Install Dependencies

```bash
npm install lucide-react
npm install date-fns
npm install sonner
npm install recharts
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
```

### 3. Copy Files dari Figma Make

#### A. Styles
- ✅ Copy `/styles/globals.css` ke `app/globals.css`
- ✅ **Color palette sudah diupdate** dengan navy-teal-skyblue-beige

#### B. Components
- Copy semua folder `/components/*` ke `/components/` di Next.js
- Copy `/lib/*` ke `/lib/`

#### C. Konversi Pages

**Landing Page (`app/page.tsx`)**
```tsx
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  return <LandingPage />;
}
```

**Dashboard (`app/dashboard/page.tsx`)**
```tsx
import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function Dashboard() {
  return <DashboardPage />;
}
```

**Dynamic Route (`app/scholarships/[id]/page.tsx`)**
```tsx
import { ScholarshipDetailPage } from '@/components/scholarships/ScholarshipDetailPage';

export default function ScholarshipDetail() {
  return <ScholarshipDetailPage />;
}
```

### 4. Update Root Layout (`app/layout.tsx`)

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BookmarkProvider } from '@/lib/bookmark-context';
import { NotificationProvider } from '@/lib/notification-context';
import { PaymentProvider } from '@/lib/payment-context';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'ScholarzPath - Your Path to Education in Indonesia',
  description: 'Find and apply for scholarships in Java, Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <BookmarkProvider>
            <NotificationProvider>
              <PaymentProvider>
                {children}
                <Toaster />
              </PaymentProvider>
            </NotificationProvider>
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 5. Update Import Statements

**React Router → Next.js**
```tsx
// Dari:
import { Link, useNavigate } from 'react-router';

// Menjadi:
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Dari:
const navigate = useNavigate();
navigate('/dashboard');

// Menjadi:
const router = useRouter();
router.push('/dashboard');
```

### 6. Client Components

Tambahkan `'use client'` di top file untuk components yang menggunakan:
- `useState`, `useEffect`, `useContext`
- Event handlers (onClick, onChange, dll)
- Browser APIs

```tsx
'use client';

import { useState } from 'react';
// ... rest of component
```

### 7. Update next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'], // Untuk Unsplash images
  },
};

module.exports = nextConfig;
```

---

## 🎨 Color Palette (Sudah Diupdate)

Platform ScholarzPath sekarang menggunakan color palette yang sesuai:

```css
/* ScholarzPath Brand Colors */
--color-navy: #2f4156;      /* Primary - Headers, CTA, Trust elements */
--color-teal: #567c8d;      /* Accent - Links, Icons, Highlights */
--color-skyblue: #c8d9e6;   /* Secondary - Backgrounds, Borders */
--color-beige: #f5efeb;     /* Muted - Input backgrounds, Cards */
--color-white: #ffffff;     /* Base - Main background */
```

### Mapping ke Tailwind Classes:
- `bg-primary` / `text-primary` → Navy (#2f4156)
- `bg-accent` / `text-accent` → Teal (#567c8d)
- `bg-secondary` / `text-secondary` → Skyblue (#c8d9e6)
- `bg-muted` / `text-muted` → Beige (#f5efeb)
- `bg-background` → White (#ffffff)

---

## 🔄 Component Changes Needed

### 1. Navigation Components
Update semua `Link` dan `useNavigate` calls

### 2. Image Components
```tsx
// Dari:
<img src={imageSrc} alt="..." />

// Menjadi:
import Image from 'next/image';
<Image src={imageSrc} alt="..." width={500} height={300} />
```

### 3. Context Providers
Tandai dengan `'use client'` jika menggunakan hooks

---

## ✅ Checklist Migrasi

- [ ] Setup Next.js 14 project baru
- [ ] Install dependencies
- [ ] Copy `globals.css` dengan color palette baru
- [ ] Copy semua components
- [ ] Copy lib files (contexts, data)
- [ ] Buat file page.tsx untuk setiap route
- [ ] Update semua import statements
- [ ] Tambah 'use client' dimana perlu
- [ ] Test semua fitur:
  - [ ] Authentication flow
  - [ ] Scholarship search & filter
  - [ ] Calendar view
  - [ ] Bookmarks
  - [ ] Timeline
  - [ ] Notifications
  - [ ] Payment flow
  - [ ] Test simulations
- [ ] Setup environment variables
- [ ] Deploy ke Vercel/hosting

---

## 📝 Notes

1. **Server Components**: Next.js 14 menggunakan Server Components by default. Hanya tambah `'use client'` jika component perlu interactivity.

2. **Data Fetching**: Untuk production, ganti mock data dengan real API calls menggunakan Server Components atau API routes.

3. **Supabase Integration**: Setup Supabase client untuk Next.js:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

4. **Environment Variables**: Buat `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

---

## 🎯 Prioritas

**High Priority:**
- ✅ Color palette (DONE)
- Route structure
- Authentication flow
- Core features (search, filter, bookmarks)

**Medium Priority:**
- Payment integration
- Email notifications
- Test simulations

**Low Priority:**
- Performance optimization
- SEO metadata
- Analytics

---

## 🚀 Quick Start (Setelah Migrasi)

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Deploy ke Vercel
vercel deploy
```

---

## 💡 Tips

1. Migrasi bertahap - mulai dari landing page dulu
2. Test setiap route setelah migrasi
3. Gunakan TypeScript strict mode
4. Setup ESLint dan Prettier
5. Implement proper error boundaries
6. Add loading states dengan Suspense
7. Optimize images dengan next/image

---

## 📚 Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs)

---

**Status Saat Ini:**
- ✅ Color palette diupdate ke navy-teal-skyblue-beige
- ✅ Semua components siap untuk migrasi
- ⚠️ Perlu manual migration ke Next.js environment
- ⚠️ Environment Figma Make tidak support Next.js secara native
