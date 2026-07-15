import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const SubscriptionBlocked = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePaymentRequest = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('solicitudes_pago')
        .insert({
          user_id: user.id,
          estado: 'pendiente',
          comentario: 'Solicitud de activación por pago'
        });
      if (error) throw error;
      setMessage('Tu solicitud fue enviada correctamente. Una vez confirmado el pago se habilitará el acceso.');
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setMessage('Error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const banco = import.meta.env.VITE_BANCO || 'Banco Santander';
  const tipoCuenta = import.meta.env.VITE_TIPO_CUENTA || 'Cuenta Corriente';
  const numeroCuenta = import.meta.env.VITE_NUMERO_CUENTA || '123456789';
  const titular = import.meta.env.VITE_TITULAR || 'Andres Romero Millaquen';
  const correo = import.meta.env.VITE_CORREO || 'andespart.ar@gmail.com';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a1a] text-white">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-primary text-center mb-4">Suscripción vencida</h1>
        <p className="text-gray-300 text-center mb-6">
          Tu suscripción mensual ha expirado. Para continuar utilizando Driver Control debes renovar tu plan.
        </p>
        <div className="bg-[#2d2d2d] p-4 rounded-lg mb-6">
          <p className="font-semibold text-center">Valor mensual: <span className="text-primary">$3.000 CLP</span></p>
        </div>
        <div className="space-y-2 text-sm mb-6">
          <p><span className="text-gray-400">Banco:</span> {banco}</p>
          <p><span className="text-gray-400">Tipo de cuenta:</span> {tipoCuenta}</p>
          <p><span className="text-gray-400">Número de cuenta:</span> {numeroCuenta}</p>
          <p><span className="text-gray-400">Titular:</span> {titular}</p>
          <p><span className="text-gray-400">Correo:</span> {correo}</p>
        </div>
        <button
          onClick={handlePaymentRequest}
          disabled={loading}
          className="btn-primary w-full py-3 text-lg"
        >
          {loading ? 'Enviando...' : 'Ya realicé el pago'}
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-green-400">{message}</p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBlocked;