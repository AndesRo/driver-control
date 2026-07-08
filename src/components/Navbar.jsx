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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#444] flex justify-around items-center py-2 px-4">
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-400'}`}>
        <span className="text-xl">➕</span>
        <span className="text-xs">Registrar</span>
      </NavLink>
      <NavLink to="/ordenes" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-400'}`}>
        <span className="text-xl">📋</span>
        <span className="text-xs">Órdenes</span>
      </NavLink>
      <NavLink to="/reporte" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-primary' : 'text-gray-400'}`}>
        <span className="text-xl">💰</span>
        <span className="text-xs">Reporte</span>
      </NavLink>
      <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 flex flex-col items-center">
        <span className="text-xl">🚪</span>
        <span className="text-xs">Salir</span>
      </button>
    </nav>
  );
};

export default Navbar;