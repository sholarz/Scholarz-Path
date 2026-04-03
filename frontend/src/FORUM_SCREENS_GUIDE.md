# Forum & Notification System - Visual Screen Guide

**Platform:** ScholarPath  
**Date:** April 3, 2026

---

## Screen Layouts

### 1. Forum Home Page (`/forum`)

```
┌─────────────────────────────────────────────────────────────┐
│  ScholarPath Header                    [🔔3] [👤 User]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Forum Komunitas                      [+ Buat Postingan]   │
│  Berbagi pengalaman dan diskusi seputar beasiswa           │
│                                                             │
│  ┌────────────────────────────┬─────────────────────────┐  │
│  │ MAIN CONTENT (3/4 width)   │ SIDEBAR (1/4 width)     │  │
│  │                            │                         │  │
│  │ ┌──────────────────────┐   │ ┌─────────────────────┐ │  │
│  │ │ 🔍 Search           │   │ │ Kategori            │ │  │
│  │ └──────────────────────┘   │ │ • Semua             │ │  │
│  │                            │ │ • Tips & Pengalaman │ │  │
│  │ [Kategori ▼] [Urutkan ▼]   │ │ • Pengumuman        │ │  │
│  │                            │ │ • Tanya Jawab       │ │  │
│  │ ┌──────────────────────┐   │ │ • Diskusi Umum      │ │  │
│  │ │ POST CARD            │   │ │ • Persiapan Tes     │ │  │
│  │ │ Andi Wijaya [PREMIUM]│   │ │ • Dokumen           │ │  │
│  │ │                      │   │ └─────────────────────┘ │  │
│  │ │ Tips Lolos LPDP 2026 │   │                         │  │
│  │ │ Halo teman-teman...  │   │ ┌─────────────────────┐ │  │
│  │ │                      │   │ │ 📈 Topik Trending   │ │  │
│  │ │ [Tips & Pengalaman]  │   │ │ #LPDP2026   124     │ │  │
│  │ │ [LPDP] [Tips]        │   │ │ #BeasiswaS2  89     │ │  │
│  │ │                      │   │ │ #IELTS       67     │ │  │
│  │ │ ❤️ 24  💬 5  2h ago   │   │ │ #MotivationLetter54 │ │  │
│  │ └──────────────────────┘   │ └─────────────────────┘ │  │
│  │                            │                         │  │
│  │ ┌──────────────────────┐   │ [ADMIN ONLY]            │  │
│  │ │ POST CARD            │   │ ┌─────────────────────┐ │  │
│  │ │ [Pending] [Reported] │   │ │ ⚠️ Admin Panel      │ │  │
│  │ │ ...                  │   │ │ 🚩 Laporan (3)      │ │  │
│  │ └──────────────────────┘   │ │ 📝 Pending (2)      │ │  │
│  │                            │ └─────────────────────┘ │  │
│  └────────────────────────────┴─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Post Detail Page (`/forum/:id`)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Kembali ke Forum]                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ POST CARD                                           │   │
│  │ ┌────┐                                              │   │
│  │ │ AW │ Andi Wijaya [PREMIUM] • 2 jam yang lalu     │   │
│  │ └────┘ [Tips & Pengalaman] [LPDP] [Tips]           │   │
│  │                                                     │   │
│  │ Tips Lolos Beasiswa LPDP 2026                       │   │
│  │                                                     │   │
│  │ Halo teman-teman! Saya mau berbagi pengalaman      │   │
│  │ lolos beasiswa LPDP tahun ini. Ada beberapa tips   │   │
│  │ yang menurut saya penting...                        │   │
│  │                                                     │   │
│  │ ────────────────────────────────────────────────    │   │
│  │                                                     │   │
│  │ [❤️ 24] [💬 5] [🔖 Simpan] [📤 Bagikan] [🚩 Laporkan]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Komentar (5)                                        │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ [Tulis komentar Anda...]                           │   │
│  │                                         [Kirim →]   │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │                                                     │   │
│  │ ┌────┐ Budi Santoso [FREE] • 1 jam yang lalu       │   │
│  │ │ BS │ Terima kasih sharingnya! Sangat membantu    │   │
│  │ └────┘ ❤️ 5  Balas                                  │   │
│  │                                                     │   │
│  │   ┌────┐ Andi Wijaya [PREMIUM] • 30 menit lalu     │   │
│  │   │ AW │ Sama-sama! Semoga sukses!                 │   │
│  │   └────┘                                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Notification Center (Header Dropdown)

```
┌─────────────────────────────────┐
│ Notifikasi        [✓✓] [🗑️]    │
│ 3 belum dibaca                  │
├─────────────────────────────────┤
│ [NEW] ❤️ Post Anda disukai      │
│ Budi Santoso menyukai post...   │
│ 30 menit yang lalu → Lihat      │
├─────────────────────────────────┤
│ [NEW] 💬 Komentar baru          │
│ Siti Nurhaliza berkomentar...   │
│ 1 jam yang lalu → Lihat         │
├─────────────────────────────────┤
│ 📅 Pengingat Deadline           │
│ LPDP 2026 akan ditutup dalam 7  │
│ 1 hari yang lalu → Lihat        │
├─────────────────────────────────┤
│ 🎓 Beasiswa Baru!               │
│ Beasiswa Chevening 2026 telah   │
│ 2 hari yang lalu → Lihat        │
├─────────────────────────────────┤
│        [Lihat Semua]            │
└─────────────────────────────────┘
```

---

### 4. Admin Reports Page (`/forum/reports`)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Kembali ke Forum]                                       │
│                                                             │
│  Laporan Pengguna                              Pending: 3   │
│  Tinjau dan moderasi konten yang dilaporkan                │
│                                                             │
│  [🚩 Pending (3)] [✓ Ditinjau (5)]                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ REPORT CARD                                         │   │
│  │ [SPAM] [Post]                                       │   │
│  │                                                     │   │
│  │ Dilaporkan oleh: John Doe                           │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Konten yang dilaporkan:                       │   │   │
│  │ │ "Click here for free scholarship money..."    │   │   │
│  │ │ Oleh: Spam User                               │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ Deskripsi: This is clearly a spam post trying to   │   │
│  │ scam students...                                    │   │
│  │                                                     │   │
│  │ 2 jam yang lalu                     [👁️ Lihat]     │   │
│  │                                     [✓ Tinjau]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [More report cards...]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Review Report Dialog (Admin)

```
┌─────────────────────────────────────────────────┐
│ Tinjau Laporan                                  │
│ Pilih tindakan yang sesuai berdasarkan laporan  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ [SPAM] [Post]                             │   │
│ │ Pelapor: John Doe                         │   │
│ │ ────────────────────────────────────────  │   │
│ │ Konten: "Click here for free..."         │   │
│ │ Oleh: Spam User                           │   │
│ │ ────────────────────────────────────────  │   │
│ │ Deskripsi: This is clearly a spam post... │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Tindakan *                                      │
│ ◉ 🗑️ Hapus Konten                               │
│ ○ ⚠️ Beri Peringatan ke User                     │
│ ○ ✖️ Tolak Laporan                               │
│                                                 │
│ Catatan Tindakan *                              │
│ ┌───────────────────────────────────────────┐   │
│ │ Post confirmed as spam. Removed to        │   │
│ │ maintain community quality...             │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ⚠️ Konten akan dihapus secara permanen          │
│                                                 │
│              [Batal] [Konfirmasi Tindakan]     │
└─────────────────────────────────────────────────┘
```

---

### 6. Admin Payment Management (`/admin/payments`)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Kembali ke Dashboard]                                   │
│                                                             │
│  Manajemen Pembayaran                         Pending: 2    │
│  Verifikasi dan kelola pembayaran premium users             │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │⏱ 2   │ │✓ 5   │ │✖ 1   │ │💳 8  │                       │
│  │Pending│ │Approve│ │Reject│ │Total │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                             │
│  [⏱ Pending (2)] [💳 Riwayat Tindakan (8)]                 │
│                                                             │
│  [🔍 Cari berdasarkan nama atau email...]                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PAYMENT CARD                                        │   │
│  │ [Pending] [Bank Transfer]                           │   │
│  │                                                     │   │
│  │ Budi Santoso                                        │   │
│  │ budi@example.com                                    │   │
│  │                                                     │   │
│  │ Jumlah: Rp 300.000    Waktu: 2 jam yang lalu       │   │
│  │                                                     │   │
│  │ Lihat Bukti Pembayaran →                 [👁️ Tinjau]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [More payment cards...]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. Payment Approval Dialog - Step 1

```
┌─────────────────────────────────────────────────┐
│ Verifikasi Pembayaran                           │
│ Tinjau detail pembayaran dan ambil tindakan     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Nama: Budi Santoso                        │   │
│ │ Email: budi@example.com                   │   │
│ │ Jumlah: Rp 300.000                        │   │
│ │ Metode: [Bank Transfer]                   │   │
│ │ ────────────────────────────────────────  │   │
│ │ Bukti Pembayaran:                         │   │
│ │ Lihat Bukti Pembayaran →                  │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│              [✖ Tolak] [✓ Setujui]              │
└─────────────────────────────────────────────────┘
```

---

### 8. Payment Approval Dialog - Step 2 (Approve)

```
┌─────────────────────────────────────────────────┐
│ Verifikasi Pembayaran                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ✓ Apakah Anda yakin ingin menyetujui      │   │
│ │   transaksi ini?                          │   │
│ │                                           │   │
│ │ User akan segera diupgrade ke Premium     │   │
│ │ setelah Anda mengkonfirmasi.              │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Durasi Langganan (valid_until)                  │
│ ┌───────────────────────────────────────────┐   │
│ │ Pilih durasi langganan            ▼       │   │
│ └───────────────────────────────────────────┘   │
│ • 1 Bulan                                       │
│ • 3 Bulan                                       │
│ • 6 Bulan                                       │
│ • 12 Bulan (1 Tahun) ✓                          │
│                                                 │
│ Langganan akan dimulai dari hari ini            │
│                                                 │
│              [Batal] [Konfirmasi Persetujuan]   │
└─────────────────────────────────────────────────┘
```

---

### 9. Payment Approval Dialog - Step 2 (Reject)

```
┌─────────────────────────────────────────────────┐
│ Verifikasi Pembayaran                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ⚠️ Apakah Anda yakin ingin menolak         │   │
│ │   transaksi ini?                          │   │
│ │                                           │   │
│ │ User akan menerima notifikasi penolakan   │   │
│ │ dengan alasan yang Anda berikan.          │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Alasan Penolakan *                              │
│ ┌───────────────────────────────────────────┐   │
│ │ Bukti pembayaran tidak jelas. Nominal     │   │
│ │ yang tertera tidak sesuai dengan harga    │   │
│ │ paket Premium. Silakan upload ulang...    │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Alasan ini akan dikirim ke user melalui notifikasi │
│                                                 │
│              [Batal] [Konfirmasi Penolakan]     │
└─────────────────────────────────────────────────┘
```

---

### 10. Payment Action History (Riwayat Tindakan)

```
┌─────────────────────────────────────────────────┐
│ 📄 Riwayat Tindakan                             │
│ Log audit untuk traceability dan penyelesaian   │
│ sengketa                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───┐                                           │
│ │ ✓ │  [Disetujui]                              │
│ └─┬─┘  👤 Admin ScholarPath                     │
│   │    ⏱ 1 hari yang lalu                        │
│   │                                             │
│   │    ┌───────────────────────────────────┐    │
│   │    │ Durasi: 12 Bulan (1 Tahun)        │    │
│   │    └───────────────────────────────────┘    │
│   │                                             │
│   │    Catatan: Bukti pembayaran valid...      │
│   │    Senin, 2 April 2026 14:30:00            │
│   │                                             │
│ ┌─┴─┐                                           │
│ │ ✖ │  [Ditolak]                                │
│ └─┬─┘  👤 Admin ScholarPath                     │
│   │    ⏱ 3 hari yang lalu                        │
│   │                                             │
│   │    ┌───────────────────────────────────┐    │
│   │    │ Alasan: Bukti tidak jelas...      │    │
│   │    └───────────────────────────────────┘    │
│   │                                             │
│   │    Catatan: User diminta upload ulang      │
│   └    Jumat, 30 Maret 2026 10:15:00           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 11. Create Post Page (`/forum/create`)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Kembali ke Forum]                                       │
│                                                             │
│  Buat Postingan Baru                                        │
│  Berbagi pengalaman atau tanya seputar beasiswa             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │ Judul *                                             │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ Tips Lolos Beasiswa LPDP 2026               │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ Konten *                                            │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ Halo teman-teman! Saya mau berbagi          │     │   │
│  │ │ pengalaman lolos beasiswa LPDP tahun ini... │     │   │
│  │ │                                             │     │   │
│  │ │ (10 rows)                                   │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ Kategori *                                          │   │
│  │ [Tips & Pengalaman            ▼]                    │   │
│  │                                                     │   │
│  │ Tags (tekan Enter untuk menambahkan)                │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ [LPDP] [Tips] [Beasiswa S2]                 │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │                       [Batal] [📝 Posting]          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 12. Full Notifications Page (`/notifications`)

