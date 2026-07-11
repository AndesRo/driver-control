import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await register(email, password);
      setSuccess(true);
      // Opcional: después de unos segundos redirigir al login
      // setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4"
      style={{
        backgroundImage: `url('/delivery-person.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Driver Control</h1>
          <p className="text-lg text-gray-200 drop-shadow-md mt-2">Crea tu cuenta y comienza a gestionar tus entregas</p>
        </div>

        <div className="card w-full max-w-md bg-[#2d2d2d]/90 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">Registrarse</h2>
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-green-500 text-xl">✅</div>
              <p className="text-white">¡Registro exitoso!</p>
              <p className="text-gray-300 text-sm">
                Hemos enviado un correo de confirmación a <strong>{email}</strong>.
                <br />Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
              <Link to="/login" className="btn-primary inline-block w-full text-center">Ir a iniciar sesión</Link>
            </div>
          ) : (
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
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full input-lg"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full py-3 text-lg">Registrarse</button>
            </form>
          )}
          <p className="text-center text-sm text-gray-400 mt-4">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>

      <footer className="relative z-10 mt-8 text-center text-gray-300 text-sm drop-shadow-md">
        <p>Desarrollado por <span className="text-primary">AndesDev</span> © {new Date().getFullYear()}</p>
        <p className="text-xs text-gray-400">App para conductores</p>
      </footer>
    </div>
  );
};

export default RegisterPage;