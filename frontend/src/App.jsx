import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

// Страницы (lazy не делаем - проект учебный, файлы малы)
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import TrainersPage from './pages/TrainersPage.jsx';
import TrainerDetailPage from './pages/TrainerDetailPage.jsx';
import MembershipsPage from './pages/MembershipsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import ProgramsPage from './pages/ProgramsPage.jsx';
import SupportChatPage from './pages/SupportChatPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import HallsPage from './pages/HallsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import CalculatorPage from './pages/CalculatorPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// ── Отдельный компонент чтобы иметь доступ к useAuth внутри провайдера ──
function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Публичные */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Защищённые - под Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"     element={<DashboardPage      key={user?.id} />} />
        <Route path="/schedule"      element={<SchedulePage       key={user?.id} />} />
        <Route path="/trainers"      element={<TrainersPage       key={user?.id} />} />
        <Route path="/trainers/:id"  element={<TrainerDetailPage  key={user?.id} />} />
        <Route path="/memberships"   element={<MembershipsPage    key={user?.id} />} />
        <Route path="/profile"       element={<ProfilePage        key={user?.id} />} />
        <Route path="/bookings"      element={<MyBookingsPage     key={user?.id} />} />
        <Route path="/programs"      element={<ProgramsPage       key={user?.id} />} />
        <Route path="/support"       element={<SupportChatPage    key={user?.id} />} />
        <Route path="/notifications" element={<NotificationsPage  key={user?.id} />} />
        <Route path="/calculator"    element={<CalculatorPage     key={user?.id} />} />

        {/* Только для сотрудников */}
        <Route path="/halls" element={
          <ProtectedRoute employeeOnly><HallsPage key={user?.id} /></ProtectedRoute>
        } />
        {/* Только для admin и manager */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminPage key={user?.id} /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute adminOnly><AnalyticsPage key={user?.id} /></ProtectedRoute>
        } />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
