import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const itemsPerPage = 10;

  // Verificar admin y cargar datos
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Verificar admin
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminCheck) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // 2. Cargar perfiles y suscripciones
      const [profilesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('suscripciones').select('*')
      ]);

      if (profilesRes.error || subsRes.error) {
        console.error('Error cargando datos');
        setLoading(false);
        return;
      }

      const combined = profilesRes.data.map(p => {
        const sub = subsRes.data?.find(s => s.user_id === p.id);
        return { ...p, suscripcion: sub };
      });

      setUsers(combined);
      setLoading(false);
    };

    fetchAdminData();
  }, [user]);

  // Filtrado por búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter(u =>
      u.nombre?.toLowerCase().includes(term) ||
      u.apellido?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Acciones
  const handleActivar = async (userId) => {
    if (!confirm('¿Activar la suscripción de este usuario?')) return;
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
      alert('✅ Suscripción activada');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  const handleSuspender = async (userId) => {
    if (!confirm('¿Suspender la suscripción?')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'suspender' }));
    try {
      const { error } = await supabase
        .from('suscripciones')
        .update({ estado: 'suspendida' })
        .eq('user_id', userId);
      if (error) throw error;
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, suscripcion: { ...u.suscripcion, estado: 'suspendida' } }
            : u
        )
      );
      alert('⛔ Suspendida');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  const handleExtender = async (userId) => {
    if (!confirm('¿Extender 30 días?')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'extender' }));
    try {
      const vencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { error } = await supabase
        .from('suscripciones')
        .update({ fecha_vencimiento: vencimiento })
        .eq('user_id', userId);
      if (error) throw error;
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, suscripcion: { ...u.suscripcion, fecha_vencimiento: vencimiento } }
            : u
        )
      );
      alert('📅 Extendida 30 días');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  // Renderizado condicional
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-primary text-xl">Cargando usuarios...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center text-red-500">
        No tienes permisos de administrador.
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-primary">👥 Usuarios</h2>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 bg-[#2d2d2d] border border-[#444] rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Vista de tabla en pantallas grandes */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#2d2d2d] text-gray-300">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Apellido</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Vencimiento</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              paginatedUsers.map(u => {
                const sub = u.suscripcion || {};
                const loadingAction = actionLoading[u.id];
                return (
                  <tr key={u.id} className="border-b border-[#444] hover:bg-[#2a2a2a]">
                    <td className="p-3">{u.nombre}</td>
                    <td className="p-3">{u.apellido}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sub.estado === 'activa' ? 'bg-green-700' :
                        sub.estado === 'prueba' ? 'bg-yellow-700' :
                        sub.estado === 'vencida' ? 'bg-red-700' :
                        sub.estado === 'suspendida' ? 'bg-gray-700' :
                        'bg-gray-500'
                      }`}>
                        {sub.estado || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">{sub.tipo || 'N/A'}</td>
                    <td className="p-3">{sub.fecha_vencimiento || 'N/A'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleActivar(u.id)}
                          disabled={loadingAction}
                          className={`bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition ${loadingAction === 'activar' ? 'opacity-50' : ''}`}
                        >
                          {loadingAction === 'activar' ? '...' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleSuspender(u.id)}
                          disabled={loadingAction}
                          className={`bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded transition ${loadingAction === 'suspender' ? 'opacity-50' : ''}`}
                        >
                          {loadingAction === 'suspender' ? '...' : 'Suspender'}
                        </button>
                        <button
                          onClick={() => handleExtender(u.id)}
                          disabled={loadingAction}
                          className={`bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition ${loadingAction === 'extender' ? 'opacity-50' : ''}`}
                        >
                          {loadingAction === 'extender' ? '...' : 'Extender'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas en móviles */}
      <div className="md:hidden space-y-4">
        {paginatedUsers.length === 0 ? (
          <p className="text-center text-gray-400">No hay usuarios registrados.</p>
        ) : (
          paginatedUsers.map(u => {
            const sub = u.suscripcion || {};
            const loadingAction = actionLoading[u.id];
            return (
              <div key={u.id} className="bg-[#2d2d2d] rounded-xl p-4 shadow-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">{u.nombre} {u.apellido}</h3>
                    <p className="text-sm text-gray-400">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sub.estado === 'activa' ? 'bg-green-700' :
                    sub.estado === 'prueba' ? 'bg-yellow-700' :
                    sub.estado === 'vencida' ? 'bg-red-700' :
                    sub.estado === 'suspendida' ? 'bg-gray-700' :
                    'bg-gray-500'
                  }`}>
                    {sub.estado || 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <span>Tipo: {sub.tipo || 'N/A'}</span>
                  <span className="ml-4">Vence: {sub.fecha_vencimiento || 'N/A'}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => handleActivar(u.id)}
                    disabled={loadingAction}
                    className={`bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded flex-1 transition ${loadingAction === 'activar' ? 'opacity-50' : ''}`}
                  >
                    {loadingAction === 'activar' ? '...' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleSuspender(u.id)}
                    disabled={loadingAction}
                    className={`bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-4 py-2 rounded flex-1 transition ${loadingAction === 'suspender' ? 'opacity-50' : ''}`}
                  >
                    {loadingAction === 'suspender' ? '...' : 'Suspender'}
                  </button>
                  <button
                    onClick={() => handleExtender(u.id)}
                    disabled={loadingAction}
                    className={`bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded flex-1 transition ${loadingAction === 'extender' ? 'opacity-50' : ''}`}
                  >
                    {loadingAction === 'extender' ? '...' : 'Extender'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-[#2d2d2d] text-white px-4 py-2 rounded disabled:opacity-40 hover:bg-[#3d3d3d] transition"
          >
            ◀
          </button>
          <span className="text-gray-300 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-[#2d2d2d] text-white px-4 py-2 rounded disabled:opacity-40 hover:bg-[#3d3d3d] transition"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;