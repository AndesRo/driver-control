import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4"
      style={{
        backgroundImage: `url('/images.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Contenido principal con z-index */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        {/* Mensaje de bienvenida */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Driver Control</h1>
          <p className="text-lg text-gray-200 drop-shadow-md mt-2">Gestiona tus entregas de forma fácil y rápida</p>
        </div>

        {/* Formulario de login */}
        <div className="card w-full max-w-md bg-[#2d2d2d]/90 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full input-lg"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full input-lg"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full py-3 text-lg">Iniciar sesión</button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            ¿No tienes cuenta? <Link to="/register" className="text-primary hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>

      {/* Pie de página */}
      <footer className="relative z-10 mt-8 text-center text-gray-300 text-sm drop-shadow-md">
        <p>Desarrollado por <span className="text-primary">AndesDev</span> © {new Date().getFullYear()}</p>
        <p className="text-xs text-gray-400">App para conductores</p>
      </footer>
    </div>
  );
};

export default LoginPage;