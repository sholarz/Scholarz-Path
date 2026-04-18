# Scholarz-Path System Integration, Module Behavior, and Data Flow Documentation
Generated: April 17, 2026

This report is based only on code currently present in this workspace.

---

## 1. System Overview

### What this system does (from code)
Scholarz-Path is a scholarship platform with these implemented feature domains:
- Authentication and role-based access (guest, free, premium, admin).
- User profile, preferences, language tests, and document readiness.
- Scholarship catalog, bookmarking, and matching engine.
- Roadmap generation with daily tasks.
- Forum and moderation tooling.
- Admin operations (users, scholarships, reports, audit logs).
- Test simulations with grading and session persistence.
- Subscription endpoints and Stripe webhook stub.

### Tech stack
- Backend: Laravel 11, Sanctum, modular controllers/services under backend/app/Modules.
- Frontend: React + TypeScript + Vite.
- Database: PostgreSQL schema managed via Laravel migrations.

### Architecture type
Modular monolith:
- Backend is one Laravel app with module folders.
- Frontend is one SPA.
- Integration style is mixed: some modules are API-driven, others still use local/mock state.

---

## 2. Module Breakdown (Critical)

### A. Authentication and Roles

#### Purpose (from code)
Register/login/logout, Google OAuth login, password reset, token issuance, role-based protection, and guest-mode public overview access before login.

#### Key files and functions
- backend/routes/api.php
  - auth routes under /auth and authenticated /auth group.
- backend/app/Modules/Auth/Controllers/AuthController.php
  - login, register, logout, refresh, forgotPassword, resetPassword, googleRedirect, googleCallback.
- backend/app/Modules/Auth/Services/AuthService.php
  - generateToken, sendPasswordResetLink, resetPassword, getUserPermissions.
- backend/app/Http/Middleware/CheckRole.php
- backend/app/Http/Middleware/CheckPermission.php
- frontend/src/lib/auth-context.tsx
  - login, signup, loginWithGoogle, completeGoogleLogin, resetPassword, upgradeToPremium.

#### Data used
- users
- user_profiles
- personal_access_tokens
- password_reset_tokens
- plus runtime dependency on table email_verifications from verifyEmail logic.

#### Current status
- Working: login/register/logout/token flow.
- Working: guest (unauthenticated) users can access public overview routes (landing page and public API surfaces such as scholarships and tests listing/detail).
- Partial: password reset depends on queued email job infrastructure.
- Not connected/broken parts:
  - verifyEmail uses email_verifications table, but migration for that table is not present.

#### Integration status
- Frontend to backend: connected for login/signup/google/forgot-password.
- Backend to database: connected for users/tokens/password_reset_tokens.
- Missing API wiring: none for core auth endpoints; issue is missing table for email verify path.

#### Issues found
- upgradeToPremium in frontend mutates local user role without backend write.
- verifyEmail path can fail due missing table email_verifications.

---

### B. User Profile

#### Purpose (from code)
Manage profile identity, academic data, preferences, language test records, and document readiness checklist.

#### Key files and functions
- backend/app/Modules/User/Controllers/ProfileController.php
  - me, update, updateBasic, updateAcademic, addLanguage, updateLanguage.
- backend/app/Models/UserProfile.php
  - refreshProfileProgress, section payload helpers.
- backend/app/Modules/Profile/Controllers/PreferenceController.php
  - index, update.
- backend/app/Modules/Profile/Controllers/LanguageTestController.php
  - index, store, update, destroy.
- backend/app/Modules/Profile/Controllers/DocumentController.php
  - readiness, updateReadiness.
- backend/app/Modules/Profile/Controllers/LookupController.php
- frontend/src/components/profile/UserProfilePage.tsx

#### Data used
- user_profiles
- user_languages
- user_preferences
- user_language_tests
- user_documents
- lookup_countries
- lookup_fields_of_study

#### Current status
- Working: profile load/save and progress computation.
- Partial: API payloads are inconsistent in envelope shape across profile submodules.

#### Integration status
- Frontend to backend: connected from UserProfilePage to /profile, /preferences, /language-tests, /documents/readiness.
- Backend to database: connected.
- Missing API: no real avatar storage (uploadAvatar is TODO placeholder).

#### Issues found
- Mixed response conventions (some controllers return success envelope, others raw data/message only).
- LookupController uses ilike operator, which is correct for PostgreSQL (and would require adjustment only if the project is moved to MySQL).

