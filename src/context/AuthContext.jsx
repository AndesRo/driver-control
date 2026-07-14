import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [suscripcion, setSuscripcion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSuscripcion = async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error al obtener suscripción:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const sub = await fetchSuscripcion(user.id);
        setSuscripcion(sub);
      } else {
        setSuscripcion(null);
      }
      setLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const sub = await fetchSuscripcion(user.id);
        setSuscripcion(sub);
      } else {
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
    setSuscripcion(null);
  };

  // Verificar si la suscripción está activa
  const isSubscriptionActive = () => {
    if (!suscripcion) return false;
    if (suscripcion.estado !== 'activa') return false;
    const now = new Date();
    const vencimiento = new Date(suscripcion.fecha_vencimiento);
    return now <= vencimiento;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      suscripcion, 
      loading, 
      login, 
      register, 
      logout,
      isSubscriptionActive,
      refreshSuscripcion: async () => {
        if (user) {
          const sub = await fetchSuscripcion(user.id);
          setSuscripcion(sub);
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);