```
┌─────────────────────────────────────────────────────────────┐
│  Notifikasi                      [✓✓ Tandai Semua] [🗑️ Hapus]│
│  3 notifikasi belum dibaca                                  │
│                                                             │
│  [🔔 Semua (12)] [📂 Belum Dibaca (3)]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ❤️ Post Anda disukai                    [NEW] [✓] [🗑️]│   │
│  │ Budi Santoso menyukai post Anda "Tips LPDP 2026"   │   │
│  │ 30 menit yang lalu • oleh Budi     Lihat Detail →  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 Komentar baru                        [NEW] [✓] [🗑️]│   │
│  │ Siti Nurhaliza berkomentar pada post Anda          │   │
│  │ 1 jam yang lalu • oleh Siti         Lihat Detail → │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ Post Disetujui                        [NEW] [✓] [🗑️]│   │
│  │ Post Anda "Cara Membuat CV yang Baik" telah...     │   │
│  │ 2 jam yang lalu • oleh Admin        Lihat Detail → │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [More notifications...]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding Guide

### Status Badges
- **Pending** - Yellow (`text-yellow-600 border-yellow-600`)
- **Approved** - Green (`text-green-600 bg-green-50`)
- **Rejected** - Red (`text-red-600 bg-red-50`)
- **Reported** - Red with flag icon

### Actions
- **Approve** - Green button (`bg-green-600`)
- **Reject** - Red button (`variant="destructive"`)
- **View** - Outline button (`variant="outline"`)
- **Review** - Primary button

### Notifications
- **Unread** - Primary accent with badge
- **Read** - Muted appearance
- **Icon Colors** - Type-specific (heart=red, comment=blue, etc.)

### User Roles
- **Admin** - Yellow badge with admin icon
- **Premium** - Blue badge with crown
- **Free** - Gray badge

---

## Mobile Responsive Behavior

### Forum Home
- Sidebar moves below main content
- Search bar full width
- Filters stack vertically
- Post cards full width

### Post Detail
- Avatar size reduced
- Action buttons wrap to new line
- Comments full width
- Reply form full width

### Notifications
- Notification cards full width
- Actions buttons icon-only
- Dropdown becomes sheet

### Admin Pages
- Stats cards 2x2 grid (was 4x1)
- Search full width
- Action buttons stack vertically
- Tables become cards

---

## Interactive States

### Hover
- Cards lift with shadow increase
- Buttons darken slightly
- Links underline
- Cursor changes to pointer

### Active
- Buttons press down effect
- Selected filters highlighted
- Active tabs with underline
- Liked items filled icon

### Loading
- Skeleton loaders for cards
- Spinner on buttons
- Disabled state during submit
- Progress indicators

### Empty
- Large icon (opacity 50%)
- Helpful message
- Call-to-action button
- Centered layout

---

## Accessibility Notes

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons/links
- Escape to close dialogs
- Arrow keys in dropdowns

### Screen Readers
- ARIA labels on icon buttons
- Role attributes on custom components
- Focus management in modals
- Descriptive link text

### Visual
- High contrast text
- Visible focus indicators
- Large touch targets (44px min)
- Color is not only indicator

---

This visual guide provides a comprehensive overview of all key screens and their layouts in the Forum & Notification System.
