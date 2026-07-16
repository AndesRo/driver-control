import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // para mostrar carga en botones

  // Verificar si el usuario es administrador y cargar datos
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Verificar si es admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Error verificando admin:', adminError);
        setLoading(false);
        return;
      }

      if (!adminCheck) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // 2. Cargar todos los usuarios con sus perfiles y suscripciones
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error cargando perfiles:', profilesError);
        setLoading(false);
        return;
      }

      const { data: suscripciones, error: subsError } = await supabase
        .from('suscripciones')
        .select('*');

      if (subsError) {
        console.error('Error cargando suscripciones:', subsError);
        setLoading(false);
        return;
      }

      // Combinar datos
      const combined = profiles.map(p => {
        const sub = suscripciones?.find(s => s.user_id === p.id);
        return { ...p, suscripcion: sub };
      });

      setUsers(combined);
      setLoading(false);
    };

    fetchAdminData();
  }, [user]);

  // Acción: Activar
  const handleActivar = async (userId) => {
    if (!window.confirm('¿Activar la suscripción de este usuario?')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'activar' }));
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const vencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { error } = await supabase
        .from('suscripciones')
        .update({
          estado: 'activa',
          fecha_inicio: hoy,
          fecha_vencimiento: vencimiento,
          tipo: 'mensual'
        })
        .eq('user_id', userId);

      if (error) throw error;
      alert('✅ Suscripción activada correctamente.');
      // Actualizar lista local
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                suscripcion: { ...u.suscripcion, estado: 'activa', fecha_inicio: hoy, fecha_vencimiento: vencimiento, tipo: 'mensual' }
              }
            : u
        )
      );
    } catch (err) {
      console.error('Error al activar:', err);
      alert('❌ Error al activar: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  // Acción: Suspender
  const handleSuspender = async (userId) => {
    if (!window.confirm('¿Suspender la suscripción de este usuario?')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'suspender' }));
    try {
      const { error } = await supabase
        .from('suscripciones')
        .update({ estado: 'suspendida' })
        .eq('user_id', userId);

      if (error) throw error;
      alert('⛔ Suscripción suspendida.');
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, suscripcion: { ...u.suscripcion, estado: 'suspendida' } }
            : u
        )
      );
    } catch (err) {
      console.error('Error al suspender:', err);
      alert('❌ Error al suspender: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  // Acción: Extender
  const handleExtender = async (userId) => {
    if (!window.confirm('¿Extender 30 días la suscripción de este usuario?')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'extender' }));
    try {
      const vencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { error } = await supabase
        .from('suscripciones')
        .update({ fecha_vencimiento: vencimiento })
        .eq('user_id', userId);

      if (error) throw error;
      alert('📅 Suscripción extendida 30 días.');
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, suscripcion: { ...u.suscripcion, fecha_vencimiento: vencimiento } }
            : u
        )
      );
    } catch (err) {
      console.error('Error al extender:', err);
      alert('❌ Error al extender: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  // Si no es admin, mostrar mensaje
  if (!isAdmin && !loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">No tienes permisos de administrador.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Cargando usuarios...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">👥 Usuarios</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#2d2d2d]">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Apellido</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Vencimiento</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const sub = u.suscripcion || {};
              const loadingAction = actionLoading[u.id];
              return (
                <tr key={u.id} className="border-b border-[#444]">
                  <td className="p-2">{u.nombre}</td>
                  <td className="p-2">{u.apellido}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sub.estado === 'activa' ? 'bg-green-700' :
                      sub.estado === 'prueba' ? 'bg-yellow-700' :
                      sub.estado === 'vencida' ? 'bg-red-700' :
                      sub.estado === 'suspendida' ? 'bg-gray-700' :
                      'bg-gray-500'
                    }`}>
                      {sub.estado || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2">{sub.tipo || 'N/A'}</td>
                  <td className="p-2">{sub.fecha_vencimiento || 'N/A'}</td>
                  <td className="p-2 space-x-1 flex flex-wrap gap-1">
                    <button
                      onClick={() => handleActivar(u.id)}
                      disabled={loadingAction}
                      className={`btn-primary text-xs px-2 py-1 ${loadingAction === 'activar' ? 'opacity-50' : ''}`}
                    >
                      {loadingAction === 'activar' ? '...' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleSuspender(u.id)}
                      disabled={loadingAction}
                      className={`btn-secondary text-xs px-2 py-1 ${loadingAction === 'suspender' ? 'opacity-50' : ''}`}
                    >
                      {loadingAction === 'suspender' ? '...' : 'Suspender'}
                    </button>
                    <button
                      onClick={() => handleExtender(u.id)}
                      disabled={loadingAction}
                      className={`btn-secondary text-xs px-2 py-1 ${loadingAction === 'extender' ? 'opacity-50' : ''}`}
                    >
                      {loadingAction === 'extender' ? '...' : 'Extender'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-gray-400 mt-4">No hay usuarios registrados.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;