import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [extras, setExtras] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    if (!user) return;

    // Órdenes
    let queryOrders = supabase.from('orders').select('*').eq('user_id', user.id);
    if (startDate) queryOrders = queryOrders.gte('fecha', startDate);
    if (endDate) queryOrders = queryOrders.lte('fecha', endDate);
    const { data: ordersData } = await queryOrders.order('fecha');
    setOrders(ordersData || []);

    // Extras
    let queryExtras = supabase.from('extras').select('*').eq('user_id', user.id);
    if (startDate) queryExtras = queryExtras.gte('fecha', startDate);
    if (endDate) queryExtras = queryExtras.lte('fecha', endDate);
    const { data: extrasData } = await queryExtras.order('fecha');
    setExtras(extrasData || []);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, user]);

  const totalBrutoOrdenes = orders.reduce((acc, o) => acc + o.monto_bruto, 0);
  const totalExtras = extras.reduce((acc, e) => acc + e.monto, 0);
  const totalBruto = totalBrutoOrdenes + totalExtras;
  const retencion = totalBruto * 0.1525;
  const neto = totalBruto - retencion;

  const exportExcel = () => {
    const data = [
      ...orders.map(o => ({
        'N° Orden': o.order_number,
        Comuna: o.comuna,
        Ruta: o.ruta || 'Sin ruta',
        Fecha: o.fecha,
        Estado: o.estado,
        'Monto': o.monto_bruto,
        Tipo: 'Orden'
      })),
      ...extras.map(e => ({
        'N° Orden': '',
        Comuna: '',
        Ruta: '',
        Fecha: e.fecha,
        Estado: '',
        'Monto': e.monto,
        Tipo: e.tipo
      }))
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Reporte de entregas y extras', 14, 16);
      doc.text(`Total bruto (órdenes + extras): $${totalBruto}`, 14, 26);
      doc.text(`Retención (15.25%): $${retencion.toFixed(0)}`, 14, 32);
      doc.text(`Neto: $${neto.toFixed(0)}`, 14, 38);

      if (orders.length > 0 || extras.length > 0) {
        const tableData = [
          ...orders.map(o => [o.order_number, o.comuna, o.ruta || 'Sin ruta', o.fecha, o.estado, `$${o.monto_bruto}`, 'Orden']),
          ...extras.map(e => ['', '', '', e.fecha, '', `$${e.monto}`, e.tipo])
        ];
        autoTable(doc, {
          head: [['N°', 'Comuna', 'Ruta', 'Fecha', 'Estado', 'Monto', 'Tipo']],
          body: tableData,
          startY: 44,
          theme: 'striped',
          styles: { fontSize: 8 },
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
      <h2 className="text-2xl font-bold text-primary mb-4">Reportes</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto flex-1" />
        <span className="text-gray-400"></span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto flex-1" />
        <button className="btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Limpiar</button>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between"><span>Total órdenes</span><span>{orders.length}</span></div>
        <div className="flex justify-between"><span>Total extras</span><span>{extras.length}</span></div>
        <div className="flex justify-between"><span>Monto bruto órdenes</span><span>${totalBrutoOrdenes}</span></div>
        <div className="flex justify-between"><span>Monto extras</span><span>${totalExtras}</span></div>
        <div className="flex justify-between font-bold"><span>Total bruto</span><span>${totalBruto}</span></div>
        <div className="flex justify-between"><span>Retención (15.25%)</span><span>${retencion.toFixed(0)}</span></div>
        <div className="flex justify-between font-bold text-lg text-primary"><span>Neto (después de retención)</span><span>${neto.toFixed(0)}</span></div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={exportExcel}>📊 Excel</button>
        <button className="btn-primary flex-1" onClick={exportPDF}>📄 PDF</button>
      </div>
    </div>
  );
};

export default Report;