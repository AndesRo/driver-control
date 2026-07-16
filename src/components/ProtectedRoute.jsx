import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  const [suscripcion, setSuscripcion] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // 1. Verificar si es administrador
      const { data: admin } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (admin) {
        setIsAdmin(true);
        setChecking(false);
        return;
      }

      // 2. Verificar suscripción
      const { data } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const hoy = new Date();
        const vencimiento = new Date(data.fecha_vencimiento);

        if (
          vencimiento < hoy &&
          (data.estado === 'prueba' || data.estado === 'activa')
        ) {
          await supabase
            .from('suscripciones')
            .update({ estado: 'vencida' })
            .eq('id', data.id);

          data.estado = 'vencida';
        }

        setSuscripcion(data);
      }

      setChecking(false);
    };

    checkAccess();
  }, [user]);

  if (loading || checking) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Los administradores nunca se bloquean
  if (isAdmin) {
    return children;
  }

  if (
    !suscripcion ||
    suscripcion.estado === 'vencida' ||
    suscripcion.estado === 'suspendida'
  ) {
    return <Navigate to="/subscription-blocked" replace />;
  }

  return children;
};

export default ProtectedRoute;