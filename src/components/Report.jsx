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
  const [totalBruto, setTotalBruto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener órdenes
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) ordersQuery = ordersQuery.gte('fecha', startDate);
      if (endDate) ordersQuery = ordersQuery.lte('fecha', endDate);

      const { data: ordersData, error: ordersError } = await ordersQuery.order('fecha', { ascending: false });

      if (ordersError) {
        setError('Error al cargar órdenes: ' + ordersError.message);
        setLoading(false);
        return;
      }

      setOrders(ordersData || []);

      // 2. Obtener extras (sin relación, solo por usuario y fecha)
      let extrasQuery = supabase
        .from('extras')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) extrasQuery = extrasQuery.gte('fecha', startDate);
      if (endDate) extrasQuery = extrasQuery.lte('fecha', endDate);

      const { data: extrasData, error: extrasError } = await extrasQuery.order('fecha', { ascending: false });

      if (extrasError) {
        setError('Error al cargar extras: ' + extrasError.message);
        setLoading(false);
        return;
      }

      setExtras(extrasData || []);

      // 3. Calcular total: suma de montos de órdenes + suma de montos de extras
      const totalOrders = ordersData.reduce((sum, o) => sum + (o.monto_bruto || 0), 0);
      const totalExtras = extrasData.reduce((sum, e) => sum + (e.monto || 0), 0);
      setTotalBruto(totalOrders + totalExtras);

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

  // Agrupar extras por tipo para el resumen
  const extrasSummary = extras.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.monto;
    return acc;
  }, {});

  const exportExcel = () => {
    // Datos de órdenes con sus extras relacionados (buscamos por order_id)
    const ordersWithExtras = orders.map(o => {
      const orderExtras = extras.filter(e => e.order_id === o.id);
      const totalExtras = orderExtras.reduce((sum, e) => sum + e.monto, 0);
      return {
        'N° Orden': o.order_number || '',
        Comuna: o.comuna || '',
        Ruta: o.ruta || 'Sin ruta',
        Fecha: o.fecha || '',
        Estado: o.estado || '',
        'Monto Bruto': o.monto_bruto || 0,
        'Total Extras': totalExtras,
        'Total Orden': (o.monto_bruto || 0) + totalExtras,
      };
    });

    // Datos de extras individuales para detalle
    const extrasDetail = extras.map(e => ({
      'Tipo': e.tipo,
      'Monto': e.monto,
      'Fecha': e.fecha,
      'Nota': e.nota || '',
      'Orden Asociada': e.order_id || 'Sin orden',
    }));

    // Crear libro de Excel con dos hojas
    const wb = XLSX.utils.book_new();
    const wsOrders = XLSX.utils.json_to_sheet(ordersWithExtras);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Órdenes');
    const wsExtras = XLSX.utils.json_to_sheet(extrasDetail);
    XLSX.utils.book_append_sheet(wb, wsExtras, 'Extras Detalle');

    XLSX.writeFile(wb, `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Reporte financiero', 14, 16);
      doc.text(`Total bruto (órdenes + extras): $${totalBruto}`, 14, 26);
      doc.text(`Retención (15.25%): $${retencion.toFixed(0)}`, 14, 32);
      doc.text(`Neto: $${neto.toFixed(0)}`, 14, 38);

      // Tabla de resumen de órdenes
      if (orders.length > 0) {
        doc.text('Resumen de órdenes', 14, 48);
        const orderRows = orders.map(o => {
          const orderExtras = extras.filter(e => e.order_id === o.id);
          const totalExtras = orderExtras.reduce((sum, e) => sum + e.monto, 0);
          return [
            o.order_number || '',
            o.comuna || '',
            o.ruta || 'Sin ruta',
            o.fecha || '',
            o.estado || '',
            `$${o.monto_bruto || 0}`,
            `$${totalExtras}`,
            `$${(o.monto_bruto || 0) + totalExtras}`,
          ];
        });
        autoTable(doc, {
          head: [['N°', 'Comuna', 'Ruta', 'Fecha', 'Estado', 'Bruto', 'Extras', 'Total']],
          body: orderRows,
          startY: 52,
          theme: 'striped',
          styles: { fontSize: 7 },
          headStyles: { fillColor: [255, 140, 0] },
        });
      }

      // Tabla de resumen de extras por tipo
      if (Object.keys(extrasSummary).length > 0) {
        const summaryRows = Object.entries(extrasSummary).map(([tipo, total]) => [tipo, `$${total}`]);
        autoTable(doc, {
          head: [['Tipo de Extra', 'Total']],
          body: summaryRows,
          startY: doc.lastAutoTable?.finalY + 10 || 80,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [255, 140, 0] },
        });
      }

      // Detalle de extras individuales
      if (extras.length > 0) {
        const extraRows = extras.map(e => [e.tipo, `$${e.monto}`, e.fecha, e.nota || '']);
        autoTable(doc, {
          head: [['Tipo', 'Monto', 'Fecha', 'Nota']],
          body: extraRows,
          startY: (doc.lastAutoTable?.finalY || 80) + 10,
          theme: 'striped',
          styles: { fontSize: 7 },
          headStyles: { fillColor: [255, 140, 0] },
        });
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
      <h2 className="text-2xl font-bold text-primary mb-4">Reportes</h2>

      {/* Antes: <div className="flex flex-wrap gap-2 mb-4"> con w-auto flex-1 en los inputs.
          Ahora usa .filter-container (definida en index.css), que ya trae flex-wrap,
          gap y el fix responsive para pantallas <=380px (fechas pasan a 100% de ancho
          en vez de aplastarse una junto a la otra). */}
      <div className="filter-container mb-4">
        <div className="flex flex-col flex-1 min-w-[130px]">
          <label className="text-xs text-muted mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col flex-1 min-w-[130px]">
          <label className="text-xs text-muted mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
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
          <span>{orders.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Total extras</span>
          <span>{extras.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Monto bruto órdenes</span>
          <span>${orders.reduce((sum, o) => sum + (o.monto_bruto || 0), 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Monto extras</span>
          <span>${extras.reduce((sum, e) => sum + (e.monto || 0), 0)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total bruto</span>
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

      <div className="flex flex-wrap gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={exportExcel}>
          📊 Excel
        </button>
        <button className="btn-primary flex-1" onClick={exportPDF}>
          📄 PDF
        </button>
      </div>

    </div>
  );
};

export default Report;