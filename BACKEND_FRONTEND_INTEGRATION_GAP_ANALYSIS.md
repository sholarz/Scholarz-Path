# Backend-Frontend Integration Gap Analysis (Updated)
**Generated: April 4, 2026**

---

## Executive Summary

This document updates the previous gap analysis using the **current codebase state**.

### What changed since the previous version
- Admin frontend is no longer "missing". Admin routes and pages now exist.
- Forum frontend is no longer "missing". Forum pages exist.
- Notifications frontend is no longer "missing". Notification pages/components exist.
- Test simulation is no longer backend-missing. Backend `tests` routes and frontend API client are present.

### Current reality in one line
The project has moved from "missing UI" to a **mixed architecture**:
- Some modules are genuinely connected to backend APIs.
- Many user-facing features still run on mock/local state.
- This creates a product that looks complete, but behaves inconsistently across sessions/devices.

### Integration maturity estimate
- Backend API surface: high (broad route coverage)
- Frontend page coverage: high (many pages/routes implemented)
- True end-to-end integration: medium-low
- Estimated production-ready integration coverage: **~45-55%**

---

## Evidence Snapshot (From Current Code)

### Confirmed integrated modules
- Auth flow calls backend login/register/google endpoints.
- Test simulation pages call backend (`getTests`, `getTestDetail`, `submitTest`).
- Core admin dashboard/users/scholarships pages call backend via `admin-api.ts`.

### Confirmed still local/mock modules
- Scholarships listing/detail still import from local `scholarship-data`.
- Bookmarks still stored in localStorage via `bookmark-context.tsx`.
- Timeline uses static task templates and local completion state.
- Forum uses `forum-context.tsx` with `MOCK_POSTS`, no backend fetch.
- Notifications use `notification-context.tsx` mock state, no backend sync.
- Payment/subscription flow is simulated in `payment-context.tsx`.

### Routing status
Routes are extensive and include:
- User flows: dashboard, scholarships, timeline, tests, profile, forum, notifications.
- Admin flows: dashboard, users, settings, scholarships, payment verification pages.

---

## Module-by-Module Current State

## 1) Authentication and Session
- Status: **Partially integrated**
- Good:
  - Login, signup, Google redirect/callback patterns are wired.
  - Auth token handling exists.
- Missing:
  - `resetPassword` in auth context is still mocked (timeout only).
  - Session restoration logic still partly relies on localStorage user object.
- Priority: Medium

## 2) Scholarships Discovery
- Status: **UI complete, data source not integrated**
- Good:
  - Search/filter UX and detail pages exist.
- Missing:
  - Still powered by local `scholarship-data`, not `/scholarships` API.
  - No backend pagination/filter query integration.
- Priority: Critical

## 3) Bookmarks
- Status: **Not integrated to backend persistence**
- Good:
  - Strong UX and bookmark interactions exist.
- Missing:
  - Uses localStorage, not `/scholarships/bookmarks`.
  - No cross-device sync.
- Priority: Critical

## 4) Timeline/Roadmap
- Status: **Not integrated**
- Good:
  - Timeline UX and task progression visualization exist.
- Missing:
  - No `POST /roadmaps`, no `GET /roadmaps`, no `/tasks` updates.
  - Tasks are generated from static templates only.
- Priority: Critical

## 5) Test Simulations
- Status: **Integrated (major improvement)**
- Good:
  - Frontend pages call backend test endpoints.
  - Submit flow is connected.
- Missing:
  - Need QA for premium gating and scoring edge cases.
- Priority: Medium

## 6) Forum and Community
- Status: **Frontend exists, backend integration mostly missing**
- Good:
  - Full UI routes and interactions exist (posts, comments, reports/admin pages).
- Missing:
  - State currently from local context/mock arrays.
  - No end-to-end usage of `/forum/*` backend routes.
- Priority: High

## 7) Notifications
- Status: **Frontend exists, backend integration missing**
- Good:
  - Notification center and page exist.
- Missing:
  - No backend fetch from `/notifications`.
  - Read/delete actions not persisted.
- Priority: High

## 8) Subscription and Payments
- Status: **Mostly simulated**
- Good:
  - End-to-end UI flow and admin verification screens exist.
- Missing:
  - `payment-context.tsx` still simulates processing.
  - No real connection to `/subscriptions/*` API paths in user payment flow.
  - Invoice/usage/current-subscription not surfaced to users.
- Priority: High

## 9) Admin Panel
- Status: **Partially integrated, no longer missing**
- Good:
  - Admin dashboard/users/scholarships are implemented and call backend.
