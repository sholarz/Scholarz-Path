# Test Plan - Scholarz-Path

Test Plan ID: TP-SP-20260402-01
Project: Scholarz-Path
Version: 1.0
Owner: QA Lead
Date: 2026-04-02
Status: Draft

Chapter 1: Introduction
1.1 Purpose
- Define the scope, approach, resources, and schedule for testing the Scholarz-Path web application and API before release.

1.2 Scope
In-Scope:
- Web UI user flows for Guest, Free, Premium, and Admin roles.
- Core backend API endpoints for authentication, profiles, scholarships, matching, roadmaps, forum, subscriptions, and admin operations.
- Role-based access control, quotas, and rate limits (guest and free restrictions).
- Data integrity for create/update/delete operations (bookmarks, roadmaps, tasks, forum posts, and admin content changes).
- Notification triggers for email reminders and system alerts.
- Payment subscription flows in test mode (subscribe, upgrade, cancel, billing status).
- Cross-browser and responsive checks for primary pages.
- Basic security checks: authentication, authorization, input validation, and session/token handling.
Out-of-Scope:
- Mobile native apps and push notifications.
- Social login (Google, LinkedIn) planned for Phase 2.
- Full-scale load or stress testing for production traffic.
- Localization and multi-language UI validation.
- Third-party analytics dashboards or external BI tools.
- Python scraper scheduler and infrastructure (only data sampling for accuracy).

1.3 Objectives
- 0 Critical defects before release.
- No more than 2 High defects with documented workaround and product approval.
- 100% of in-scope features covered by at least one test case.
- At least 95% pass rate for High and Medium priority test cases.
- Key API endpoints achieve p95 response time under 2 seconds in the staging environment.

1.4 References
- docs/features-and-functions.md
- docs/backend-modules.md
- docs/api-documentation.md
- docs/python-scraper-architecture.md
- BACKEND_FRONTEND_INTEGRATION_GAP_ANALYSIS.md
- README.md

1.5 Definitions and Acronyms
| Term | Definition |
| --- | --- |
| UAT | User Acceptance Testing |
| STLC | Software Testing Life Cycle |
| RTM | Requirement Traceability Matrix |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| E2E | End-to-End Testing |
| API | Application Programming Interface |

Chapter 2: Test Items (Features to be Tested)
2.1 Software Functions
- Authentication and account: registration, email verification, login, logout, token refresh, password reset, and account status checks.
- Profile management: personal and academic details, language proficiency, profile completion calculation.
- Scholarship discovery: listings, search, filters, pagination, details, related items, and provider data.
- Bookmarking: add/remove, categories, notes, and export.
- Matching engine: match requests, scoring, analysis, match history, free user quotas, and recommendations.
- Roadmap and task management: roadmap generation, milestones, daily tasks, document checklist, progress tracking, and calendar reminders.
- Notifications: email digests, deadline alerts, task reminders, and preference handling.
- Forum and community: categories, topics, replies, likes, search, moderation actions.
- Subscription and billing: plan selection, subscribe/upgrade/downgrade, usage limits, and cancellation.
- Admin functions: user management, scholarship CRUD, provider management, forum moderation, analytics, and system settings.
- Security and access control: RBAC enforcement, rate limiting, and audit logging for sensitive actions.

2.2 Hardware Requirements
- Laptop or desktop with at least 8 GB RAM for web testing.
- Mobile devices for responsive testing: Android 10+ and iOS 15+.
- Stable internet connection (10 Mbps or higher).

2.3 Software Requirements
- OS: Windows 11, macOS 14, or Ubuntu 22.04.
- Browsers: Chrome 120+, Edge 120+, Firefox 120+.
- Backend: PHP 8.x, Laravel 10.
- Database: PostgreSQL 15 (primary) or MySQL 8 (if configured).
- Cache/Queue: Redis 6+.
- Frontend build: Node.js 18+.
- Email: SMTP or SendGrid test configuration.
- Test tools: Postman 10+, browser devtools, and log access.

