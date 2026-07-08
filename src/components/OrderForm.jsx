import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const OrderForm = ({ onOrderAdded }) => {
  const { user } = useAuth();
  const [comunas, setComunas] = useState([]);
  const [form, setForm] = useState({
    order_number: '',
    comuna: '',
    ruta: 1,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'entregado'
  });
  const [monto, setMonto] = useState(0);

  useEffect(() => {
    const fetchTarifas = async () => {
      const { data, error } = await supabase.from('tarifas').select('*');
      if (!error) setComunas(data);
    };
    fetchTarifas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'comuna') {
      const selected = comunas.find(c => c.comuna === value);
      setMonto(selected ? selected.monto_bruto : 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Debes iniciar sesión');
    const { error } = await supabase.from('orders').insert({
      ...form,
      monto_bruto: monto,
      user_id: user.id
    });
    if (!error) {
      alert('Orden registrada ✅');
      setForm({ order_number: '', comuna: '', ruta: 1, fecha: new Date().toISOString().split('T')[0], estado: 'entregado' });
      setMonto(0);
      if (onOrderAdded) onOrderAdded();
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-primary">Nueva orden</h2>
      <input
        type="text" name="order_number" placeholder="N° orden" required
        value={form.order_number} onChange={handleChange}
      />
      <select name="comuna" required value={form.comuna} onChange={handleChange}>
        <option value="">Seleccionar comuna</option>
        {comunas.map(c => <option key={c.comuna} value={c.comuna}>{c.comuna} - ${c.monto_bruto}</option>)}
      </select>
      <div className="flex gap-2">
        <input type="number" name="ruta" placeholder="Ruta" min="1" required
          className="w-1/3" value={form.ruta} onChange={handleChange}
        />
        <input type="date" name="fecha" required
          className="w-2/3" value={form.fecha} onChange={handleChange}
        />
      </div>
      <select name="estado" value={form.estado} onChange={handleChange}>
        <option value="entregado">Entregado</option>
        <option value="parcial">Entrega parcial</option>
        <option value="no_entregado">No entregado</option>
      </select>
      <div className="text-right font-semibold">Monto bruto: ${monto}</div>
      <button type="submit" className="btn-primary w-full">Guardar</button>
    </form>
  );
};

export default OrderForm;