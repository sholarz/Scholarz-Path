# Current Situation and Modules

## Project Overview
Scholarz-Path is a scholarship discovery and preparation platform. It helps students find relevant scholarships, match opportunities to their profiles, and manage application preparation in one place.

## Current Situation
The project is currently structured as a Laravel backend API and a Vite-based React frontend. Core platform features are already present, and unit testing has been added for backend models, services, and utility logic, plus a small set of core frontend tests.

The current implementation is in a usable state, but some areas still need broader feature coverage and deeper integration testing.

## Main Modules

### Backend Modules
- Auth
- User
- Scholarship
- Matching
- Roadmap
- Forum
- Subscription
- Admin
- Scraper
- Test

### Frontend Modules
- Auth pages
- Scholarship pages
- Dashboard
- Calendar
- Bookmarks
- Timeline
- Payment flow
- Test simulations
- Shared UI components
- App state contexts

## Main Features of the Web App
- User registration, login, and password reset
- User profile and academic data management
- Scholarship browsing, search, filtering, and detail pages
- Scholarship matching based on profile data
- Roadmap generation for application preparation
- Daily task tracking
- Bookmarking scholarship opportunities
- Forum and community interactions
- Subscription and premium access
- Payment flow
- Test simulations and mock exam practice
- Dashboard, calendar, and timeline views

## Testing Status
- Backend unit tests are available for models, services, and utilities
- Frontend unit tests are available for core UI components and utility functions
- Vitest is configured for the frontend
- PHPUnit is configured for the backend

## Summary
The platform already covers the main scholarship workflow from discovery to preparation. The next natural step is expanding feature-level tests and integrating more frontend and backend modules end to end.

The platform currently supports the main scholarship workflow, but scholarship data is still mock-based in parts of the frontend. The ingestion module covers current validation and quality workflows, while full external connector integration remains a future improvement.