Chapter 3: Test Strategy (The Approach)
3.1 Testing Types
- Unit Testing: backend services and frontend components.
- Integration Testing: API with database, cache, and queue dependencies.
- System Testing: complete user flows across UI and API.
- Regression Testing: verify fixes and unchanged modules.
- Smoke Testing: quick health checks for each release candidate.
- Acceptance Testing (UAT): product owner validation of critical journeys.
- Basic Security Testing: auth, RBAC, input validation, and rate limit checks.
- Basic Performance Testing: response time checks for key endpoints.

3.2 Testing Tools
- Manual testing for UI and user flows.
- Postman for API tests and collections.
- PHPUnit for backend unit tests.
- Vitest or Jest for frontend unit tests.
- Cypress or Playwright for UI automation.
- Database client (pgAdmin or MySQL Workbench) for data verification.

3.3 Pass/Fail Criteria
- Pass: Actual result matches expected result with no functional defect.
- Fail: Any mismatch, error, or broken flow.
- Blocked: Test cannot be executed due to environment or dependency issues.
- Release gate: 0 Critical, no open Security defects, and High defects resolved or approved by product owner.

Chapter 4: Test Case Specifications
4.1 Test Case ID and Description
- Format: TC-MODULE-### (example: TC-AUTH-001).

4.2 Pre-conditions and Steps
- Define required user role, data setup, and environment state.

4.3 Test Data
- Use seeded users, scholarships, and subscriptions with known values.

4.4 Expected vs. Actual Results
- Expected result must be precise and measurable.

4.5 Status (Pass/Fail/Blocked)

Test Case Template
| Test Case ID | Description | Pre-conditions | Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-AUTH-001 | Login with valid credentials | User exists and email verified | 1. Open login page 2. Enter email/password 3. Click Login | user@example.com / Passw0rd | User redirected to dashboard and token issued | | |

Chapter 5: Defect or Bug Reporting
5.1 Bug Tracking
- Tool: GitHub Issues.
- Required fields: Title, Steps to Reproduce, Expected Result, Actual Result, Environment, Screenshots or logs, and Severity.

5.2 Severity and Priority Levels
| Severity | Definition |
| --- | --- |
| Critical | System down, data loss, or security breach |
| High | Core feature broken, no workaround |
| Medium | Feature partially broken, workaround exists |
| Low | Minor UI or cosmetic issue |

| Priority | Definition |
| --- | --- |
| P1 | Must fix before release |
| P2 | Fix in current sprint if possible |
| P3 | Fix when time allows |

5.3 Bug Life Cycle
- New -> Triaged -> Open -> In Progress -> Fixed -> Retest -> Closed
- Reopened if issue persists after retest

Chapter 6: Test Deliverables
6.1 Test Plan Document
6.2 Requirement Traceability Matrix (RTM)
6.3 Test Cases and Test Scripts
6.4 Test Summary Report
6.5 Bug Reports
6.6 Test Data and Environment Checklist

Chapter 7: Schedule and Resources
7.1 Milestones
| Phase | Start Date | End Date | Owner |
| --- | --- | --- | --- |
| Test Planning | 2026-04-03 | 2026-04-05 | QA Lead |
| Test Case Design | 2026-04-06 | 2026-04-12 | QA Team |
| Test Environment Setup | 2026-04-06 | 2026-04-08 | DevOps |
| Test Execution | 2026-04-13 | 2026-04-23 | QA Team |
| Regression Testing | 2026-04-24 | 2026-04-28 | QA Team |
| Test Summary and UAT Sign-off | 2026-04-29 | 2026-04-30 | QA Lead + Product Owner |

7.2 Team Roles
- QA Lead: Owns test plan, quality gates, and reporting.
- QA Engineer: Writes and executes test cases, logs defects.
- Frontend Developer: Fixes UI defects and supports triage.
- Backend Developer: Fixes API defects and supports triage.
- DevOps: Maintains test environments and CI pipelines.
- Product Owner: Approves UAT and release decision.
