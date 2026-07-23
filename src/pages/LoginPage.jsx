import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    if (!resetEmail) {
      setResetError('Ingresa tu correo electrónico');
      return;
    }
    setLoadingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setResetMessage('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo.');
      setResetEmail('');
      setTimeout(() => {
        setShowResetForm(false);
        setResetMessage('');
      }, 5000);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4"
      style={{
        background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
      }}
    >
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Mensaje de bienvenida */}
        <div className="text-center mb-8">
          {/* Estilo ajustado al look de boosmap.com: peso máximo (font-black,
              900) en vez de extrabold (800) — su tipografía de marca usa un
              trazo más grueso/geométrico. No pude leer el font-family exacto
              desde su CSS (Astro lo compila en un bundle aparte), así que
              esto es la aproximación más cercana con Poppins. Si consigues
              el nombre exacto desde el inspector del navegador, lo cambiamos.

              Tamaño en móvil subido de 4xl a 5xl (36px -> 48px) como pediste;
              sigue escalando hasta 7xl (72px) en laptop/tablet (md+), y el
              breakpoint sm intermedio evita que se corte en pantallas muy
              angostas (320-375px). */}
          <h1 className="font-[Poppins] text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.03em] leading-none">
            <span className="text-white">Driver</span>
            <span className="text-orange-500">Boos</span>
          </h1>
          <p className="text-lg text-gray-400 drop-shadow-md mt-2 font-light">
            Plataforma de gestión de entregas (beta)
          </p>
        </div>

        {/* Formulario de login o recuperación */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-center text-white mb-6">
            {showResetForm ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>

          {!showResetForm ? (
            // --- Formulario de login ---
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition pr-12"
                  />
                  {/* Antes: sin min-h-0, heredaba min-height:54px + padding:12px 24px
                      del <button> global. La caja invisible del botón (~54x68px)
                      se metía dentro del input, tapando parte del texto/click
                      cerca del borde derecho. Ahora el botón mide solo lo que
                      necesita el ícono. */}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-h-0 p-1 text-gray-400 hover:text-white focus:outline-none"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Iniciar sesión
              </button>
            </form>
          ) : (
            // --- Formulario de recuperación ---
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-gray-300 text-sm">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
              {resetMessage && <p className="text-green-400 text-sm">{resetMessage}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingReset}
                >
                  {loadingReset ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetMessage('');
                    setResetError('');
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Enlaces inferiores */}
          <div className="mt-6 text-center space-y-2">
            {!showResetForm ? (
              <>
                <p className="text-sm text-gray-400">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-orange-400 hover:text-orange-300 hover:underline transition">
                    Regístrate
                  </Link>
                </p>
                {/* Antes: sin min-h-0/padding reset, este link-botón heredaba
                    min-height:54px + padding:12px 24px del button global,
                    generando un bloque alto con espacio en blanco raro donde
                    debería verse como texto simple. */}
                <button
                  onClick={() => setShowResetForm(true)}
                  className="text-sm text-orange-400 hover:text-orange-300 hover:underline transition block w-full min-h-0 p-0"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowResetForm(false);
                  setResetMessage('');
                  setResetError('');
                }}
                className="text-sm text-orange-400 hover:text-orange-300 hover:underline transition min-h-0 p-0"
              >
                ← Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Desarrollado por <span className="text-orange-400 font-medium">AndesRo</span> © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;