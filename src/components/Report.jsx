import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const { user } = useAuth();
  const [ordersWithExtras, setOrdersWithExtras] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBruto, setTotalBruto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          extras (tipo, monto, nota, id)
        `)
        .eq('user_id', user.id);

      if (startDate) {
        query = query.gte('fecha', startDate);
      }
      if (endDate) {
        query = query.lte('fecha', endDate);
      }

      const { data: orders, error: queryError } = await query.order('fecha', { ascending: false });

      if (queryError) {
        console.error('Error en consulta:', queryError);
        setError('Error al cargar los datos: ' + queryError.message);
        setLoading(false);
        return;
      }

      if (!orders || orders.length === 0) {
        setOrdersWithExtras([]);
        setTotalBruto(0);
        setLoading(false);
        return;
      }

      let total = 0;
      const enriched = orders.map((order) => {
        const extras = order.extras || [];
        const extraPeso = extras.find(e => e.tipo === 'extra_peso')?.monto || 0;
        const tag = extras.find(e => e.tipo === 'tag')?.monto || 0;
        const capacitacion = extras.find(e => e.tipo === 'capacitacion')?.monto || 0;
        const totalExtras = extraPeso + tag + capacitacion;
        const totalOrden = (order.monto_bruto || 0) + totalExtras;
        total += totalOrden;
        return {
          ...order,
          extras,
          extraPeso,
          tag,
          capacitacion,
          totalExtras,
          totalOrden
        };
      });

      setOrdersWithExtras(enriched);
      setTotalBruto(total);
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, user]);

  const retencion = totalBruto * 0.1525;
  const neto = totalBruto - retencion;

  const exportExcel = () => {
    const data = ordersWithExtras.map((o) => ({
      'N° Orden': o.order_number || '',
      Comuna: o.comuna || '',
      Fecha: o.fecha || '',
      Estado: o.estado || '',
      'Monto Bruto': o.monto_bruto || 0,
      'Extra Peso': o.extraPeso || 0,
      'Tag': o.tag || 0,
      'Capacitación': o.capacitacion || 0,
      'Notas': o.notas || '',
      'Total': o.totalOrden || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Reporte de entregas', 14, 16);
      doc.text(`Total bruto (órdenes + extras): $${totalBruto}`, 14, 26);
      doc.text(`Retención (15.25%): $${retencion.toFixed(0)}`, 14, 32);
      doc.text(`Neto: $${neto.toFixed(0)}`, 14, 38);

      if (ordersWithExtras.length > 0) {
        const tableData = ordersWithExtras.map((o) => [
          o.order_number || '',
          o.comuna || '',
          o.fecha || '',
          o.estado || '',
          `$${o.monto_bruto || 0}`,
          `$${o.extraPeso || 0}`,
          `$${o.tag || 0}`,
          `$${o.capacitacion || 0}`,
          o.notas || '',
          `$${o.totalOrden || 0}`,
        ]);
        autoTable(doc, {
          head: [['N°', 'Comuna', 'Fecha', 'Estado', 'Bruto', 'Extra Peso', 'Tag', 'Capacitación', 'Notas', 'Total']],
          body: tableData,
          startY: 44,
          theme: 'striped',
          styles: { fontSize: 7 },
          headStyles: { fillColor: [255, 140, 0] },
        });
      } else {
        doc.text('No hay datos para el período seleccionado.', 14, 50);
      }

      doc.save(`reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar PDF: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando reporte...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Reporte financiero</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-auto flex-1"
        />
        <span className="text-gray-400">a</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-auto flex-1"
        />
        <button
          className="btn-secondary"
          onClick={() => {
            setStartDate('');
            setEndDate('');
          }}
        >
          Limpiar
        </button>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between">
          <span>Total órdenes</span>
          <span>{ordersWithExtras.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Total bruto (órdenes + extras)</span>
          <span>${totalBruto}</span>
        </div>
        <div className="flex justify-between">
          <span>Retención (15.25%)</span>
          <span>${retencion.toFixed(0)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-primary">
          <span>Neto</span>
          <span>${neto.toFixed(0)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={exportExcel}>
          📊 Excel
        </button>
        <button className="btn-primary flex-1" onClick={exportPDF}>
          📄 PDF
        </button>
      </div>

      {/* --- TABLA COMPACTA CON SCROLL --- */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Detalle por orden</h3>
        {ordersWithExtras.length === 0 ? (
          <p className="text-center text-gray-400">No hay órdenes para el período seleccionado.</p>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-[#3a3a3a] z-10">
                    <tr>
                      <th className="p-2 border-b border-[#555]">N°</th>
                      <th className="p-2 border-b border-[#555]">Comuna</th>
                      <th className="p-2 border-b border-[#555]">Fecha</th>
                      <th className="p-2 border-b border-[#555]">Estado</th>
                      <th className="p-2 border-b border-[#555] text-right">Bruto</th>
                      <th className="p-2 border-b border-[#555] text-right">Extra Peso</th>
                      <th className="p-2 border-b border-[#555] text-right">Tag</th>
                      <th className="p-2 border-b border-[#555] text-right">Capacitación</th>
                      <th className="p-2 border-b border-[#555]">Notas</th>
                      <th className="p-2 border-b border-[#555] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersWithExtras.map((o) => (
                      <tr key={o.id} className="border-b border-[#444] hover:bg-[#3a3a3a] transition-colors">
                        <td className="p-2 font-mono">{o.order_number}</td>
                        <td className="p-2">{o.comuna}</td>
                        <td className="p-2">{o.fecha}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            o.estado === 'entregado' ? 'bg-green-700' :
                            o.estado === 'parcial' ? 'bg-yellow-700' :
                            'bg-red-700'
                          }`}>
                            {o.estado}
                          </span>
                        </td>
                        <td className="p-2 text-right">${o.monto_bruto}</td>
                        <td className="p-2 text-right text-primary">${o.extraPeso}</td>
                        <td className="p-2 text-right text-primary">${o.tag}</td>
                        <td className="p-2 text-right text-primary">${o.capacitacion}</td>
                        <td className="p-2 text-xs text-gray-400 max-w-[120px] truncate" title={o.notas || ''}>
                          {o.notas || '—'}
                        </td>
                        <td className="p-2 text-right font-bold">${o.totalOrden}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;