import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Layout } from './components/shared/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SchoolSettingsPage } from './components/admin/SchoolSettingsPage';
import { PeriodSetupPage } from './components/admin/PeriodSetupPage';
import { ClassesPage } from './components/admin/ClassesPage';
import { SubjectsPage } from './components/admin/SubjectsPage';
import { TeachersPage } from './components/admin/TeachersPage';
import { TimetablePage } from './components/admin/TimetablePage';
import { NoticesPage as AdminNoticesPage } from './components/admin/NoticesPage';
import { LeaveRequestsPage } from './components/admin/LeaveRequestsPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TodaySchedulePage } from './components/teacher/TodaySchedulePage';
import { WeeklyTimetablePage } from './components/teacher/WeeklyTimetablePage';
import { AttendancePage } from './components/teacher/AttendancePage';
import { LeavePage } from './components/teacher/LeavePage';
import { NotificationsPage } from './components/teacher/NotificationsPage';
import { TeacherNoticesPage } from './components/teacher/TeacherNoticesPage';
import { ProfilePage } from './components/teacher/ProfilePage';
import { LoadingScreen } from './components/shared/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/teacher" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (user) {
    // Redirect logged-in users to their dashboard
    return <Navigate to={isAdmin ? '/admin' : '/teacher'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><SchoolSettingsPage /></ProtectedRoute>} />
      <Route path="/admin/periods" element={<ProtectedRoute adminOnly><PeriodSetupPage /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute adminOnly><ClassesPage /></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute adminOnly><SubjectsPage /></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute adminOnly><TeachersPage /></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute adminOnly><TimetablePage /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute adminOnly><AdminNoticesPage /></ProtectedRoute>} />
      <Route path="/admin/leaves" element={<ProtectedRoute adminOnly><LeaveRequestsPage /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/today" element={<ProtectedRoute><TodaySchedulePage /></ProtectedRoute>} />
      <Route path="/teacher/timetable" element={<ProtectedRoute><WeeklyTimetablePage /></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/teacher/leave" element={<ProtectedRoute><LeavePage /></ProtectedRoute>} />
      <Route path="/teacher/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/teacher/notices" element={<ProtectedRoute><TeacherNoticesPage /></ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