---

### C. Scholarship

#### Purpose (from code)
List/filter scholarships, view details, bookmark, provider grouping.

#### Key files and functions
- backend/app/Modules/Scholarship/Controllers/ScholarshipController.php
  - index, show, getByProvider, bookmark, removeBookmark, getBookmarks.
- backend/app/Models/Scholarship.php
- frontend/src/lib/scholarship-api.ts
- frontend/src/components/scholarships/ScholarshipsPage.tsx
- frontend/src/components/scholarships/ScholarshipDetailPage.tsx
- frontend/src/lib/scholarship-data.ts

#### Data used
- scholarships
- scholarship_providers
- scholarship_matches (bookmark flag reused here)

#### Current status
- Partial:
  - Scholarship listing page is API-based.
  - Detail page is still mock-data based.

#### Integration status
- Frontend to backend:
  - Connected: ScholarshipsPage -> getScholarships.
  - Not connected: ScholarshipDetailPage imports getScholarshipById from scholarship-data (mock).
- Backend to database: connected.
- Missing API: none, but frontend not consistently consuming existing APIs.

#### Issues found
- Dashboard, BookmarksPage, CalendarPage still use mock scholarship-data dataset.
- Real and mock IDs diverge (UUID vs simple numeric strings), causing bookmark/timeline inconsistencies.

---

### D. Matching Engine

#### Purpose (from code)
Compute scholarship compatibility score against user criteria/profile and save search history.

#### Key files and functions
- backend/app/Modules/Matching/Controllers/MatchingController.php
- backend/app/Modules/Matching/Services/MatchingService.php
- frontend/src/lib/matching-api.ts

#### Data used
- scholarships
- scholarship_matches
- match_searches
- user_profiles/user_languages

#### Current status
- Partial:
  - Backend algorithm implemented.
  - No frontend screen consumes matching-api functions.

#### Integration status
- Frontend to backend: not connected in UI (API client exists but unused).
- Backend to database: connected.
- Missing API: none required for baseline matching.

#### Issues found
- Matching API is dead code from frontend perspective.
- Duplicate migration history for match_searches exists (one create in 2026_03_10..., one guarded create in 2026_04_16...).

---

### E. Roadmap Generator

#### Purpose (from code)
Generate personalized task plan from scholarship requirements and user progress signals (profile completion, document readiness, and language test readiness).

#### Key files and functions
- backend/app/Modules/Roadmap/Controllers/RoadmapController.php
- backend/app/Modules/Roadmap/Services/RoadmapService.php
- frontend/src/lib/roadmap-api.ts
- frontend/src/components/timeline/TimelinePage.tsx

#### Data used
- roadmaps
- daily_tasks
- scholarships
- users/user_profiles/user_languages

#### Current status
- Partial to working:
  - Backend generation and task updates are implemented.
  - Task generation is personalized by user progress data:
    - profile completion percentage (user_profiles.profile_completion_percentage),
    - document readiness status (user_documents),
    - valid language test readiness (user_language_tests).
  - Timeline page calls roadmap APIs.

#### Integration status
- Frontend to backend: connected for get/create/complete/skip.
- Backend to database: connected.
- Missing API: none for current scope.

#### Issues found
- Status enum mismatch: DB uses abandoned, frontend type expects archived.
- Timeline depends on bookmark-derived scholarship IDs; mock-derived IDs can break roadmap creation validation.
- Language requirement key formats still depend on scholarship.language_requirements consistency (e.g., IELTS/TOEFL naming conventions).

---

### F. Forum

#### Purpose (from code)
Community posting, comments/replies, likes/saves, reports, and moderation.

