import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { ScholarshipsPage } from "./components/scholarships/ScholarshipsPage";
import { ScholarshipDetailPage } from "./components/scholarships/ScholarshipDetailPage";
import { CalendarPage } from "./components/calendar/CalendarPage";
import { BookmarksPage } from "./components/bookmarks/BookmarksPage";
import { TimelinePage } from "./components/timeline/TimelinePage";
import { TestSimulationsPage } from "./components/test-simulations/TestSimulationsPage";
import { TestExecutionPage } from "./components/test-simulations/TestExecutionPage";
import { NotFoundPage } from "./components/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "scholarships", Component: ScholarshipsPage },
      { path: "scholarships/:id", Component: ScholarshipDetailPage },
      { path: "calendar", Component: CalendarPage },
      { path: "bookmarks", Component: BookmarksPage },
      { path: "timeline", Component: TimelinePage },
      { path: "tests", Component: TestSimulationsPage },
      { path: "tests/:id", Component: TestExecutionPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);