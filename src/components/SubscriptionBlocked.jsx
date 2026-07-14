import React from 'react';

const SubscriptionBlocked = () => {
  // Número de WhatsApp del administrador (formato internacional sin +)
  const whatsappNumber = '56997416485'; // CAMBIA ESTE NÚMERO POR EL TUYO
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hola,%20mi%20suscripción%20a%20Driver%20Control%20ha%20vencido.%20Quiero%20renovar.%20¿Cómo%20puedo%20hacer%20la%20transferencia?`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card max-w-md w-full text-center space-y-6">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-primary">Suscripción vencida</h1>
        <p className="text-gray-300">
          Tu suscripción ha expirado. Para seguir utilizando la aplicación, por favor renueva tu plan.
        </p>
        <div className="bg-[#3d3d3d] p-4 rounded-lg">
          <p className="text-sm text-gray-400">
            Realiza una transferencia a la cuenta indicada y luego contáctanos por WhatsApp para activar tu acceso.
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
        >
          <span>📱</span> Contactar por WhatsApp
        </a>
        <p className="text-xs text-gray-500 mt-4">
          Al hacer clic, se abrirá WhatsApp con un mensaje predefinido.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;