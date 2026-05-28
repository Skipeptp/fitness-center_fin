import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Публичные */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Защищённые - под Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/trainers" element={<TrainersPage />} />
              <Route path="/trainers/:id" element={<TrainerDetailPage />} />
              <Route path="/memberships" element={<MembershipsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/support" element={<SupportChatPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />

              {/* Только для сотрудников */}
              <Route path="/halls" element={
                <ProtectedRoute employeeOnly><HallsPage /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute employeeOnly><AdminPage /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute employeeOnly><AnalyticsPage /></ProtectedRoute>
              } />
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
