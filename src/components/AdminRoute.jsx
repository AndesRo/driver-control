// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setChecking(false);
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error al verificar rol de administrador:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setChecking(false);
    };

    checkAdmin();
  }, [user]);

  if (loading || checking) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Si no es administrador, redirigir al inicio o a una página de acceso denegado
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;