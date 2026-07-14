import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin, hasActiveSubscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si es admin, permite acceso sin validar suscripción
  if (isAdmin) {
    return children;
  }

  // Para no admins, verificar suscripción activa
  if (!hasActiveSubscription) {
    return <Navigate to="/suscripcion-vencida" replace />;
  }

  return children;
};

export default ProtectedRoute;