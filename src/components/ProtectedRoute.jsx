import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [suscripcion, setSuscripcion] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSuscripcion = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener suscripción:', error);
        setChecking(false);
        return;
      }

      if (data) {
        const hoy = new Date();
        const vencimiento = new Date(data.fecha_vencimiento);
        if (vencimiento < hoy && (data.estado === 'prueba' || data.estado === 'activa')) {
          await supabase
            .from('suscripciones')
            .update({ estado: 'vencida' })
            .eq('id', data.id);
          data.estado = 'vencida';
        }
        setSuscripcion(data);
      } else {
        setSuscripcion(null);
      }
      setChecking(false);
    };

    checkSuscripcion();
  }, [user]);

  if (loading || checking) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!suscripcion || suscripcion.estado === 'vencida' || suscripcion.estado === 'suspendida') {
    return <Navigate to="/subscription-blocked" replace />;
  }

  if (suscripcion.estado === 'prueba' || suscripcion.estado === 'activa') {
    return children;
  }

  return <Navigate to="/subscription-blocked" replace />;
};

export default ProtectedRoute;