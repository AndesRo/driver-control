import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionBlocked from './SubscriptionBlocked';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isSubscriptionActive } = useAuth();

  if (loading) return <div className="text-center p-8">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Verificar suscripción
  if (!isSubscriptionActive()) {
    return <SubscriptionBlocked />;
  }

  return children;
};

export default ProtectedRoute;