import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-400'}>
        <span className="icon">➕</span>
        <span className="label">Registrar</span>
      </NavLink>
      <NavLink to="/ordenes" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-400'}>
        <span className="icon">📋</span>
        <span className="label">Órdenes</span>
      </NavLink>
      <NavLink to="/reporte" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-400'}>
        <span className="icon">💰</span>
        <span className="label">Reporte</span>
      </NavLink>
      <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
        <span className="icon">🚪</span>
        <span className="label">Salir</span>
      </button>
    </nav>
  );
};

export default Navbar;