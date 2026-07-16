import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [suscripcion, setSuscripcion] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Si la ruta actual es la de confirmación, no hacemos ninguna verificación
      if (location.pathname === '/confirmacion-exitosa') {
        setChecking(false);
        return;
      }

      if (!user) {
        setChecking(false);
        return;
      }

      // 1. Verificar si es administrador
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const admin = !!adminData;
      setIsAdmin(admin);

      if (admin) {
        setChecking(false);
        return;
      }

      // 2. Si no es admin, verificar suscripción
      let { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Si no existe suscripción, crearla automáticamente
      if (!data && !error) {
        const hoy = new Date().toISOString().split('T')[0];
        const vencimiento = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: newSub, error: insertError } = await supabase
          .from('suscripciones')
          .insert({
            user_id: user.id,
            estado: 'prueba',
            tipo: 'prueba',
            fecha_inicio: hoy,
            fecha_vencimiento: vencimiento
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error al crear suscripción automática:', insertError);
          setChecking(false);
          return;
        }
        data = newSub;
      }

      if (error) {
        console.error('Error al obtener suscripción:', error);
        setChecking(false);
        return;
      }

      if (data) {
        const hoy = new Date();
        const vencimiento = new Date(data.fecha_vencimiento);
        // Actualizar a vencida si expiró
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

    checkAccess();
  }, [user, location.pathname]);

  if (loading || checking) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si es administrador, permitir acceso total
  if (isAdmin) {
    return children;
  }

  // Si no es admin, validar suscripción
  if (!suscripcion || suscripcion.estado === 'vencida' || suscripcion.estado === 'suspendida') {
    return <Navigate to="/subscription-blocked" replace />;
  }

  if (suscripcion.estado === 'prueba' || suscripcion.estado === 'activa') {
    return children;
  }

  return <Navigate to="/subscription-blocked" replace />;
};

export default ProtectedRoute;