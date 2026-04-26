# ScholarPath Indonesia

A web platform that helps Indonesian students discover scholarships, get AI-based recommendations, build preparation roadmaps, and track application progress in one dashboard.

## Overview

ScholarPath combines:
- Scholarship discovery and bookmarking
- AI scholarship matching based on user profile
- AI roadmap generation for application preparation
- AI essay review in Indonesian
- Progress dashboard and notifications
- Free, Premium, and Admin role system

## Core Features

### 1) Authentication and Profile
- Sign in with Google or email/password (Firebase Auth)
- Email verification is required for private routes
- User profiles are stored in Firestore with roles:
  - free
  - premium
  - admin

### 2) AI Recommendations (Groq)
- AI matches user profiles against available scholarships
- Structured JSON output with fit score and reasoning
- Narrative outputs are guided to Indonesian language

### 3) Roadmap and Calendar
- Generate application roadmaps from profile + selected scholarship
- Track progress with per-step checklist
- Sync roadmap steps to Google Calendar (OAuth)

### 4) Test Prep and Essay Review
- Mock test simulations (IELTS/TOEFL)
- AI essay review (score, feedback, strengths, weaknesses, suggestions)
- Test and essay history stored under user subcollections

### 5) Admin Panel
- Scholarship data CRUD
- AI-powered scholarship extraction from raw text and URLs
- Premium payment verification (approve/reject)

### 6) Premium Workflow
- Users submit payment proof via URL
- Admin verifies payment status
- User role is upgraded to premium

## Tech Stack

- Frontend: React 19 + TypeScript + Vite
- Routing: React Router
- UI: Tailwind CSS + Radix UI + custom components
- Motion: motion
- Auth and Database: Firebase Auth + Cloud Firestore + Firebase Storage
- AI Provider: Groq SDK
- Notifications/Toast: sonner

## Route Structure

- Public:
  - /
  - /auth
- Private (requires login + verified email):
  - /dashboard
  - /scholarships
  - /recommendations
  - /calendar
  - /bookmarks
  - /test-prep
  - /forum
  - /profile
  - /premium
- Admin only:
  - /admin

## Firestore Data Structure (Summary)

Top-level collections:
- users
- scholarships
- roadmaps
- notifications
- forumPosts
- payments

Subcollections under users/{uid}:
- bookmarks
- testResults
- essayResults

Security rules notes:
- scholarships: public read, admin-only write
- roadmaps/notifications/payments: owner or admin access based on rules
- users: profile read access is restricted to owner/admin

## Prerequisites

- Node.js 18+
- An active Firebase project
- OAuth client configuration (for Google Calendar sync)
- Groq API key

## Environment Configuration

Create a .env.local file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
VITE_CLIENT_ID=your_google_oauth_client_id
```

Optional legacy compatibility:
- Current AI service still reads GEMINI_API_KEY as a fallback when GROQ_API_KEY is empty.

## Firebase Configuration

This project reads Firebase config from:
- firebase-applet-config.json

Make sure this file contains a valid Firebase app configuration for your environment.

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Prepare .env.local (see Environment Configuration)

3. Start development server

```bash
npm run dev
```

4. Open in browser

```text
http://localhost:3000
```

## Scripts

- npm run dev: runs Vite dev server on port 3000
- npm run build: production build
- npm run preview: preview production build
- npm run lint: TypeScript type check (tsc --noEmit)
- npm run clean: removes dist folder (rm -rf based script)

Windows note:
- The clean script uses rm -rf, which usually works in Git Bash/WSL.
- If you use pure PowerShell, run: Remove-Item -Recurse -Force dist.

## Demo Seed Data

On app startup, the seeder attempts to insert sample scholarships when the scholarships collection is empty.

Implementation location:
- src/lib/seeder.ts

If the current user has no write permission on scholarships (non-admin), the seed process is automatically skipped.

## AI Integration

AI service location:
- src/services/geminiService.ts

Even though the file name remains geminiService.ts for import compatibility, the implementation now uses Groq.

Main functions:
- matchScholarships
- generateRoadmap
- extractScholarshipFromText
- searchScholarshipOnWeb
- extractFromUrl
- reviewEssay

## Firestore Rules

Firestore security rules file:
- firestore.rules

Additional security specification:
- security_spec.md

It is recommended to review and adjust admin email allowlists before production deployment.

## Deployment Checklist

- Fill .env.local with GROQ_API_KEY and VITE_CLIENT_ID
- Ensure firebase-applet-config.json points to the correct Firebase project
- Deploy the latest Firestore rules
- Verify admin routes are admin-only
- Test key flows:
  - login + email verification
  - AI matching
  - roadmap generation
  - premium payment submit and approval

## Contributing

Use a branch-based workflow (for example: feature/*) and ensure npm run lint passes before merge.

