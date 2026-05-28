import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Если employeeOnly - пропускает только сотрудников.
// Пока загружается auth - показываем skeleton.
export default function ProtectedRoute({ children, employeeOnly = false }) {
  const { isAuthenticated, isEmployee, loading } = useAuth();
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

  return children;
}
