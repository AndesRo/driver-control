import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const RegisterPage = () => {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar mensajes al cambiar
    setError('');
    setMessage('');
  };

  const validate = () => {
    if (!form.nombre || !form.apellido || !form.telefono || !form.email || !form.password || !form.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Formato de correo inválido');
      return false;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre: form.nombre,
            apellido: form.apellido,
            telefono: form.telefono
          }
        }
      });

      if (signUpError) {
        // Manejar error específico si el usuario ya existe
        if (signUpError.message.includes('already registered')) {
          setError('Este correo ya está registrado. Por favor, inicia sesión o restablece tu contraseña.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Si el usuario fue creado exitosamente
      if (data?.user) {
        setMessage(`✅ Correo de confirmación enviado a ${form.email}. Revisa tu bandeja de entrada (y spam).`);
        // Resetear el formulario excepto email y contraseña opcionalmente
        setForm({
          nombre: '',
          apellido: '',
          telefono: '',
          email: form.email,
          password: '',
          confirmPassword: ''
        });
      } else {
        // Caso raro
        setMessage('Usuario registrado, pero no se pudo enviar el correo. Contacta a soporte.');
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para reenviar el correo de confirmación
  const handleResendConfirmation = async () => {
    if (!form.email) {
      setError('Ingresa el correo para reenviar la confirmación.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email
      });
      if (error) {
        setError('Error al reenviar: ' + error.message);
      } else {
        setMessage(`✅ Se reenvió el correo de confirmación a ${form.email}.`);
      }
    } catch (err) {
      setError('Error al reenviar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 bg-[#1a1a1a]">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-primary mb-6">Crear cuenta</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="w-full input-lg"
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              className="w-full input-lg"
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={handleChange}
              required
              className="w-full input-lg"
            />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full input-lg"
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full input-lg"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full input-lg"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}
            <button type="submit" className="btn-primary w-full py-3 text-lg" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
          
          {/* Botón para reenviar confirmación */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              ¿No recibiste el correo?{' '}
              <button 
                onClick={handleResendConfirmation} 
                className="text-primary hover:underline"
                disabled={loading}
              >
                Reenviar confirmación
              </button>
            </p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Desarrollado por <span className="text-primary">AndrésRo</span> © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default RegisterPage;