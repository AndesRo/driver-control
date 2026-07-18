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

  const fetchData = async () => {
    if (!user) return;

    const query = supabase
      .from('orders')
      .select(`
        *,
        extras:tipo, monto, nota, id
      `)
      .eq('user_id', user.id);

    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    const { data: orders, error } = await query.order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener órdenes:', error);
      return;
    }

    let total = 0;
    const enriched = orders.map(order => {
      const extras = order.extras || [];
      const totalExtras = extras.reduce((sum, e) => sum + e.monto, 0);
      const totalOrden = order.monto_bruto + totalExtras;
      total += totalOrden;
      return {
        ...order,
        extras,
        totalOrden
      };
    });

    setOrdersWithExtras(enriched);
    setTotalBruto(total);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, user]);

  const retencion = totalBruto * 0.1525;
  const neto = totalBruto - retencion;

  const exportExcel = () => {
    const data = ordersWithExtras.map(o => ({
      'N° Orden': o.order_number,
      Comuna: o.comuna,
      Ruta: o.ruta || 'Sin ruta',
      Fecha: o.fecha,
      Estado: o.estado,
      'Monto Bruto': o.monto_bruto,
      'Extra Peso': o.extras.find(e => e.tipo === 'extra_peso')?.monto || 0,
      'Tag': o.extras.find(e => e.tipo === 'tag')?.monto || 0,
      'Capacitación': o.extras.find(e => e.tipo === 'capacitacion')?.monto || 0,
      'Total': o.totalOrden
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Reporte de entregas', 14, 16);
      doc.text(`Total bruto (ordenes + extras): $${totalBruto}`, 14, 26);
      doc.text(`Retención (15.25%): $${retencion.toFixed(0)}`, 14, 32);
      doc.text(`Neto: $${neto.toFixed(0)}`, 14, 38);

      if (ordersWithExtras.length > 0) {
        const tableData = ordersWithExtras.map(o => [
          o.order_number,
          o.comuna,
          o.ruta || 'Sin ruta',
          o.fecha,
          o.estado,
          `$${o.monto_bruto}`,
          `$${o.extras.find(e => e.tipo === 'extra_peso')?.monto || 0}`,
          `$${o.extras.find(e => e.tipo === 'tag')?.monto || 0}`,
          `$${o.extras.find(e => e.tipo === 'capacitacion')?.monto || 0}`,
          `$${o.totalOrden}`
        ]);
        autoTable(doc, {
          head: [['N°', 'Comuna', 'Ruta', 'Fecha', 'Estado', 'Bruto', 'Extra Peso', 'Tag', 'Capacitación', 'Total']],
          body: tableData,
          startY: 44,
          theme: 'striped',
          styles: { fontSize: 7 },
          headStyles: { fillColor: [255, 140, 0] },
        });
      } else {
        doc.text('No hay datos para el período seleccionado.', 14, 50);
      }

      doc.save(`reporte_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Reporte financiero</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto flex-1" />
        <span className="text-gray-400">a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto flex-1" />
        <button className="btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Limpiar</button>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between"><span>Total órdenes</span><span>{ordersWithExtras.length}</span></div>
        <div className="flex justify-between"><span>Total bruto (órdenes + extras)</span><span>${totalBruto}</span></div>
        <div className="flex justify-between"><span>Retención (15.25%)</span><span>${retencion.toFixed(0)}</span></div>
        <div className="flex justify-between font-bold text-lg text-primary"><span>Neto</span><span>${neto.toFixed(0)}</span></div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={exportExcel}>📊 Excel</button>
        <button className="btn-primary flex-1" onClick={exportPDF}>📄 PDF</button>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Detalle por orden</h3>
        {ordersWithExtras.map(o => (
          <div key={o.id} className="border-b border-[#444] py-2">
            <div className="flex justify-between">
              <span className="font-mono">{o.order_number}</span>
              <span>${o.totalOrden}</span>
            </div>
            <div className="text-sm text-gray-400">
              {o.comuna} - Ruta {o.ruta || 'Sin ruta'} - {o.fecha}
              {o.extras.length > 0 && (
                <span className="ml-2 text-primary">
                  (+ {o.extras.map(e => `${e.tipo}: $${e.monto}`).join(', ')})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Report;