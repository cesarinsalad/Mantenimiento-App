import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para la Interfaz (Modales)
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  
  // Estados del Formulario
  const [tipoMtto, setTipoMtto] = useState('Preventivo');
  const [descripcion, setDescripcion] = useState('');

  const [historial, setHistorial] = useState([]);

  const [fechaProximo, setFechaProximo] = useState('');

  const [nombreUsuario, setNombreUsuario] = useState('Cargando...');

  const [recargarFicha, setRecargarFicha] = useState(0);

  const [cargoUsuario, setCargoUsuario] = useState(''); // Nuevo estado para el cargo
  const [limiteHistorial, setLimiteHistorial] = useState(2); // Inicia mostrando solo 2

  useEffect(() => {
    async function fetchHistorial() {
      const { data } = await supabase
        .from('historial_mantenimiento')
        .select('*')
        .eq('id_equipo', id)
        .order('created_at', { ascending: false });
    
      if (data) setHistorial(data);
    }
    if (id) fetchHistorial();
  }, [id, recargarFicha]);

  // Obtenemos la fecha de hoy por defecto (Formato YYYY-MM-DD para el input date)
  const fechaHoy = new Date().toISOString().split('T')[0]; 

  useEffect(() => {
    async function fetchEquipo() {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('id_equipo', id)
        .single();
      
      if (data) setEquipo(data);
      setCargando(false);
    }
    fetchEquipo();
  }, [id, recargarFicha]);

