import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const OrderList = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Cargar comunas para el select de edición
  useEffect(() => {
    const fetchComunas = async () => {
      const { data, error } = await supabase.from('tarifas').select('comuna');
      if (!error) setComunas(data.map(c => c.comuna));
    };
    fetchComunas();
  }, []);

  const fetchOrders = async (date) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('fecha', date)
      .order('ruta');
    if (!error) setOrders(data);
  };

  useEffect(() => {
    fetchOrders(filterDate);
  }, [filterDate, user]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    await supabase.from('orders').delete().eq('id', id);
    fetchOrders(filterDate);
  };

  const startEdit = (order) => {
    setEditingId(order.id);
    setEditForm(order);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    const { id, ...updates } = editForm;
    await supabase.from('orders').update(updates).eq('id', id);
    setEditingId(null);
    fetchOrders(filterDate);
  };

  const totalBruto = orders.reduce((acc, o) => acc + o.monto_bruto, 0);
  const entregados = orders.filter(o => o.estado === 'entregado').length;
  const parciales = orders.filter(o => o.estado === 'parcial').length;
  const noEntregados = orders.filter(o => o.estado === 'no_entregado').length;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm">Fecha:</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto flex-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-900/30 p-2 rounded text-center border border-green-700">✅ {entregados}</div>
        <div className="bg-yellow-900/30 p-2 rounded text-center border border-yellow-700">⚠️ {parciales}</div>
        <div className="bg-red-900/30 p-2 rounded text-center border border-red-700">❌ {noEntregados}</div>
      </div>
      <p className="text-right font-semibold mb-4">Total bruto: ${totalBruto}</p>

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="card">
            {editingId === order.id ? (
              <div className="space-y-2">
                <input
                  name="order_number"
                  value={editForm.order_number}
                  onChange={handleEditChange}
                  placeholder="N° orden"
                />
                <select name="comuna" value={editForm.comuna} onChange={handleEditChange}>
                  <option value="">Seleccionar comuna</option>
                  {comunas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  name="ruta"
                  type="number"
                  value={editForm.ruta}
                  onChange={handleEditChange}
                  placeholder="Ruta"
                />
                <input
                  name="fecha"
                  type="date"
                  value={editForm.fecha}
                  onChange={handleEditChange}
                />
                <select name="estado" value={editForm.estado} onChange={handleEditChange}>
                  <option value="entregado">Entregado</option>
                  <option value="parcial">Parcial</option>
                  <option value="no_entregado">No entregado</option>
                </select>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={saveEdit}>Guardar</button>
                  <button className="btn-secondary flex-1" onClick={cancelEdit}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-lg">{order.order_number}</span>
                  <span className="ml-2 text-sm text-gray-400">{order.comuna}</span>
                  <div className="text-sm text-gray-400">Ruta {order.ruta} - {order.fecha}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${order.monto_bruto}</div>
                  <span className={`text-xs px-2 py-1 rounded ${order.estado === 'entregado' ? 'bg-green-700' : order.estado === 'parcial' ? 'bg-yellow-700' : 'bg-red-700'}`}>
                    {order.estado}
                  </span>
                  <div className="mt-2 flex gap-1">
                    <button className="text-blue-400 text-xs" onClick={() => startEdit(order)}>✏️</button>
                    <button className="text-red-400 text-xs" onClick={() => handleDelete(order.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-500">No hay órdenes para esta fecha</p>}
      </div>
    </div>
  );
};

export default OrderList;