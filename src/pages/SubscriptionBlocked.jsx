import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionBlocked = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContact = () => {
    const nombre = user?.user_metadata?.nombre || 'Usuario';
    const email = user?.email || '';

    // Antes: %0A escrito a mano y el resto del texto SIN encodeURIComponent.
    // Si nombre o email traían espacios, tildes, ñ, o un "+" (común en emails
    // tipo usuario+test@gmail.com), la URL quedaba mal formada y WhatsApp
    // podía truncar o no precargar el mensaje. Ahora se arma con \n normal
    // y se codifica todo el bloque de una sola vez.
    const mensaje =
      `Hola, deseo renovar mi suscripción de Driver Boos.\n\n` +
      `Nombre: ${nombre}\n` +
      `Correo: ${email}`;

    window.open(`https://wa.me/56997416485?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-primary">⛔ Suscripción vencida</h1>
        <p className="text-gray-300">
          Tu período gratuito de 7 días ha finalizado. Para continuar utilizando <span className="font-semibold text-white">Driver Boos</span> debes renovar tu suscripción.
        </p>
        <div className="bg-[#3d3d3d] p-4 rounded-lg">
          <p className="text-2xl font-bold text-primary">$2.490</p>
          <p className="text-gray-400 text-sm">al mes</p>
        </div>
        <button onClick={handleContact} className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2">
          <span>📱</span> Contactar al Administrador
        </button>
        <p className="text-gray-500 text-sm">Al hacer clic, se abrirá WhatsApp para que el administrador te contacte.</p>
        <button onClick={() => navigate('/login')} className="text-primary hover:underline text-sm">Cerrar sesión</button>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;