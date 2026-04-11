import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const { ubicacion } = useParams();
  const navigate = useNavigate();
  
  // Separamos los estados para mayor control
  const [equiposAlerta, setEquiposAlerta] = useState([]);
  const [equiposRecientes, setEquiposRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchEquipos() {
      // 1. Traemos TODOS los equipos activos de esta sede
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('ubicacion', ubicacion)
        .eq('activo', true);
      
      if (data) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Reseteamos la hora para comparar fechas justas

        const alertas = [];
        
        // 2. Filtramos los que requieren atención
data.forEach(equipo => {
          if (equipo.proximo_mtto) {
            // Extraemos solo la fecha pura
            const soloFecha = equipo.proximo_mtto.split('T')[0];
            const fechaProximo = new Date(soloFecha + 'T12:00:00');
            
            // Comparamos con el hoy (también al mediodía para ser justos)
            const hoy = new Date();
            hoy.setHours(12, 0, 0, 0); 
            
            if (fechaProximo <= hoy) {
              alertas.push(equipo);
            }
          }
        });

        // 3. Ordenamos el resto por "último mantenimiento" para los recientes
        // Excluimos los que ya están en alerta para no mostrar el mismo equipo dos veces
        const recientes = data
          .filter(eq => !alertas.some(alerta => alerta.id_equipo === eq.id_equipo))
          .sort((a, b) => new Date(b.ultimo_mtto || 0) - new Date(a.ultimo_mtto || 0))
          .slice(0, 3); // Solo mostramos los 3 más recientes

        setEquiposAlerta(alertas);
        setEquiposRecientes(recientes);
      }
      setCargando(false);
    }
    fetchEquipos();
  }, [ubicacion]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

// Función auxiliar para formatear la fecha visualmente (A prueba de Timestamps)
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "No programado";
    // Cortamos cualquier hora que traiga de Supabase y nos quedamos solo con YYYY-MM-DD
    const soloFecha = fechaString.split('T')[0]; 
    // Usamos el mediodía para evitar saltos de zona horaria
    return new Date(soloFecha + 'T12:00:00').toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-10 sm:border-x sm:border-slate-200">
      
      {/* Header Superior Blanco Limpio */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/')} className="bg-slate-50 p-3 rounded-full border border-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={handleLogout} className="bg-slate-50 p-3 rounded-full border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors group">
            <svg className="w-5 h-5 text-slate-700 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        {/* Píldora de Ubicación Actual */}
        <button onClick={() => navigate('/')} className="w-full bg-[#F8F9FA] border border-slate-100 hover:border-slate-300 transition-colors rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-bold text-slate-800">{ubicacion}</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Cambiar</span>
        </button>
      </div>

      {/* Botón del Escáner */}
      <div className="px-6 mt-8 mb-10">
        <button 
          onClick={() => navigate('/escaner')}
          className="w-full bg-[#1A1A1A] text-white rounded-[24px] py-5 px-6 flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="font-bold text-lg tracking-wide">Escanear Código QR</span>
        </button>
      </div>

      <div className="px-6 pb-6">
        {cargando ? (
           <div className="space-y-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-200/50 rounded-[28px]"></div>)}
           </div>
        ) : (
          <>
            {/* SECCIÓN 1: ZONA DE ALERTA (Solo se muestra si hay equipos vencidos) */}
            {equiposAlerta.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <h2 className="text-[19px] font-extrabold tracking-tight">Atención Inmediata</h2>
                </div>
                
                <div className="space-y-3">
                  {equiposAlerta.map((equipo, index) => (
                    <div key={index} onClick={() => navigate(`/equipo/${equipo.id_equipo}`)} className="bg-red-50/50 p-5 rounded-[28px] shadow-sm border border-red-100 flex items-start justify-between cursor-pointer active:scale-[0.98] transition-transform">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-[15px]">{equipo.nombre_equipo}</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{equipo.marca}</p>
                        <span className="inline-block bg-white text-red-600 font-bold text-[10px] px-3 py-1 rounded-full border border-red-100 uppercase tracking-wide shadow-sm">
                          Vencido: {formatearFecha(equipo.proximo_mtto)}
                        </span>
                      </div>
                      <div className="bg-red-100 text-red-500 p-2 rounded-xl mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: ESCANEOS RECIENTES */}
            {equiposRecientes.length > 0 && (
              <div>
                <h2 className="text-[19px] font-extrabold text-slate-900 mb-4 tracking-tight">Últimos Mantenimientos</h2>
                <div className="space-y-3">
                  {equiposRecientes.map((equipo, index) => (
                    <div key={index} onClick={() => navigate(`/equipo/${equipo.id_equipo}`)} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex items-start justify-between hover:border-slate-300 transition-colors cursor-pointer active:scale-[0.98]">
                      <div>
                        <h3 className="font-bold text-slate-900 text-[15px] mb-1">{equipo.nombre_equipo}</h3>
                        <p className="text-sm text-slate-500">{equipo.marca}</p>
                        <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-medium">Próximo: {formatearFecha(equipo.proximo_mtto)}</span>
                        </div>
                      </div>
                      <div className="bg-green-50 text-green-500 p-2 rounded-xl mt-1 border border-green-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mensaje si la sede está totalmente al día y no hay recientes (Raro, pero buena práctica) */}
            {equiposAlerta.length === 0 && equiposRecientes.length === 0 && (
              <div className="text-center bg-white p-8 rounded-[28px] border border-slate-200 border-dashed">
                <p className="text-slate-500 font-medium text-sm">No hay equipos registrados en esta sede aún.</p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}