import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

/**
 * NOTA IMPORTANTE DE ARQUITECTURA
 * --------------------------------
 * El cálculo de "¿está vencida la suscripción?" y su escritura en la BD
 * (estado: 'vencida') se mantienen aquí por compatibilidad con el código
 * original, PERO esto es responsabilidad del backend, no del cliente:
 *
 * 1. La fecha usada (`new Date()` del navegador) la controla el usuario.
 * 2. El `UPDATE` que marca 'vencida' requiere permiso de escritura del
 *    cliente sobre `suscripciones` vía RLS. Si esa política existe,
 *    un usuario podría en teoría intentar escribir directamente sobre
 *    su fila (aunque solo puede marcarse a sí mismo como 'vencida' con
 *    este código específico, cualquier política de UPDATE abierta sobre
 *    esa tabla es riesgosa a futuro).
 *
 * Recomendado: mover esta actualización a una Supabase Edge Function /
 * cron job (pg_cron) que use CURRENT_DATE del servidor, y restringir
 * RLS de 'suscripciones' a solo lectura para el rol autenticado normal.
 * Mientras tanto, este archivo corrige los bugs de timezone y de
 * carrera que sí son responsabilidad del frontend.
 */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Ref para saber si el componente sigue montado dentro de funciones async
  // que pueden resolver después de un unmount (evita warnings y updates
  // fantasma).
  const mountedRef = useRef(true);

  // Parsea una fecha 'YYYY-MM-DD' (columna `date` de Postgres) como fecha
  // LOCAL, evitando el desfase de un día que provoca `new Date(str)`
  // (que interpreta el string como UTC medianoche).
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const loadSubscription = async (userId) => {
    if (!userId) {
      if (mountedRef.current) {
        setSuscripcion(null);
        setIsSubscriptionActive(false);
        setSubscriptionLoading(false);
      }
      return;
    }

    if (mountedRef.current) setSubscriptionLoading(true);

    try {
      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error al cargar suscripción:', error);
        setSuscripcion(null);
        setIsSubscriptionActive(false);
        setSubscriptionLoading(false);
        return;
      }

      if (!data) {
        // No existe suscripción (caso extremo): esto no debería ocurrir
        // si el trigger de creación en la BD funciona correctamente.
        // Se loguea como anomalía en vez de "auto-repararse" insertando
        // desde el cliente, para no ocultar el bug real y no requerir
        // permiso de INSERT desde el frontend.
        console.error(
          `[Auth] Usuario ${userId} no tiene fila en 'suscripciones'. ` +
          `Revisar el trigger de creación de suscripción en la BD.`
        );
        setSuscripcion(null);
        setIsSubscriptionActive(false);
        setSubscriptionLoading(false);
        return;
      }

      // --- Verificación de vencimiento ---
      // El UPDATE a 'vencida' ya NO se hace desde el cliente: ahora lo
      // ejecuta a diario una función SECURITY DEFINER programada con
      // pg_cron en el servidor (ver migracion_suscripciones_rls_cron.sql).
      // RLS bloquea cualquier intento de UPDATE desde el rol
      // 'authenticated', así que aquí solo LEEMOS el estado ya calculado.
      // Puede haber hasta ~24h de desfase entre el vencimiento real y la
      // actualización del campo 'estado' en la BD; por eso, además de
      // confiar en 'estado', recalculamos 'activa' comparando también
      // contra 'fecha_vencimiento' localmente, para que la UI sea
      // correcta incluso en esa ventana.
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vencimiento = parseLocalDate(data.fecha_vencimiento);
      const estadoActual = data.estado;

      if (!mountedRef.current) return;

      setSuscripcion(data);

      const activa =
        (estadoActual === 'activa' || estadoActual === 'prueba') &&
        vencimiento && vencimiento >= hoy;
      setIsSubscriptionActive(activa);

      console.log(
        `Suscripción: ${activa ? 'ACTIVA' : 'INACTIVA'} ` +
        `(estado: ${estadoActual}, vencimiento: ${data.fecha_vencimiento})`
      );
    } catch (err) {
      console.error('Error inesperado en loadSubscription:', err);
      if (mountedRef.current) {
        setSuscripcion(null);
        setIsSubscriptionActive(false);
      }
    } finally {
      if (mountedRef.current) setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Solo usamos el listener de onAuthStateChange como fuente única de
    // verdad. En Supabase JS v2, este listener dispara un evento
    // INITIAL_SESSION apenas se registra, por lo que ya cubre la carga
    // inicial: no hace falta llamar a getSession() por separado (evitamos
    // así la doble ejecución de loadSubscription al montar).
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Evitamos recargar la suscripción en refrescos silenciosos de
        // token, que no cambian el estado de la suscripción.
        if (event === 'TOKEN_REFRESHED') return;
        await loadSubscription(currentUser.id);
      } else {
        setSuscripcion(null);
        setIsSubscriptionActive(false);
        setSubscriptionLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
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

  const register = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    // No creamos suscripción aquí; confiamos en el trigger de la base de datos.
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