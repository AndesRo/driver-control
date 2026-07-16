import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminCheck) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      const { data: suscripciones } = await supabase
        .from('suscripciones')
        .select('*');

      const combined = profiles.map(p => {
        const sub = suscripciones?.find(s => s.user_id === p.id);
        return { ...p, suscripcion: sub };
      });
      setUsers(combined);
      setLoading(false);
    };

    fetchUsers();
  }, [user]);

  const handleActivar = async (userId) => {
    await supabase
      .from('suscripciones')
      .update({
        estado: 'activa',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      })
      .eq('user_id', userId);
    window.location.reload();
  };

  const handleSuspender = async (userId) => {
    await supabase
      .from('suscripciones')
      .update({ estado: 'suspendida' })
      .eq('user_id', userId);
    window.location.reload();
  };

  const handleExtender = async (userId) => {
    await supabase
      .from('suscripciones')
      .update({
        fecha_vencimiento: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      })
      .eq('user_id', userId);
    window.location.reload();
  };

  if (loading) return <div className="p-4">Cargando usuarios...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Usuarios</h2>
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
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#444]">
                <td className="p-2">{u.nombre}</td>
                <td className="p-2">{u.apellido}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    u.suscripcion?.estado === 'activa' ? 'bg-green-700' :
                    u.suscripcion?.estado === 'prueba' ? 'bg-yellow-700' :
                    u.suscripcion?.estado === 'vencida' ? 'bg-red-700' :
                    'bg-gray-700'
                  }`}>
                    {u.suscripcion?.estado || 'N/A'}
                  </span>
                </td>
                <td className="p-2">{u.suscripcion?.tipo || 'N/A'}</td>
                <td className="p-2">{u.suscripcion?.fecha_vencimiento || 'N/A'}</td>
                <td className="p-2 space-x-1">
                  <button onClick={() => handleActivar(u.id)} className="btn-primary text-xs px-2 py-1">Activar</button>
                  <button onClick={() => handleSuspender(u.id)} className="btn-secondary text-xs px-2 py-1">Suspender</button>
                  <button onClick={() => handleExtender(u.id)} className="btn-secondary text-xs px-2 py-1">Extender</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;