import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Obtener el fragmento de la URL
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Extraer parámetros del fragmento
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Establecer sesión con Supabase
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            // Redirigir al home
            navigate('/');
          } else {
            console.error('Error al establecer sesión:', error);
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-white text-center">
        <div className="text-2xl">⏳</div>
        <p className="mt-4">Verificando tu cuenta...</p>
      </div>
    </div>
  );
};

export default AuthCallback;