#### Key files and functions
- backend/routes/api.php (two separate forum route groups).
- backend/app/Modules/Forum/Controllers/ForumController.php
- backend/app/Modules/Forum/Controllers/ForumPostController.php
- backend/app/Modules/Forum/Controllers/ForumCommentController.php
- backend/app/Modules/Forum/Controllers/ForumReportController.php
- frontend/src/lib/forum-context.tsx
- frontend/src/components/forum/*.tsx

#### Data used
- forum_categories
- forum_posts
- forum_comments
- forum_replies
- forum_post_likes/forum_post_saves/forum_comment_likes/forum_reply_likes
- forum_reports

#### Current status
- Not connected end-to-end.

#### Integration status
- Frontend to backend: not connected (forum UI reads/writes local context + MOCK_POSTS).
- Backend to database: partially broken due controller/schema mismatches in one controller set.
- Missing API: APIs exist but frontend does not consume them.

#### Issues found
- Critical route duplication:
  - Public forum routes point to ForumPostController stack.
  - Authenticated forum routes point to ForumController stack.
  - Duplicate method+path definitions create ambiguous/unexpected routing behavior.
- ForumPostController/ForumCommentController/ForumReportController use wrong field names vs schema:
  - user_id/category_id/reporter_id used in code while schema uses author_id/forum_category_id/reporter_user_id.
- Public routes include write actions and admin actions; methods rely on request->user() without auth guards in that public group.

---

### G. Admin Panel

#### Purpose (from code)
Admin dashboard, user management, scholarship CRUD, moderation, reports, audit logs, analytics placeholders.

#### Key files and functions
- backend/app/Modules/Admin/Controllers/AdminDashboardController.php
- backend/routes/api.php admin group
- frontend/src/lib/admin-api.ts
- frontend/src/components/admin/*.tsx

#### Data used
- users
- scholarships
- admin_reports
- admin_audit_logs
- forum_moderation_actions
- user_forum_bans

#### Current status
- Partial.

#### Integration status
- Frontend to backend:
  - Connected: dashboard/users/scholarships through admin-api.
  - Not connected: payment-management pages are mock/demo flows.
- Backend to database: connected for core admin entities.
- Missing API: real revenue integration is placeholder response.

#### Issues found
- Several admin endpoints are stubs (revenue, scraping logs).
- Frontend admin scholarship page opens add dialog but no create API submission flow is implemented in the visible code.

---

### H. Payment System

#### Purpose (from code)
Subscription plan retrieval, subscribe/cancel/resume, payment-method update, invoices, Stripe webhook receiver.

#### Key files and functions
- backend/app/Modules/Subscription/Controllers/SubscriptionController.php
- backend/routes/api.php subscriptions + webhooks/stripe
- frontend/src/lib/payment-context.tsx
- frontend/src/components/payment/*.tsx

#### Data used
- subscription_plans
- user_subscriptions
- users.role

#### Current status
- Partial on backend, not connected on frontend.

#### Integration status
- Frontend to backend: not connected (payment flow is simulated with setTimeout, local state only).
- Backend to database: connected for subscribe/cancel/resume.
- Missing API: webhook handler is currently just acknowledgement, no payment event processing.

#### Issues found
- Frontend upgrade path does not call /subscriptions/subscribe.
- Admin payment management pages use mock payment queue/history.

---

### I. Test Simulation

#### Purpose (from code)
Serve tests, enforce premium lock, accept submissions, compute scores, persist attempts.

#### Key files and functions
- backend/app/Modules/Test/Controllers/TestController.php
- frontend/src/lib/test-prep-api.ts
- frontend/src/components/test-simulations/TestSimulationsPage.tsx
- frontend/src/components/test-simulations/TestExecutionPage.tsx
- backend/database/seeders/TestPreparationSeeder.php

#### Data used
- test_categories
- test_questions
- test_sessions
- test_session_answers

#### Current status
- Working when seeded.

#### Integration status
- Frontend to backend: connected.
- Backend to database: connected.
- Missing API: none for baseline simulation flow.

#### Issues found
- Legacy/mock test-simulation-data.ts still exists and can confuse maintenance, but current pages use API client.

---

## 3. Data Flow Analysis

### Flow 1: User Profile -> Matching Engine -> Scholarship Result
Actual current flow:
1. UserProfilePage saves profile via /profile, /preferences, /language-tests, /documents/readiness.
2. Matching endpoint exists at POST /api/scholarships/match.
3. Frontend has matching-api client, but no page calls performMatching.

Result:
- Backend profile and matching are implemented.
- End-user flow is broken at frontend invocation layer (no matching screen integration).

### Flow 2: Admin -> Add Scholarship -> Database -> User View
Actual current flow:
1. Admin backend endpoint POST /api/admin/scholarships creates scholarship rows.
2. ScholarshipsPage (public list) fetches /api/scholarships, so new scholarships can appear there.
3. ScholarshipDetailPage, BookmarksPage, CalendarPage, DashboardPage still rely on local scholarship-data.

Result:
- Admin create to DB works.
- User visibility is partial and inconsistent across screens.

### Flow 3: Payment -> Admin Confirmation -> Role Upgrade
Actual current flow:
1. User payment UI runs in payment-context with simulated delay.
2. No frontend call to /api/subscriptions/subscribe.
3. Admin payment pages use mock payment queue/actions.
4. Backend can update user_subscriptions and users.role only if subscribe/cancel/resume endpoints are called directly.

Result:
- End-to-end payment lifecycle is not integrated.

### Flow 4: Forum -> Post -> Report -> Admin Moderation
Actual current flow:
1. Frontend forum pages use forum-context local state and MOCK_POSTS.
2. No backend persistence from forum UI.
3. Backend has two competing forum controller stacks; one stack contains schema mismatches.

Result:
- User-visible forum flow is local only.
- Backend moderation flow exists but is not the active frontend path.

---

## 4. Admin System Analysis

### What admin can actually do
- Through connected frontend API client:
  - View dashboard stats.
  - List users, update roles/status.
  - List scholarships, verify, feature, delete.
- Through backend APIs (not all wired in FE):
  - Resolve admin reports.
  - Manage forum bans and moderation actions.
  - Fetch audit logs and analytics.

### Scholarship CRUD status
- Backend: create/update/delete/verify/feature implemented.
- Frontend: list, verify, feature, delete wired; add/edit flow is incomplete in visible code.

### Payment confirmation logic
- Backend admin-specific payment verification workflow is not implemented.
- Frontend admin payment verification pages are demo/mock behavior.

### Moderation system mode
- Intended mode in ForumController: both pre-moderation and report-based moderation.
  - New non-admin posts are created pending.
  - Reports can be reviewed and actioned.
- Conflicting mode in ForumPostController: post creation sets status approved directly.

Conclusion:
- Moderation design is inconsistent because two forum backends coexist with different behavior.

---

## 5. Database and Schema Alignment

### Schema extraction highlights
- Core auth/profile: users, user_profiles, user_languages.
- Scholarships/matching: scholarship_providers, scholarships, scholarship_matches, match_searches.
- Roadmap/tasks: roadmaps, daily_tasks.
- Forum: full normalized forum tables.
- Admin: admin_reports, admin_audit_logs, forum_moderation_actions, user_forum_bans.
- Tests: test_categories, test_questions, test_sessions, test_session_answers.
- Subscriptions: subscription_plans, user_subscriptions.

### Alignment vs feature needs

#### Matching engine requirements
- Required profile fields and scholarship constraints exist in schema.
- Gap: no frontend invocation path for matching.

#### Roadmap generation
- Required entities exist and are used by service.
- Gap: status naming mismatch (DB abandoned vs frontend archived type).

#### User profile completeness
- Model computes completion over basic and academic fields.
- Required columns for target_degree/expected_start_year/application_status are present.

### Missing/inconsistent schema usage
- Forum controller stack mismatch with schema field names in ForumPostController, ForumCommentController, ForumReportController.
- Auth verifyEmail references email_verifications table that is not present in migrations.
- Duplicate migration creation pattern for match_searches adds migration-history ambiguity.

### Data not used anywhere (or mostly unused in flow)
- dashboard-api.ts exists but DashboardPage uses scholarship-data mock.
- matching-api.ts exists but no UI caller.
- subscription endpoints exist but no frontend caller.

---

## 6. Integration Tracking Table

| Module | FE | BE | DB | Integration | Issues |
| ------ | -- | -- | -- | ----------- | ------ |
| Authentication and Roles | Connected | Connected | Connected | Partial | verifyEmail table missing; frontend local role override path exists |
| User Profile | Connected | Connected | Connected | Partial-to-working | response format inconsistency; ilike ties search behavior to PostgreSQL semantics |
| Scholarship | Partial | Connected | Connected | Partial | detail/calendar/dashboard/bookmarks use mock scholarship-data |
| Matching Engine | Not connected | Connected | Connected | Not connected | frontend never calls matching API |
| Roadmap Generator | Connected | Connected | Connected | Partial-to-working | status enum mismatch; depends on reliable scholarship IDs |
| Forum | Not connected | Partial | Connected | Not connected | duplicate route/controller stacks; schema/field mismatches |
| Admin Panel | Partial | Connected | Connected | Partial | some endpoints placeholders; payment admin UI is mock |
| Payment System | Not connected | Partial | Connected | Not connected | frontend simulation only; webhook is stub |
| Test Simulation | Connected | Connected | Connected | Working (seeded) | requires seed data to be meaningful |

---

## 7. Error Detection and Logging

### Where errors are handled
- Global API exception formatting in backend/app/Exceptions/Handler.php.
- Frontend API client typed error handling in frontend/src/lib/api-client.ts.

### Missing error handling
- No centralized backend domain-error classes.
- Limited explicit backend logging except scraper webhook warnings.
- No durable frontend error telemetry.

### API failure cases not handled
- Routes defined for notifications map to methods absent in UserController (runtime failure risk when called).
- Public forum endpoints can execute code paths expecting authenticated user.

### Potential crash points
- ForumPostController index/store and related methods under public routes rely on request->user() properties.
- Field-name mismatches in one forum controller stack likely trigger SQL/attribute errors under real requests.

---

## 8. Mock or Undefined Parts

Confirmed mock/hardcoded usage:
- frontend/src/lib/scholarship-data.ts used by:
  - DashboardPage
  - ScholarshipDetailPage
  - BookmarksPage
  - CalendarPage
- frontend/src/lib/forum-context.tsx uses MOCK_POSTS and local state.
- frontend/src/lib/notification-context.tsx uses MOCK_NOTIFICATIONS and local state.
- frontend/src/lib/payment-context.tsx simulates payment processing locally.
- frontend admin payment pages use mock queues/history.

Undefined or placeholder behavior:
- SubscriptionController::stripeWebhook only acknowledges payload.
- ProfileController::uploadAvatar is TODO placeholder.
- Revenue and scraping logs endpoints in AdminDashboardController are placeholders.

---

## 9. Critical Gaps (Important)

1. Forum backend split-brain and route duplication.
   - Security and data integrity risk.
   - Frontend currently bypasses backend entirely.

2. Scholarship data-source inconsistency across screens.
   - List page is API-driven, detail/dashboard/calendar/bookmarks still mock-driven.

3. Matching engine is backend-only with no UI entry point.

4. Payment and subscription flow is not integrated end-to-end.
   - User role upgrade is simulated in frontend.

5. Route-controller contract gaps.
   - Notifications routes reference methods not present in UserController.

6. Schema/controller mismatch in legacy forum controllers.
   - Wrong column names and payload fields.

7. Missing email_verifications migration while verifyEmail logic exists.

---

## 10. Actionable Fix Plan

### Phase 1: Stabilize backend contracts (highest priority)
1. Remove duplicate forum route/controller stack; keep one canonical implementation.
2. Align forum controllers to actual schema (author_id, forum_category_id, reporter_user_id, content payload field).
3. Fix notifications route targets by implementing missing methods in UserController or removing routes.
4. Add migration for email_verifications or remove verify endpoint path.

### Phase 2: Unify scholarship data flow
1. Refactor ScholarshipDetailPage, DashboardPage, CalendarPage, BookmarksPage to API-backed models.
2. Remove direct dependency on scholarship-data.ts from production screens.
3. Ensure ID format consistency (UUID across all scholarship-dependent flows).

### Phase 3: Activate currently dormant integrations
1. Build frontend matching page/workflow using matching-api.ts.
2. Migrate forum frontend from forum-context local store to backend APIs.
3. Migrate notification frontend from local mock store to /notifications endpoints.

### Phase 4: Complete subscription lifecycle
1. Add frontend subscription API client and wire payment flow to /subscriptions/subscribe.
2. Replace admin payment mock pages with backend-backed review lifecycle.
3. Implement real Stripe webhook event processing and reconciliation.

### Phase 5: Hardening
1. Normalize API response envelopes across profile/controllers.
2. Add integration tests for core flows:
   - auth -> profile -> matching
   - admin scholarship create -> user discover
   - forum post/report/moderation
   - subscribe -> role upgrade
3. Add structured logging for critical domain actions.

---

## Final Assessment

Current system is a partially integrated modular monolith with strong backend surface area but uneven frontend integration. Core blockers are not missing ideas; they are contract inconsistency, duplicate forum implementations, and persistent mock-driven frontend paths in critical user journeys.

- Build it on deterministic logic first for reliability.
- Add AI for personalization and guidance, not as the only planner.
- Personalize with user data by default, because this is exactly where premium value is clearest and easiest to communicate.

If executed in this order, Scholarz-Path can move from a "feature-rich demo" into a truly sticky product with a credible upsell engine.
