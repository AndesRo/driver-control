import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'text-primary' : 'text-gray-400')}>
        <span className="icon">➕</span>
        <span className="label">Registrar</span>
      </NavLink>
      <NavLink to="/ordenes" className={({ isActive }) => (isActive ? 'text-primary' : 'text-gray-400')}>
        <span className="icon">📋</span>
        <span className="label">Órdenes</span>
      </NavLink>
      <NavLink to="/formularios" className={({ isActive }) => (isActive ? 'text-primary' : 'text-gray-400')}>
        <span className="icon">📝</span>
        <span className="label">Formularios</span>
      </NavLink>
      <NavLink to="/reporte" className={({ isActive }) => (isActive ? 'text-primary' : 'text-gray-400')}>
        <span className="icon">📊</span>
        <span className="label">Reporte</span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'text-primary' : 'text-gray-400')}>
          <span className="icon">⚙️</span>
          <span className="label">Admin</span>
        </NavLink>
      )}
      <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
        <span className="icon">🚪</span>
        <span className="label">Salir</span>
      </button>
    </nav>
  );
};

export default Navbar;