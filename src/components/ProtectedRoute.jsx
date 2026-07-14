import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define aquí tu email de administrador (puedes pasarlo como prop o usar variable de entorno)
const ADMIN_EMAIL = 'andespart@yahoo.com'; // Cambia por tu email

const ProtectedRoute = ({ children }) => {
  const { user, loading, hasActiveSubscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si es el administrador, saltar validación de suscripción
  if (user.email === ADMIN_EMAIL) {
    return children;
  }

  // Para otros usuarios, verificar suscripción
  if (!hasActiveSubscription) {
    // Puedes redirigir a una página de "suscripción vencida"
    return <Navigate to="/suscripcion-vencida" replace />;
  }

  return children;
};

export default ProtectedRoute;