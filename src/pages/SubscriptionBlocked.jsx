import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionBlocked = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContact = () => {
    const nombre = user?.user_metadata?.nombre || 'Usuario';
    const email = user?.email || '';
    const mensaje = `Hola, deseo renovar mi suscripción de Driver Control.%0A%0ANombre: ${nombre}%0ACorreo: ${email}`;
    window.open(`https://wa.me/56997416485?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-primary">⛔ Suscripción vencida</h1>
        <p className="text-gray-300">
          Tu período gratuito de 7 días ha finalizado. Para continuar utilizando <span className="font-semibold text-white">Driver Control</span> debes renovar tu suscripción.
        </p>
        <div className="bg-[#3d3d3d] p-4 rounded-lg">
          <p className="text-2xl font-bold text-primary">$3.000 CLP</p>
          <p className="text-gray-400 text-sm">mensuales</p>
        </div>
        <button onClick={handleContact} className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2">
          <span>📱</span> Contactar por WhatsApp
        </button>
        <p className="text-gray-500 text-sm">Al hacer clic, se abrirá WhatsApp con un mensaje predefinido.</p>
        <button onClick={() => navigate('/login')} className="text-primary hover:underline text-sm">Cerrar sesión</button>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;