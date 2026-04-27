/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Scholarships from './pages/Scholarships';
import Recommendations from './pages/Recommendations';
import RoadmapCalendar from './pages/RoadmapCalendar';
import Forum from './pages/Forum';
import Admin from './pages/Admin';
import TestPrep from './pages/TestPrep';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import Bookmarks from './pages/Bookmarks';
import Auth from './pages/Auth';
import { Toaster } from './components/ui/sonner';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Memuat...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // Enforce email verification
  if (!user.emailVerified) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Memuat...</div>;
  
  // Users who are logged in AND verified should go to dashboard
  if (user && user.emailVerified) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div>Memuat...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/scholarships" element={<PrivateRoute><Scholarships /></PrivateRoute>} />
            <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><RoadmapCalendar /></PrivateRoute>} />
            <Route path="/forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
            <Route path="/test-prep" element={<PrivateRoute><TestPrep /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
            <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}
