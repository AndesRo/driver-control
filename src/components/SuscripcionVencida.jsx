// src/pages/SuscripcionVencida.jsx
import { Link } from 'react-router-dom';

const SuscripcionVencida = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">⛔ Suscripción vencida</h1>
        <p className="text-gray-300 mb-6">
          Tu suscripción ha vencido. Renueva para seguir utilizando la aplicación.
        </p>
        <Link to="/logout" className="btn-primary w-full block text-center">
          Cerrar sesión
        </Link>
      </div>
    </div>
  );
};

export default SuscripcionVencida;