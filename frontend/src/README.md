# 🎓 ScholarzPath - Platform Beasiswa Jawa, Indonesia

> Platform edukasi yang fokus khusus pada beasiswa di Jawa, Indonesia dengan sistem 3-tier user dan desain student-first.

[![Color Palette](https://img.shields.io/badge/Navy-2f4156-2f4156)](/)
[![Color Palette](https://img.shields.io/badge/Teal-567c8d-567c8d)](/)
[![Color Palette](https://img.shields.io/badge/Skyblue-c8d9e6-c8d9e6)](/)
[![Color Palette](https://img.shields.io/badge/Beige-f5efeb-f5efeb)](/)
[![React](https://img.shields.io/badge/React-18-blue)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)]()

---

## 🎨 Color Palette

Platform ScholarzPath menggunakan color palette yang telah disesuaikan:

| Color | Hex | Usage |
|-------|-----|-------|
| **Navy** | `#2f4156` | Primary - Headers, CTA, Trust elements |
| **Teal** | `#567c8d` | Accent - Links, Icons, Interactive elements |
| **Skyblue** | `#c8d9e6` | Secondary - Backgrounds, Subtle highlights |
| **Beige** | `#f5efeb` | Muted - Input fields, Card backgrounds |
| **White** | `#ffffff` | Background - Main page background |

**Note:** Color palette diterapkan di code level saja (CSS variables & Tailwind classes), tidak ditampilkan sebagai elemen visual di website.

---

## ⚡ Quick Start

1. **Lihat Platform:**
   - Landing: `/`
   - Scholarships: `/scholarships`
   - Calendar: `/calendar`
   - Test Prep: `/tests`

2. **Login Test Accounts:**
   ```
   Admin:
   Email: admin@scholarzpath.com
   Password: admin123

   Premium User:
   Email: premium@test.com
   Password: premium123

   Free User:
   Email: user@test.com
   Password: user123
   ```

3. **Try Features:**
   - Browse scholarships dengan search & filter
   - Bookmark scholarships favorit
   - Set deadline notifications
   - View automated preparation timeline
   - Take test simulations
   - Upgrade to Premium (payment flow)

---

## 🚀 Features

### 6 MVP Features

1. **🔍 Search & Filter**
   - Curated scholarships di Jawa
   - Filter by location, degree, deadline
   - Sort by relevance/deadline

2. **📅 Calendar View**
   - Visual scholarship deadlines
   - Monthly/weekly views
   - Export to ICS file

3. **🔖 Bookmark System**
   - Save favorite scholarships
   - Organize with collections
   - Track application status

4. **⏰ Preparation Timeline**
   - Automated task breakdown
   - Days until deadline
   - Milestone tracking

5. **🔐 Authentication**
   - Google OAuth integration
   - Email/password login
   - Forgot password flow

6. **📊 Local Data**
   - Scraped beasiswa data
   - Regularly updated
   - Verified information

### Additional Features

- **🔔 Smart Notifications**
  - Deadline alerts
  - Per-bookmark settings
  - Dashboard indicators

- **💳 Payment System**
  - Bank Transfer (BCA, Mandiri, BNI)
  - E-Wallet (GoPay, OVO, Dana, ShopeePay)
  - Credit Card
  - Upgrade to Premium

- **📝 Test Simulations**
  - Practice tests
  - Instant scoring
  - Performance analytics

---

## 👥 User Roles

| Role | Access | Features |
|------|--------|----------|
| **Admin** | Full | All features + admin panel |
| **Premium** | Enhanced | Advanced filters, unlimited bookmarks, priority support |
| **Free** | Basic | Limited bookmarks (5), basic features |

Visual indicators:
- 👑 Premium users get Crown badge
- 🛡️ Admin users get Admin badge

---

## 🏗️ Tech Stack

### Current (Figma Make)
- **Framework:** React 18
- **Routing:** React Router v7 (Data mode)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React
- **State:** React Context API
- **Forms:** Controlled components
- **Charts:** Recharts

### For Production (Recommended)
- **Framework:** Next.js 14 with App Router
- **Backend:** Supabase (Auth, Database, Storage)
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics
- **Email:** Resend or SendGrid

---

## 📁 Project Structure

```
/
├── App.tsx                          # Entry point
├── routes.ts                        # Routing config
├── styles/
│   └── globals.css                  # Tailwind + Color palette
├── components/
│   ├── LandingPage.tsx             # Homepage
│   ├── Header.tsx                   # Navigation
│   ├── auth/                       # Login, Signup, Forgot Password
│   ├── dashboard/                  # User dashboard
│   ├── scholarships/               # Search & detail pages
│   ├── calendar/                   # Calendar view
│   ├── bookmarks/                  # Bookmarked scholarships
│   ├── timeline/                   # Preparation timeline
│   ├── test-simulations/           # Test prep
│   ├── payment/                    # Payment flow
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── auth-context.tsx            # Auth state
│   ├── bookmark-context.tsx        # Bookmarks state
│   ├── notification-context.tsx    # Notifications
│   ├── payment-context.tsx         # Payment flow
│   ├── scholarship-data.ts         # Mock data
│   └── utils.ts                    # Helper functions
└── Documentation/
    ├── README.md                   # This file
    ├── PLATFORM_STATUS.md          # Current status
    ├── NEXT_JS_MIGRATION_GUIDE.md  # Next.js migration
    ├── README_MVP.md               # MVP features detail
    ├── USER_ROLES_GUIDE.md         # User roles system
    └── EMAIL_NOTIFICATION_GUIDE.md # Notification system
```

---

## 🎯 Design Principles

**Student-First Approach:**

1. **Trust** 🛡️
   - Navy color establishes professionalism
   - Verified information badges
   - Transparent pricing

2. **Simplicity** ✨
   - Clean, uncluttered interface
   - Clear call-to-actions
   - Intuitive navigation

3. **Clarity** 📖
   - High contrast ratios
   - Clear typography
   - Organized information hierarchy

4. **Credibility** ✅
   - Professional color scheme
   - Real scholarship data
   - Regular updates

---

## 🔧 Development

### Using Current React Setup

```bash
# Already running in Figma Make
# Just interact with the UI
```

### Local Development (Optional)

```bash
# Clone or download files
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🚀 Deployment Options

### Option 1: React SPA (Current)
Deploy ke:
- **Vercel:** Drag & drop atau GitHub integration
- **Netlify:** Connect repository
- **GitHub Pages:** Static hosting
- **Cloudflare Pages:** Fast CDN

### Option 2: Next.js (Recommended for Production)
1. Follow `/NEXT_JS_MIGRATION_GUIDE.md`
2. Setup Supabase backend
3. Deploy to Vercel dengan satu klik

---

## ⚠️ Important Notes

### 1. Framework
**Platform ini menggunakan React + React Router, BUKAN Next.js 14.**

Environment Figma Make tidak mendukung Next.js. Untuk menggunakan Next.js:
- Setup project baru di environment lokal
- Follow migration guide: `/NEXT_JS_MIGRATION_GUIDE.md`
- Deploy ke Vercel atau hosting Next.js lainnya

### 2. Color Palette
✅ **Sudah diupdate** dengan navy-teal-skyblue-beige-white palette.

Semua components otomatis menggunakan warna yang benar via Tailwind classes.

### 3. Mock Data
Platform menggunakan mock data untuk demo. Untuk production:
- Setup Supabase database
- Create API endpoints
- Replace mock data dengan real API calls
- Implement proper authentication

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PLATFORM_STATUS.md](PLATFORM_STATUS.md) | Status proyek & feature checklist |
| [NEXT_JS_MIGRATION_GUIDE.md](NEXT_JS_MIGRATION_GUIDE.md) | Panduan lengkap migrasi ke Next.js 14 |
| [README_MVP.md](README_MVP.md) | Detail 6 MVP features |
| [USER_ROLES_GUIDE.md](USER_ROLES_GUIDE.md) | User roles & permissions system |
| [EMAIL_NOTIFICATION_GUIDE.md](EMAIL_NOTIFICATION_GUIDE.md) | Notification system implementation |

---

## 🎨 UI Components

Platform menggunakan **shadcn/ui** components:
- Button, Card, Badge, Alert
- Dialog, Dropdown, Sheet, Popover
- Calendar, Tabs, Accordion
- Form components (Input, Select, Checkbox, Switch)
- Data display (Table, Avatar, Separator)

Semua components sudah styled dengan ScholarzPath color palette.

---

## 🔜 Roadmap

### Phase 1: Current ✅
- [x] 6 MVP features
- [x] 3-tier user system
- [x] Notification system
- [x] Payment flow
- [x] Test simulations
- [x] Color palette update

### Phase 2: Backend Integration
- [ ] Supabase setup
- [ ] Real authentication
- [ ] Database schema
- [ ] API endpoints
- [ ] File storage

### Phase 3: Production Features
- [ ] Email notifications
- [ ] Push notifications
- [ ] Payment gateway integration
- [ ] Admin dashboard
- [ ] Analytics & reporting

### Phase 4: Enhancement
- [ ] Mobile app (React Native)
- [ ] Advanced search algorithms
- [ ] AI-powered recommendations
- [ ] Community features
- [ ] Multi-language support

---

## 🤝 Contributing

### Development Guidelines

1. **Code Style:**
   - Use TypeScript
   - Follow existing patterns
   - Add comments untuk complex logic

2. **Components:**
   - Keep components small & focused
   - Use composition over inheritance
   - Implement proper prop types

3. **Styling:**
   - Use Tailwind utility classes
   - Follow color palette
   - Ensure responsive design

4. **Testing:**
   - Test all user flows
   - Check mobile responsiveness
   - Verify accessibility

---

## 📄 License

Copyright © 2026 ScholarzPath. All rights reserved.

---

## 📞 Support

- **Demo:** Run in Figma Make
- **Issues:** Check documentation files
- **Migration:** Follow `/NEXT_JS_MIGRATION_GUIDE.md`

---

## 🎉 Acknowledgments

- **Design System:** shadcn/ui
- **Icons:** Lucide React
- **Framework:** React + React Router
- **Styling:** Tailwind CSS v4
- **Color Palette:** Navy-Teal-Skyblue-Beige-White

---

**ScholarzPath - Membuka Jalan Menuju Pendidikan Berkualitas di Indonesia** 🎓✨

*Platform edukasi yang fokus membantu siswa menemukan dan mengajukan beasiswa di Jawa dengan pendekatan student-first yang mengutamakan trust, simplicity, clarity, dan credibility.*