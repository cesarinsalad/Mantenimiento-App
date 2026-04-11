import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function TabReportes() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const generarReporte = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor selecciona ambas fechas');
      return;
    }
    setCargando(true);
    setBuscado(true);

    const ds = new Date(fechaDesde);
    ds.setHours(0, 0, 0, 0);
    const tsDesde = ds.toISOString();
    
    // Hasta el final del día
    const dh = new Date(fechaHasta);
    dh.setHours(23, 59, 59, 999);
    const tsHasta = dh.toISOString();

    const { data, error } = await supabase
      .from('historial_mantenimiento')
      .select(`
        *,
        equipos (nombre_equipo, ubicacion)
      `)
      .gte('created_at', tsDesde)
      .lte('created_at', tsHasta)
      .order('created_at', { ascending: false });
    
    if (data) setReportes(data);
    else if (error) alert("Error obteniendo reportes: " + error.message);
    
    setCargando(false);
  };

  const formatearFecha = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500 print:shadow-none print:border-none print:p-0">
      
      {/* SECCIÓN VISUAL OCULTA DE LA IMPRESORA (CONTROLES) */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-[#0B1121]">Generador de Reportes</h2>
          <button 
            onClick={() => window.print()}
            disabled={reportes.length === 0}
            className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${reportes.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0B1121] text-white hover:bg-black'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2M7 17v4h10v-4M7 7V3h10v4" /></svg>
            Imprimir PDF
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-5 mb-8 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1">Desde (Fecha inicio)</label>
            <input 
              type="date" 
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-slate-800 font-medium text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1">Hasta (Fecha fin)</label>
            <input 
              type="date" 
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-slate-800 font-medium text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>
          <button 
            onClick={generarReporte}
            className="w-full md:w-auto px-8 py-3 bg-[#0B1121] text-white font-bold rounded-[14px] shadow-sm hover:bg-black transition-colors"
          >
            Generar
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VISTA DEL PDF (TÍTULO DE IMPRESIÓN)                              */}
      {/* ============================================================== */}
      <div className="hidden print:block text-center mb-10">
        <p className="text-xs font-bold text-slate-400 mb-2">mantenimiento-app</p>
        <h1 className="text-3xl font-black text-black">Reporte de Mantenimiento</h1>
        <p className="text-slate-600 mt-1">Periodo: {formatearFecha(fechaDesde)} al {formatearFecha(fechaHasta)}</p>
      </div>

      {/* RESULTADOS / TABLA */}
      {buscado && (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-600 font-bold text-sm print:text-black">
                <th className="py-4 px-2">Fecha</th>
                <th className="py-4 px-2">Equipo</th>
                <th className="py-4 px-2">Tipo</th>
                <th className="py-4 px-2">Técnico</th>
                <th className="py-4 px-2">Descripción</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {cargando ? (
                <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-medium print:hidden">Buscando registros...</td></tr>
              ) : reportes.length > 0 ? (
                reportes.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 print:break-inside-avoid">
                    <td className="py-4 px-2 font-bold text-slate-800 print:text-black">
                      {formatearFecha(item.created_at)}
                    </td>
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-900 print:text-black">{item.equipos?.nombre_equipo || 'Equipo Desconocido'}</p>
                      <p className="text-xs text-slate-400 print:text-slate-600">{item.equipos?.ubicacion || '---'}</p>
                    </td>
                    <td className="py-4 px-2">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full print:border-slate-800 print:bg-transparent print:text-black">
                        {item.tipo_mtto}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 print:text-black">{item.tecnico_nombre}</p>
                    </td>
                    <td className="py-4 px-2 text-slate-600 print:text-slate-800">
                      {item.descripcion}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-medium print:hidden">No hay mantenimientos registrados en estas fechas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
