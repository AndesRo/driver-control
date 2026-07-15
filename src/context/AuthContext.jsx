import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const loadSubscription = async (userId) => {
    if (!userId) {
      setSuscripcion(null);
      setIsSubscriptionActive(false);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error al cargar suscripción:', error);
        // Si la tabla no existe o error, intentamos crear una suscripción por defecto
        const { data: newSub, error: insertError } = await supabase
          .from('suscripciones')
          .insert({ user_id: userId, estado: 'vencida' })
          .select()
          .single();
        if (!insertError) {
          setSuscripcion(newSub);
          setIsSubscriptionActive(false);
        } else {
          console.error('No se pudo crear suscripción:', insertError);
          setSuscripcion(null);
          setIsSubscriptionActive(false);
        }
        setSubscriptionLoading(false);
        return;
      }

      if (!data) {
        // No existe suscripción, la creamos
        const { data: newSub, error: insertError } = await supabase
          .from('suscripciones')
          .insert({ user_id: userId, estado: 'vencida' })
          .select()
          .single();
        if (!insertError) {
          setSuscripcion(newSub);
          setIsSubscriptionActive(false);
        } else {
          setSuscripcion(null);
          setIsSubscriptionActive(false);
        }
        setSubscriptionLoading(false);
        return;
      }

      setSuscripcion(data);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vencimiento = data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : null;
      if (vencimiento) {
        vencimiento.setHours(0, 0, 0, 0);
        const activa = data.estado === 'activa' && vencimiento >= hoy;
        setIsSubscriptionActive(activa);
        console.log(`Suscripción: ${activa ? 'ACTIVA' : 'VENCIDA'} (vencimiento: ${data.fecha_vencimiento})`);
      } else {
        setIsSubscriptionActive(false);
      }
    } catch (error) {
      console.error('Error inesperado en loadSubscription:', error);
      setSuscripcion(null);
      setIsSubscriptionActive(false);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setLoading(false);
          if (currentUser) {
            await loadSubscription(currentUser.id);
          } else {
            setSubscriptionLoading(false);
          }
        }
      } catch (err) {
        console.error('Error al obtener sesión:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setSubscriptionLoading(false);
        }
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        if (currentUser) {
          await loadSubscription(currentUser.id);
        } else {
          setSuscripcion(null);
          setIsSubscriptionActive(false);
          setSubscriptionLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshSubscription = async () => {
    if (user) {
      await loadSubscription(user.id);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      // Crear suscripción por defecto
      const { error: subError } = await supabase
        .from('suscripciones')
        .insert({ user_id: data.user.id, estado: 'vencida' });
      if (subError) console.warn('Error al crear suscripción en registro:', subError);
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSuscripcion(null);
    setIsSubscriptionActive(false);
  };

  const value = {
    user,
    loading,
    suscripcion,
    isSubscriptionActive,
    subscriptionLoading,
    refreshSubscription,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);