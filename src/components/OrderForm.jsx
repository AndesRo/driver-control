import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const OrderForm = ({ onOrderAdded }) => {
  const { user } = useAuth();
  const [comunas, setComunas] = useState([]);
  const [form, setForm] = useState({
    order_number: '',
    comuna: '',
    ruta: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'entregado',
    notas: '',
    extra_peso: false
  });
  const [monto, setMonto] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar tarifas
  useEffect(() => {
    const fetchTarifas = async () => {
      const { data, error } = await supabase.from('tarifas').select('*');
      if (!error) setComunas(data);
    };
    fetchTarifas();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (name === 'comuna') {
      const selected = comunas.find(c => c.comuna === value);
      setMonto(selected ? selected.monto_bruto : 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Debes iniciar sesión');
    if (!form.order_number || !form.comuna || !form.fecha) {
      return alert('Completa los campos obligatorios');
    }

    setLoading(true);
    try {
      // 1. Insertar la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: form.order_number,
          comuna: form.comuna,
          ruta: form.ruta || 'Sin ruta',
          fecha: form.fecha,
          estado: form.estado,
          notas: form.notas || '',
          monto_bruto: monto,
          user_id: user.id
        })
        .select()
        .single();

      if (orderError) throw new Error('Error al guardar orden: ' + orderError.message);

      // 2. Si está marcado extra peso, registrar extra
      if (form.extra_peso) {
        const { error: extraError } = await supabase
          .from('extras')
          .insert({
            user_id: user.id,
            tipo: 'extra_peso',
            monto: 1500,
            fecha: form.fecha,
            nota: `Extra peso por orden N° ${form.order_number}`
          });
        if (extraError) {
          console.warn('Error al registrar extra peso:', extraError);
          // No detenemos el flujo, solo advertimos
        }
      }

      alert('Orden registrada ✅' + (form.extra_peso ? ' + Extra peso $1500' : ''));
      // Resetear formulario (manteniendo fecha)
      setForm({
        order_number: '',
        comuna: '',
        ruta: '',
        fecha: form.fecha,
        estado: 'entregado',
        notas: '',
        extra_peso: false
      });
      setMonto(0);
      if (onOrderAdded) onOrderAdded();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-primary">Nueva orden</h2>
      <input
        type="text"
        name="order_number"
        placeholder="N° orden"
        required
        value={form.order_number}
        onChange={handleChange}
        className="w-full"
      />
      <select
        name="comuna"
        required
        value={form.comuna}
        onChange={handleChange}
        className="w-full"
      >
        <option value="">Seleccionar comuna</option>
        {comunas.map(c => (
          <option key={c.comuna} value={c.comuna}>
            {c.comuna} - ${c.monto_bruto}
          </option>
        ))}
      </select>

      {/* Campo ruta libre para cualquier comuna */}
      <input
        type="text"
        name="ruta"
        placeholder="Ruta (ej: 1, 2, 3, K, o personalizada)"
        value={form.ruta}
        onChange={handleChange}
        className="w-full"
      />

      <input
        type="date"
        name="fecha"
        required
        value={form.fecha}
        onChange={handleChange}
        className="w-full"
      />

      <select
        name="estado"
        value={form.estado}
        onChange={handleChange}
        className="w-full"
      >
        <option value="entregado">Entregado</option>
        <option value="parcial">Entrega parcial</option>
        <option value="no_entregado">No entregado</option>
      </select>

      {/* Notas */}
      <textarea
        name="notas"
        placeholder="Notas (opcional)"
        value={form.notas}
        onChange={handleChange}
        rows="2"
        className="w-full"
      />

      {/* Extra peso checkbox */}
      <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          name="extra_peso"
          checked={form.extra_peso}
          onChange={handleChange}
          className="w-5 h-5 accent-primary"
        />
        <span>Agregar Extra peso ($1.500) por pedido de 3 carros o más</span>
      </label>

      <div className="text-right font-semibold">Monto bruto: ${monto}</div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

export default OrderForm;