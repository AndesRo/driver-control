import { useAuth } from '../context/AuthContext';

const SubscriptionBlocked = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card w-full max-w-md text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-500 mb-2">Suscripción vencida</h2>
        <p className="text-gray-300 mb-4">
          Tu suscripción ha vencido. Renueva para seguir utilizando la aplicación.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Para renovar, realiza una transferencia a la cuenta indicada y luego contacta al administrador.
        </p>
        <div className="bg-[#2d2d2d] p-3 rounded-lg mb-4 text-left">
          <p className="text-sm text-gray-400">Datos para transferencia:</p>
          <p className="font-mono text-primary">Banco: XYZ</p>
          <p className="font-mono text-primary">Cuenta: 123456789</p>
          <p className="font-mono text-primary">RUT: 12.345.678-9</p>
          <p className="font-mono text-primary">Email: admin@ejemplo.com</p>
        </div>
        <button onClick={logout} className="btn-secondary w-full">Cerrar sesión</button>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;