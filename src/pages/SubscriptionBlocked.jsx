import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionBlocked = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContactAdmin = () => {
    const nombre = user?.user_metadata?.nombre || 'Usuario';
    const email = user?.email || '';
    const mensaje = `Hola, necesito renovar mi suscripción de DriverBoos.%0A%0ANombre: ${nombre}%0ACorreo: ${email}%0A%0AQuedo atento a la información de pago.`;
    // Reemplaza el número con el del administrador
    window.open(`https://wa.me/56997416485?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card w-full max-w-md text-center space-y-6">
        <div className="text-6xl">⛔</div>
        <h1 className="text-3xl font-bold text-primary">Suscripción vencida</h1>
        <p className="text-gray-300">
          Tu período gratuito ha finalizado. Para seguir usando <span className="font-semibold text-white">DriverBoos</span>, debes renovar tu suscripción.
        </p>
        <div className="bg-[#3d3d3d] p-4 rounded-lg">
          <p className="text-2xl font-bold text-primary">$2.490</p>
          <p className="text-gray-400 text-sm">al mes</p>
        </div>
        <button
          onClick={handleContactAdmin}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
        >
          <span>📱</span> Contactar al administrador
        </button>
        <p className="text-gray-500 text-sm">
          El administrador te compartirá los datos bancarios y gestionará la activación de tu suscripción.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:underline text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;