useEffect(() => {
    async function fetchPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Pedimos también el 'cargo' a la tabla perfiles
        const { data } = await supabase
          .from('perfiles')
          .select('nombre, cargo') 
          .eq('id', user.id)
          .single();
        
        if (data) {
          setNombreUsuario(data.nombre);
          setCargoUsuario(data.cargo || 'Técnico'); // Guardamos el cargo o un fallback
        }
      }
    }
    fetchPerfil();
  }, [id]);



  // Función para simular el guardado y mostrar el feedback
  const handleGuardarIntervencion = async () => {
    if (!fechaProximo) {
      alert("Por favor, selecciona la fecha del próximo mantenimiento.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 1. GUARDAR EN EL HISTORIAL
    const { error: errorHistorial } = await supabase
      .from('historial_mantenimiento')
      .insert([{ 
        id_equipo: id, 
        tipo_mtto: tipoMtto, 
        descripcion: descripcion,
        tecnico_id: user.id,
        tecnico_nombre: nombreUsuario,
        fecha_proximo_mtto: fechaProximo
      }]);

    if (errorHistorial) {
      alert("Fallo al guardar en el historial: " + errorHistorial.message);
      return; // Detenemos la ejecución si falla aquí
    }

// 2. ACTUALIZAR LA TABLA PRINCIPAL DEL EQUIPO
    const momentoExacto = new Date().toISOString(); 

    const { data: dataEquipo, error: errorEquipo } = await supabase
      .from('equipos')
      .update({
        ultimo_mtto: momentoExacto, 
        proximo_mtto: fechaProximo,
        observaciones: descripcion
      })
      .eq('id_equipo', id)
      .select(); // <--- ESTA ES LA CLAVE PARA VER QUÉ PASÓ

    // Verificamos si hubo un error de código
    if (errorEquipo) {
      alert("Error técnico en Supabase: " + errorEquipo.message);
      return; 
    }

    // Verificamos si hubo el "Fallo Silencioso" (Se ejecutó, pero afectó 0 filas)
    if (dataEquipo && dataEquipo.length === 0) {
      alert("¡Atrapado! Supabase bloqueó la actualización en silencio. Es un problema de RLS o de nombres de columnas.");
      console.log("Datos que intenté enviar:", { ultimo_mtto: momentoExacto, proximo_mtto: fechaProximo, observaciones: descripcion });
      return;
    }

    // ÉXITO TOTAL: Si llega aquí, ambas tablas se actualizaron
    setMostrarModal(false);
    setMostrarExito(true);
    
    setRecargarFicha(prev => prev + 1); 

    setDescripcion('');
    setFechaProximo('');

    setTimeout(() => {
      setMostrarExito(false);
    }, 2000);
  };

  // 1. Formateador para separar el "14 abr" del "2026"
  const formatearFechaFicha = (fechaString) => {
    if (!fechaString) return { diaMes: '-- ---', anio: '----' };
    const soloFecha = fechaString.split('T')[0];
    const fecha = new Date(soloFecha + 'T12:00:00');
    return {
      diaMes: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      anio: fecha.getFullYear().toString()
    };
  };

  // 2. Calculadora de Días Restantes (Con cambio de colores)
  const calcularEstadoMantenimiento = (fechaProximo) => {
    if (!fechaProximo) return { texto: 'No definido', color: 'text-slate-400', bg: 'bg-slate-50', borde: 'border-slate-100' };
    
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    const proximo = new Date(fechaProximo.split('T')[0] + 'T12:00:00');
    
    const diferenciaMs = proximo - hoy;
    const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      return { texto: `Vencido (${Math.abs(dias)}d)`, color: 'text-red-600', bg: 'bg-red-50/50', borde: 'border-red-100' };
    } else if (dias === 0) {
      return { texto: '¡Es hoy!', color: 'text-orange-600', bg: 'bg-orange-50', borde: 'border-orange-100' };
    } else {
      return { texto: `${dias} días`, color: 'text-[#0A7B4A]', bg: 'bg-[#E8F8F0]/60', borde: 'border-[#E8F8F0]' };
    }
  };

  // Variables calculadas listas para usar en el HTML
  const fechaUltimo = formatearFechaFicha(equipo?.ultimo_mtto);
  const fechaProximoCalculado = formatearFechaFicha(equipo?.proximo_mtto);
  const estadoProximo = calcularEstadoMantenimiento(equipo?.proximo_mtto);

  if (cargando) return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center"><p className="text-slate-400 font-bold animate-pulse">Cargando ficha técnica...</p></div>;
  if (!equipo) return <div className="min-h-screen flex items-center justify-center"><h2 className="text-xl font-bold text-slate-800">Equipo no encontrado</h2></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-32 sm:max-w-md sm:mx-auto sm:border-x sm:border-slate-200 relative overflow-hidden">
      
      {/* --- EL CÓDIGO DE LA FICHA QUE YA TENÍAMOS (Resumido para enfocar en lo nuevo) --- */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md z-10">
        <button onClick={() => navigate(equipo?.ubicacion ? `/dashboard/${equipo.ubicacion}` : '/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition">
          <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="font-extrabold text-lg">Detalles del Equipo</h1>
        {/* Elemento fantasma para balancear el título con justify-between tras eliminar el botón de edición */}
        <div className="w-10 h-10"></div>
      </div>



      <div className="px-6 space-y-4 mt-2">
        
        {/* Tarjeta Principal: Nombre y Estado */}
        <div className="bg-white p-6 rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{equipo.nombre_equipo}</h2>
          <p className="text-slate-500 text-sm mt-1">{equipo.marca}</p>
        </div>

{/* Grid de Especificaciones (Bento) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Fila 1: Marca y Modelo (1 columna cada uno) */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Marca</p>
            <p className="font-bold text-slate-800 text-sm break-words">{equipo.marca}</p>
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Modelo</p>
            <p className="font-bold text-slate-800 text-sm break-words">{equipo.modelo}</p>
          </div>
          
          {/* Fila 2: Número de Serie (Ocupa 2 columnas) */}
          <div className="col-span-2 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Número de Serie</p>
            <p className="font-bold text-slate-800 text-sm break-words">{equipo.serie || 'N/A'}</p>
          </div>
          
          {/* Fila 3: Área y Ubicación (1 columna cada uno) */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Área</p>
            <p className="font-bold text-slate-800 text-sm">{equipo.area}</p>
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Ubicación</p>
            <p className="font-bold text-slate-800 text-sm">{equipo.ubicacion}</p>
          </div>

        </div>

        {/* Fechas de Mantenimiento (100% Dinámico) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Tarjeta: Último Mantenimiento */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-[10px] font-bold uppercase leading-none">Último Mantenimiento</p>
            </div>
            <p className="font-black text-slate-800 text-lg capitalize">{fechaUltimo.diaMes}</p>
            <p className="text-xs text-slate-400 font-medium">{fechaUltimo.anio}</p>
          </div>

          {/* Tarjeta: Próximo Mantenimiento (Cambia de color según estado) */}
          <div className={`${estadoProximo.bg} p-5 rounded-[28px] border ${estadoProximo.borde} shadow-sm transition-colors`}>
            <div className={`flex items-center gap-1.5 mb-2 ${estadoProximo.color}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-[10px] font-bold uppercase leading-none">Próximo Mantenimiento</p>
            </div>
            <p className="font-black text-slate-800 text-lg capitalize">{fechaProximo.diaMes}</p>
            <p className={`text-xs font-bold ${estadoProximo.color}`}>{estadoProximo.texto}</p>
          </div>

        </div>

      {/* Historial de Intervenciones */}
        <div className="pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="font-extrabold text-lg text-slate-900">Historial de Intervenciones</h3>
          </div>

          <div className="space-y-3">
            {historial.length > 0 ? (
              <>
                {/* Cortamos el array para mostrar solo hasta donde diga el límite */}
                {historial.slice(0, limiteHistorial).map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                        {item.tipo_mtto}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{item.descripcion}</p>
                    <div className="flex items-center gap-2 text-slate-800">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span className="text-sm font-bold">
                        {item.tecnico_nombre} 
                        {/* Imprime el cargo de forma sutil solo si existe en ese registro */}
                        {item.tecnico_cargo && <span className="font-medium text-slate-400"> - {item.tecnico_cargo}</span>}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Botón dinámico: Solo aparece si hay más elementos ocultos en el historial */}
                {limiteHistorial < historial.length && (
                  <button 
                    onClick={() => setLimiteHistorial(prev => prev + 2)}
                    className="w-full py-3 mt-2 bg-slate-50 text-slate-600 font-bold text-sm rounded-[20px] border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-[0.98]"
                  >
                    Ver más intervenciones
                  </button>
                )}
              </>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] p-8 text-center">
                <p className="text-slate-400 text-sm font-medium">No se han registrado intervenciones para este equipo todavía.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón Flotante (Ahora abre el modal) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-10">
        <button 
          onClick={() => setMostrarModal(true)}
          className="w-full bg-[#1A1A1A] text-white font-bold text-lg py-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Registrar Intervención
        </button>
      </div>

      {/* ============================================================== */}
      {/* PANTALLA 5: MODAL DE REGISTRO (Bottom Sheet)                     */}
      {/* ============================================================== */}
{mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
          
          {/* El contenedor ahora tiene márgenes automáticos gracias al p-4 del padre y está redondeado completo */}
          <div className="bg-white w-full max-w-[24rem] max-h-[85vh] rounded-[32px] flex flex-col shadow-2xl animate-[zoomIn_0.2s_ease-out]">
            
            {/* Header del Modal (Un poco más compacto) */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registrar Intervención</h2>
                <p className="text-xs text-slate-500">{equipo.nombre_equipo}</p>
              </div>
              <button onClick={() => setMostrarModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Cuerpo del Formulario scrollable (Espacios y padding reducidos) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Tipo de Mantenimiento */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Tipo de Mantenimiento
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Correctivo', 'Preventivo', 'Predictivo', 'Rutina'].map((tipo) => (
                    <button 
                      key={tipo}
                      onClick={() => setTipoMtto(tipo)}
                      className={`py-2.5 px-3 rounded-[14px] font-bold text-xs transition-all border ${
                        tipoMtto === tipo 
                          ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                          : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha de Intervención */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Fecha de Intervención
                </label>
                <input 
                  type="date" 
                  defaultValue={fechaHoy}
                  className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* NUEVO: Fecha Próximo Mantenimiento (Ajustado al estilo neutral) */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Próximo Mantenimiento (Proyectado)
                </label>
                <input 
                  type="date" 
                  value={fechaProximo}
                  onChange={(e) => setFechaProximo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Técnico Responsable */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Técnico Responsable
                </label>
                <input 
                  type="text" 
                  value={nombreUsuario} 
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3 text-slate-500 font-medium text-sm cursor-not-allowed"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Descripción de la Intervención
                </label>
                <textarea 
                  rows="3"
                  placeholder="Describe el trabajo realizado..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[16px] px-4 py-3 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

            </div>

            {/* Footer con el botón de guardar (Padding reducido) */}
            <div className="p-5 pt-2 border-t border-slate-100">
               <button 
                  onClick={handleGuardarIntervencion}
                  className="w-full bg-[#1A1A1A] text-white font-bold text-base py-3.5 rounded-full shadow-lg hover:bg-black active:scale-[0.98] transition-all"
                >
                  Guardar Intervención
                </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PANTALLA 6: FEEDBACK DE ÉXITO                                    */}
      {/* ============================================================== */}
      {mostrarExito && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md sm:max-w-md sm:mx-auto">
          <div className="bg-white rounded-[32px] p-8 w-[85%] max-w-sm flex flex-col items-center text-center shadow-2xl animate-[zoomIn_0.3s_ease-out]">
            <div className="w-20 h-20 bg-[#0DD068] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(13,208,104,0.4)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Intervención Registrada!</h2>
            <p className="text-sm text-slate-500 font-medium">La intervención ha sido guardada exitosamente</p>
          </div>
        </div>
      )}

    </div>
  );
}