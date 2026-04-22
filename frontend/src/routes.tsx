import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { GoogleCallbackPage } from "./components/auth/GoogleCallbackPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { ScholarshipsPage } from "./components/scholarships/ScholarshipsPage";
import { ScholarshipDetailPage } from "./components/scholarships/ScholarshipDetailPage";
import { CalendarPage } from "./components/calendar/CalendarPage";
import { BookmarksPage } from "./components/bookmarks/BookmarksPage";
import { TimelinePage } from "./components/timeline/TimelinePage";
import { TestSimulationsPage } from "./components/test-simulations/TestSimulationsPage";
import { TestExecutionPage } from "./components/test-simulations/TestExecutionPage";
import { UserProfilePage } from "./components/profile/UserProfilePage";
import { ForumPage } from "./components/forum/ForumPage";
import { CreatePostPage } from "./components/forum/CreatePostPage";
import { PostDetailPage } from "./components/forum/PostDetailPage";
import { AdminReportsPage } from "./components/forum/AdminReportsPage";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { AdminPaymentManagementPage } from "./components/payment/AdminPaymentManagementPage";
import { AdminDashboardPage } from "./components/admin/AdminDashboardPage";
import { AdminUsersPage } from "./components/admin/AdminUsersPage";
import { AdminSettingsPage } from "./components/admin/AdminSettingsPage";
import { AdminScholarshipsPage } from "./components/admin/AdminScholarshipsPage";
import { SubscriptionSnapshotDemo } from "./components/payment/SubscriptionSnapshotDemo";
import { NotificationSync } from "./components/admin/NotificationSync";
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
      { path: "auth/google/callback", Component: GoogleCallbackPage },
      { 
        path: "dashboard", 
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      { path: "scholarships", Component: ScholarshipsPage },
      { path: "scholarships/:id", Component: ScholarshipDetailPage },
      {
        path: "calendar",
        element: (
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        )
      },
      {
        path: "bookmarks",
        element: (
          <ProtectedRoute>
            <BookmarksPage />
          </ProtectedRoute>
        )
      },
      {
        path: "timeline",
        element: (
          <ProtectedRoute>
            <TimelinePage />
          </ProtectedRoute>
        )
      },
      {
        path: "tests",
        element: (
          <ProtectedRoute>
            <TestSimulationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "tests/:id",
        element: (
          <ProtectedRoute>
            <TestExecutionPage />
          </ProtectedRoute>
        )
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        )
      },
      {
        path: "forum",
        element: (
          <ProtectedRoute>
            <ForumPage />
          </ProtectedRoute>
        )
      },
      {
        path: "forum/create",
        element: (
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        )
      },
      {
        path: "forum/:id",
        element: (
          <ProtectedRoute>
            <PostDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: "forum/reports",
        element: (
          <AdminRoute>
            <AdminReportsPage />
          </AdminRoute>
        )
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "admin/payments",
        element: (
          <AdminRoute>
            <AdminPaymentManagementPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/payment-verification",
        element: (
          <AdminRoute>
            <AdminPaymentManagementPage />
          </AdminRoute>
        )
      },
      {
        path: "admin/dashboard",
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <AdminRoute>
            <AdminSettingsPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/scholarships",
        element: (
          <AdminRoute>
            <AdminScholarshipsPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/subscriptions",
        element: (
          <AdminRoute>
            <SubscriptionSnapshotDemo />
          </AdminRoute>
        ),
      },
      {
        path: "admin/notifications",
        element: (
          <AdminRoute>
            <NotificationSync />
          </AdminRoute>
        ),
      },
      { path: "subscription-snapshot", Component: SubscriptionSnapshotDemo },
      { path: "subscription-snapshot-demo", Component: SubscriptionSnapshotDemo },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);