import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [totalBruto, setTotalBruto] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    let query = supabase.from('orders').select('*').eq('user_id', user.id);
    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    const { data, error } = await query.order('fecha');
    if (!error) {
      setOrders(data);
      setTotalBruto(data.reduce((acc, o) => acc + o.monto_bruto, 0));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, user]);

  const retencion = totalBruto * 0.1525;
  const neto = totalBruto - retencion;

  const exportExcel = () => {
    const data = orders.map(o => ({
      'N° Orden': o.order_number,
      Comuna: o.comuna,
      Ruta: o.ruta,
      Fecha: o.fecha,
      Estado: o.estado,
      'Monto Bruto': o.monto_bruto
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
      doc.text(`Total bruto: $${totalBruto}`, 14, 26);
      doc.text(`Retención (15.25%): $${retencion.toFixed(0)}`, 14, 32);
      doc.text(`Neto: $${neto.toFixed(0)}`, 14, 38);

      if (orders.length > 0) {
        const tableData = orders.map(o => [
          o.order_number,
          o.comuna,
          o.ruta,
          o.fecha,
          o.estado,
          `$${o.monto_bruto}`
        ]);
        autoTable(doc, {
          head: [['N°', 'Comuna', 'Ruta', 'Fecha', 'Estado', 'Bruto']],
          body: tableData,
          startY: 44,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [255, 140, 0] },
        });
      } else {
        doc.text('No hay órdenes para el período seleccionado.', 14, 50);
      }

      doc.save(`reporte_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Reporte de entregas</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto flex-1" />
        <span className="text-gray-400">a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto flex-1" />
        <button className="btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Limpiar</button>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between"><span>Total órdenes</span><span>{orders.length}</span></div>
        <div className="flex justify-between"><span>Monto bruto total</span><span>${totalBruto}</span></div>
        <div className="flex justify-between"><span>Retención (15.25%)</span><span>${retencion.toFixed(0)}</span></div>
        <div className="flex justify-between font-bold text-lg text-primary"><span>Neto (después de retención)</span><span>${neto.toFixed(0)}</span></div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={exportExcel}>📊 Excel</button>
        <button className="btn-primary flex-1" onClick={exportPDF}>📄 PDF</button>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Detalle por ruta</h3>
        {[1,2,3].map(r => {
          const filt = orders.filter(o => o.ruta === r);
          const total = filt.reduce((acc, o) => acc + o.monto_bruto, 0);
          return (
            <div key={r} className="flex justify-between border-b border-[#444] py-1">
              <span>Ruta {r}</span>
              <span>{filt.length} órdenes - ${total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Report;