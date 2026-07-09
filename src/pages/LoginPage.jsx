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
    <div className="min-h-screen flex flex-col items-center justify-between p-4 bg-[#1a1a1a]">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-primary mb-6">Driver Jumbo</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full">Iniciar sesión</button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            ¿No tienes cuenta? <Link to="/register" className="text-primary hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
      
      {/* Pie de página */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Desarrollado por <span className="text-primary">AndesDev</span> © {new Date().getFullYear()}</p>
        <p className="text-xs text-gray-600">App para conductores</p>
      </footer>
    </div>
  );
};

export default LoginPage;