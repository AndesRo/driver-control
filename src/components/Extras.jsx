import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Extras = () => {
  const { user } = useAuth();
  const [extras, setExtras] = useState([]);
  const [form, setForm] = useState({
    tipo: 'extra_peso',
    monto: 1500,
    fecha: new Date().toISOString().split('T')[0],
    nota: ''
  });

  // Cargar extras del usuario
  useEffect(() => {
    const fetchExtras = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });
      if (!error) setExtras(data);
    };
    fetchExtras();
  }, [user]);

  // Manejar cambio en formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'tipo') {
      const montos = {
        extra_peso: 1500,
        tag: 1500,
        sin_moradores: 0,
        capacitacion: 2000
      };
      setForm(prev => ({ ...prev, monto: montos[value] || 0 }));
    }
  };

  // Guardar extra
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (form.monto <= 0) return alert('El monto debe ser mayor a 0');
    const { error } = await supabase.from('extras').insert({
      ...form,
      user_id: user.id
    });
    if (!error) {
      alert('Extra registrado ✅');
      setForm({ tipo: 'extra_peso', monto: 1500, fecha: new Date().toISOString().split('T')[0], nota: '' });
      // Recargar lista
      const { data } = await supabase
        .from('extras')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });
      setExtras(data);
    } else {
      alert('Error: ' + error.message);
    }
  };

  // Eliminar extra
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este extra?')) return;
    await supabase.from('extras').delete().eq('id', id);
    setExtras(extras.filter(e => e.id !== id));
  };

  // Etiquetas amigables
  const tipoLabels = {
    extra_peso: 'Extra peso (3+ carros)',
    tag: 'Tag (Huechurapa, Conchalí, Independencia, Recoleta)',
    sin_moradores: 'Pedido sin moradores',
    capacitacion: 'Capacitación'
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-primary"></h2>

      {/* Formulario de registro (ARRIBA) */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-3">Registrar extra y Bonos</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full">
            <option value="extra_peso">Extra peso ($1500)</option>
            <option value="tag">Tag ($1500)</option>
            <option value="sin_moradores">Pedido sin moradores</option>
            <option value="capacitacion">Capacitación ($2000)</option>
          </select>
          <input
            type="number"
            name="monto"
            placeholder="Monto"
            value={form.monto}
            onChange={handleChange}
            required
            min="0"
            className="w-full"
          />
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
            className="w-full"
          />
          <input
            type="text"
            name="nota"
            placeholder="Nota (opcional)"
            value={form.nota}
            onChange={handleChange}
            className="w-full"
          />
          <button type="submit" className="btn-primary w-full">Guardar extra</button>
        </form>
      </div>

    

      {/* Enlaces Typeform (ABAJO) - con estilo secundario */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-lg">Formularios para registrar extras</h3>
        <a
          href="https://boosmap.typeform.com/to/sFgws2bM"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary block text-center"
        >
          📋 JUMBO VA
        </a>
        <a
          href="https://boosmap.typeform.com/to/tVQ0iVHF"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary block text-center"
        >
          📋 EXTRAS
        </a>
        <p className="text-xs text-gray-500 text-center mt-2">
          Estos enlaces te llevan a formularios externos de Typeform.
        </p>
      </div>
    </div>
  );
};

export default Extras;