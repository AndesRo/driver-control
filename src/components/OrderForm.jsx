import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const OrderForm = ({ onOrderAdded }) => {
  const { user } = useAuth();
  const [comunas, setComunas] = useState([]);
  const [form, setForm] = useState({
    order_number: '',
    comuna: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'entregado',
    notas: '',
    extra_peso: false,
    tag: false,
    capacitacion: false
  });
  const [monto, setMonto] = useState(0);
  const [loading, setLoading] = useState(false);

  // Definición de extras (para la interfaz)
  const extrasList = [
    { key: 'extra_peso', label: 'Extra peso', monto: 1500, icon: '💪', description: 'Pedido de 3 carros o más' },
    { key: 'tag', label: 'Tag', monto: 1500, icon: '🏷️', description: 'Huechurapa, Conchalí, Independencia, Recoleta' },
    { key: 'capacitacion', label: 'Capacitación', monto: 2000, icon: '🎓', description: 'Capacitación realizada' },
  ];

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

  // Toggle de extras (por tarjeta)
  const toggleExtra = (key) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
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
          fecha: form.fecha,
          estado: form.estado,
          monto_bruto: monto,
          user_id: user.id,
          notas: form.notas || ''
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
        fecha: form.fecha,
        estado: 'entregado',
        notas: '',
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
        <input
          type="text"
          name="notas"
          placeholder="Bono extra / Nota especial"
          value={form.notas}
          onChange={handleChange}
          className="w-full"
        />
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

      {/* Extras como tarjetas interactivas */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Extras</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {extrasList.map((extra) => {
            const isActive = form[extra.key];
            return (
              <div
                key={extra.key}
                onClick={() => toggleExtra(extra.key)}
                className={`
                  cursor-pointer rounded-xl p-3 border-2 transition-all duration-200
                  ${isActive
                    ? 'border-primary bg-[#3a3a3a] shadow-lg shadow-primary/20'
                    : 'border-[#555] bg-[#2d2d2d] hover:border-[#777]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{extra.icon}</span>
                    <div>
                      <div className={`font-semibold ${isActive ? 'text-primary' : 'text-gray-300'}`}>
                        {extra.label}
                      </div>
                      <div className="text-xs text-gray-400">{extra.description}</div>
                    </div>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-primary text-white' : 'border-2 border-gray-500'}
                  `}>
                    {isActive && '✓'}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400 mt-1">
                  +${extra.monto}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-right font-semibold text-lg">Monto bruto: ${monto}</div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

export default OrderForm;