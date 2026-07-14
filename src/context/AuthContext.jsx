import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// Lista de emails de administradores (puedes agregar más)
const ADMIN_EMAILS = ['andespat@yahoo.com']; // Cambia por tu correo

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Verificar si es admin
        const admin = ADMIN_EMAILS.includes(currentUser.email);
        setIsAdmin(admin);
        
        // Obtener suscripción solo si no es admin
        if (!admin) {
          const { data, error } = await supabase
            .from('suscripciones')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          if (!error) {
            setSuscripcion(data);
          } else {
            setSuscripcion(null); // Sin suscripción registrada
          }
        } else {
          // Los administradores no tienen suscripción (siempre activos)
          setSuscripcion({ estado: 'activa' });
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const admin = ADMIN_EMAILS.includes(currentUser.email);
        setIsAdmin(admin);
        
        if (!admin) {
          const { data, error } = await supabase
            .from('suscripciones')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          if (!error) {
            setSuscripcion(data);
          } else {
            setSuscripcion(null);
          }
        } else {
          setSuscripcion({ estado: 'activa' });
        }
      } else {
        setIsAdmin(false);
        setSuscripcion(null);
      }
      setLoading(false);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Determinar si la suscripción está activa (solo para no admins)
  const hasActiveSubscription = () => {
    if (isAdmin) return true;
    if (!suscripcion) return false;
    if (suscripcion.estado !== 'activa') return false;
    if (suscripcion.fecha_vencimiento) {
      const hoy = new Date();
      const venc = new Date(suscripcion.fecha_vencimiento);
      if (venc < hoy) return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      suscripcion,
      isAdmin,
      hasActiveSubscription: hasActiveSubscription()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);