- Missing:
  - Reports/analytics/revenue/scraping logs coverage appears incomplete from frontend API layer.
  - Some admin pages remain demo-oriented (especially payment verification demo path).
- Priority: High

---

## What Is Still Missing (Cross-Cutting)

1. Single source of truth for data.
- Current mix of API + mock + localStorage causes inconsistent user state.

2. Contract consistency.
- Need stricter DTO/type contracts between backend resources and frontend models.

3. Error/loading empty states standardization.
- Some pages are robust, others still optimistic/demo-level.

4. End-to-end test coverage.
- Integration tests across auth -> bookmarks -> timeline -> subscription are missing.

5. Feature flag strategy.
- Needed to safely migrate from mock data to API without breaking current UX.

---

## Should Roadmap Feature Use AI?

Short answer: **Yes, but not AI-only. Use a hybrid model.**

### Recommended approach
- Baseline deterministic planner (rules engine):
  - Build stable timeline from deadline, level, required docs, test status.
  - Guarantees predictable and testable behavior.
- AI layer on top (optional enhancement):
  - Re-rank tasks.
  - Generate personalized rationale/explanations.
  - Suggest weekly focus and motivational nudges.

### Why hybrid is better
- Deterministic core prevents hallucination and unstable plans.
- AI improves engagement and perceived intelligence.
- Easier compliance and QA for critical recommendation logic.

---

## Should Roadmap Be Personalized Using User Data?

Short answer: **Absolutely yes. This should be a core upsell lever.**

### Personalization signals to use
- Profile completeness and education level.
- Target countries and fields of study preferences.
- Language test readiness/scores.
- Document readiness status.
- Scholarship type preferences and saved opportunities.
- Historical behavior (task completion pace, missed deadlines, active hours).

### Product impact
- Higher activation: users see immediate relevance.
- Higher retention: task list stays useful over time.
- Better conversion to premium: personalization is tangible value, not cosmetic.

### Upsell design suggestion
- Free tier:
  - Generic roadmap templates.
  - Limited reminders.
  - Basic deadline tracking.
- Premium tier:
  - Personalized roadmap sequencing.
  - AI coaching and adaptive weekly plans.
  - Risk prediction ("you are likely to miss X unless...").
  - Multi-scholarship optimization and conflict resolution.

---

## Recommended Product Roadmap (90 Days)

## Phase 1 (Weeks 1-3): Data Integrity First
1. Replace scholarship mock source with `/scholarships` API in listing/detail/calendar/dashboard.
2. Migrate bookmarks to backend endpoints and keep local cache as fallback only.
3. Add telemetry for data-source usage to ensure mock paths are eliminated.

Success criteria:
- 100% scholarship surfaces use backend data.
- Bookmarks are consistent across devices.

## Phase 2 (Weeks 4-6): Roadmap Engine Foundation
1. Implement roadmap CRUD + daily tasks with existing backend routes.
2. Persist task completion/skip events.
3. Introduce deterministic roadmap generator service in frontend or backend orchestration layer.

Success criteria:
- Users can generate and continue roadmap sessions reliably.
- Timeline progress survives refresh/login/device change.

## Phase 3 (Weeks 7-9): Personalization and AI Assist
1. Add personalization inputs (profile/preferences/language/doc readiness).
2. Ship AI assist as explain-and-prioritize layer on top of deterministic tasks.
3. Add premium-gated adaptive recommendations.

Success criteria:
- Personalized roadmap adoption > generic roadmap usage.
- Measurable uplift in premium conversion from roadmap surface.

## Phase 4 (Weeks 10-12): Community + Monetization Hardening
1. Connect forum UI to backend forum APIs.
2. Connect notifications UI to backend notifications APIs.
3. Replace simulated payment flow with real subscriptions API and invoice history.

Success criteria:
- Forum and notifications persist server-side.
- Payment lifecycle reflects actual subscription state.

---

## Immediate Action List (This Sprint)

1. Deprecate direct imports of `scholarship-data` from user-facing pages.
2. Implement `bookmark-api.ts` and integrate with `bookmark-context`.
3. Implement `roadmap-api.ts` and bind `TimelinePage` to `/roadmaps` + `/tasks`.
4. Add `notifications-api.ts` and replace mock notification context state.
5. Add `forum-api.ts` and migrate `forum-context` from mock arrays to server state.

---

## Final Recommendation

The roadmap feature should be positioned as the platform's strategic moat.

- Build it on deterministic logic first for reliability.
- Add AI for personalization and guidance, not as the only planner.
- Personalize with user data by default, because this is exactly where premium value is clearest and easiest to communicate.

If executed in this order, Scholarz-Path can move from a "feature-rich demo" into a truly sticky product with a credible upsell engine.
