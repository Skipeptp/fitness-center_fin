import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({
  children,
  employeeOnly = false,
  adminOnly = false,
  clientOnly = false     // ← НОВОЕ
}) {
  const { isAuthenticated, isEmployee, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (employeeOnly && !isEmployee) {
    return <Navigate to="/dashboard" replace />;
  }

  // ← НОВОЕ: сотрудник не может попасть на клиентские страницы
  if (clientOnly && isEmployee) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly) {
    const role = (user?.role || '').toUpperCase();
    if (!isEmployee || !['ADMIN', 'MANAGER', 'VORD'].includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}