import { useAuth } from '../context/AuthContext';

const SuscripcionVencida = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="text-6xl">⛔</div>
        <h1 className="text-2xl font-bold text-red-500">Suscripción vencida</h1>
        <p className="text-gray-300">
          Tu suscripción ha vencido. Para seguir utilizando la aplicación, debes renovarla.
        </p>
        <p className="text-sm text-gray-400">
          Contacta al administrador para más información.
        </p>
        <button onClick={handleLogout} className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default SuscripcionVencida;