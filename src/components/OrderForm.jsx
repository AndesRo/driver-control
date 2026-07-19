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
    extra_peso: false,
    tag: false,
    capacitacion: false
  });
  const [monto, setMonto] = useState(0);
  const [loading, setLoading] = useState(false);

  // Opciones de ruta
  const rutaOptions = ['1', '2', '3', 'K', 'Sin ruta'];

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
      // Insertar orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: form.order_number,
          comuna: form.comuna,
          ruta: form.ruta || 'Sin ruta',
          fecha: form.fecha,
          estado: form.estado,
          monto_bruto: monto,
          user_id: user.id,
          notas: '' // ya no se usa, pero la columna existe
        })
        .select()
        .single();

      if (orderError) throw new Error('Error al guardar orden: ' + orderError.message);

      const orderId = orderData.id;

      // Preparar extras seleccionados
      const extrasToInsert = [];
      if (form.extra_peso) {
        extrasToInsert.push({
          user_id: user.id,
          tipo: 'extra_peso',
          monto: 1500,
          fecha: form.fecha,
          nota: `Extra peso por orden N° ${form.order_number}`,
          order_id: orderId
        });
      }
      if (form.tag) {
        extrasToInsert.push({
          user_id: user.id,
          tipo: 'tag',
          monto: 1500,
          fecha: form.fecha,
          nota: `Tag por orden N° ${form.order_number}`,
          order_id: orderId
        });
      }
      if (form.capacitacion) {
        extrasToInsert.push({
          user_id: user.id,
          tipo: 'capacitacion',
          monto: 2000,
          fecha: form.fecha,
          nota: `Capacitación por orden N° ${form.order_number}`,
          order_id: orderId
        });
      }

      if (extrasToInsert.length > 0) {
        const { error: extrasError } = await supabase
          .from('extras')
          .insert(extrasToInsert);
        if (extrasError) console.warn('Error al registrar extras:', extrasError);
      }

      alert('Orden registrada ✅' + (extrasToInsert.length > 0 ? ` + ${extrasToInsert.length} extra(s)` : ''));
      // Resetear formulario
      setForm({
        order_number: '',
        comuna: '',
        ruta: '',
        fecha: form.fecha,
        estado: 'entregado',
        extra_peso: false,
        tag: false,
        capacitacion: false
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

      {/* Antes: cada input en su propia línea full-width. En móvil eso está perfecto,
          pero en laptop (hasta ~1152px de .app-container) se veían campos gigantes.
          Ahora: 1 columna en móvil, 2 columnas en md+ agrupando campos relacionados. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="order_number"
          placeholder="N° orden"
          required
          value={form.order_number}
          onChange={handleChange}
          className="w-full"
          inputMode="numeric"
          autoComplete="off"
        />
        <select
          name="ruta"
          value={form.ruta}
          onChange={handleChange}
          className="w-full"
        >
          <option value="">Seleccionar ruta</option>
          {rutaOptions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Aquí ya no está el textarea de notas, solo checkboxes de extras */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            name="extra_peso"
            checked={form.extra_peso}
            onChange={handleChange}
            className="w-6 h-6 accent-primary"
          />
          <span className="text-base">Extra peso ($1.500)</span>
        </label>
        <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            name="tag"
            checked={form.tag}
            onChange={handleChange}
            className="w-6 h-6 accent-primary"
          />
          <span className="text-base">Tag ($1.500) </span>
        </label>
        <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            name="capacitacion"
            checked={form.capacitacion}
            onChange={handleChange}
            className="w-6 h-6 accent-primary"
          />
          <span className="text-base">Capacitación ($2.000)</span>
        </label>
      </div>

      <div className="text-right font-semibold text-lg">Monto bruto: ${monto}</div>

      {/* Botón guardar - siempre visible, full-width incluso en laptop
          para que sea un blanco claro de acción al final del form */}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

export default OrderForm;