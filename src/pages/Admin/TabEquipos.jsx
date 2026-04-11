import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function TabEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevaUbicacionMode, setNuevaUbicacionMode] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre_equipo: '', marca: '', modelo: '', serie: '', ubicacion: '', area: ''
  });

  // Extracción de locales vivos para el dropdown
  const ubicacionesExistentes = [...new Set(equipos.map(e => e.ubicacion).filter(Boolean))].sort();

  const fetchEquipos = async () => {
    setCargando(true);
    const { data } = await supabase.from('equipos').select('*').eq('activo', true).order('created_at', { ascending: false });
    if (data) setEquipos(data);
    setCargando(false);
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleArchivar = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas "Archivar" (Dar de baja) el equipo "${nombre}"? \nSu historial de reportes se mantendrá vivo, pero el equipo ya no aparecerá activo para los técnicos.`)) return;

    const { error } = await supabase.from('equipos').update({ activo: false }).eq('id_equipo', id);
    if (!error) {
      setEquipos(equipos.filter(e => e.id_equipo !== id));
    } else {
      alert("Error archivando el equipo: " + error.message);
    }
  };

  const abrirModal = (equipo = null) => {
    setNuevaUbicacionMode(false); // Reinicia el modo de inserción manual
    if (equipo) {
      setEquipoEditando(equipo);
      setFormData({
        nombre_equipo: equipo.nombre_equipo || '',
        marca: equipo.marca || '',
        modelo: equipo.modelo || '',
        serie: equipo.serie || '',
        ubicacion: equipo.ubicacion || '',
        area: equipo.area || ''
      });
    } else {
      setEquipoEditando(null);
      setFormData({ nombre_equipo: '', marca: '', modelo: '', serie: '', ubicacion: '', area: '' });
    }
    setModalAbierto(true);
  };

  const guardarEquipo = async () => {
    if (!formData.nombre_equipo || !formData.ubicacion) {
      alert("Introduce al menos el nombre y la ubicación del equipo.");
      return;
    }

    if (equipoEditando) {
      // Actualizar
      const { error } = await supabase.from('equipos').update(formData).eq('id_equipo', equipoEditando.id_equipo);
      if (!error) {
        setEquipos(equipos.map(e => e.id_equipo === equipoEditando.id_equipo ? { ...e, ...formData } : e));
      } else alert(error.message);
    } else {
      // Crear nuevo: Para evitar errores de secuencias rotas en Supabase (equipos_pkey), forzamos manualmente el ID extraído de la lista local
      let nextId = 1;
      if (equipos.length > 0) {
        // Encontramos el ID más alto cargado actualmente y le sumamos 1
        const maxId = Math.max(...equipos.map(e => e.id_equipo));
        nextId = maxId + 1;
      }
      
      const insertData = { ...formData, id_equipo: nextId };

      const { data, error } = await supabase.from('equipos').insert([insertData]).select();
      if (!error && data) {
        setEquipos([data[0], ...equipos]);
      } else {
        // Fallback en caso de que alguien más haya insertado mientras tanto
        alert(error?.message || "Error desconocido al crear.");
      }
    }

    setModalAbierto(false);
  };

  const equiposFiltrados = equipos.filter(e => {
    const term = busqueda.toLowerCase();
    return (e.nombre_equipo?.toLowerCase().includes(term) ||
            e.marca?.toLowerCase().includes(term) ||
            e.ubicacion?.toLowerCase().includes(term) ||
            e.serie?.toLowerCase().includes(term));
  });

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER TABS EQUIPOS */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-[#0B1121]">Directorio de Equipos</h2>
        <button 
          onClick={() => abrirModal()}
          className="bg-[#0B1121] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Nuevo Equipo
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative mb-6">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, marca, modelo, serie, área o ubicación..." 
          className="w-full bg-white border border-slate-200 text-slate-700 py-3 pl-12 pr-4 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 transition-shadow"
        />
      </div>

      {cargando ? (
        <div className="py-10 text-center text-slate-400 font-bold">Cargando equipos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equiposFiltrados.map(equipo => (
            <div key={equipo.id_equipo} className="border border-slate-100 rounded-[24px] p-5 hover:border-slate-300 transition-colors bg-[#FAFAFA]/50 group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{equipo.nombre_equipo}</h3>
                <span className="bg-white border border-slate-200 text-slate-500 text-[10px] uppercase font-black px-2.5 py-1 rounded-full whitespace-nowrap ml-2 shadow-sm">
                  {equipo.ubicacion || '---'}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-5 truncate">
                {equipo.marca || 'S/M'} &bull; {equipo.modelo || 'S/M'} &bull; Serie: {equipo.serie ? equipo.serie : 'N/A'}
              </p>
              
              <div className="flex justify-end gap-5 text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                <button onClick={() => abrirModal(equipo)} className="text-blue-600 hover:text-blue-800">
                  Editar
                </button>
                <button onClick={() => handleArchivar(equipo.id_equipo, equipo.nombre_equipo)} className="text-orange-500 hover:text-orange-700">
                  Dar de baja
                </button>
              </div>
            </div>
          ))}
          {equiposFiltrados.length === 0 && (
             <div className="col-span-full py-10 text-center text-slate-400 font-bold">No se encontraron coincidencias</div>
          )}
        </div>
      )}

      {/* MODAL DE EQUIPOS */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl animate-[zoomIn_0.2s_ease-out]">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{equipoEditando ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-700">
              <div className="col-span-2">
                <label className="block mb-1">Nombre del Equipo *</label>
                <input type="text" value={formData.nombre_equipo} onChange={e => setFormData({...formData, nombre_equipo: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block mb-1">Ubicación *</label>
                {nuevaUbicacionMode || ubicacionesExistentes.length === 0 ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nuevo local..."
                      value={formData.ubicacion} 
                      onChange={e => setFormData({...formData, ubicacion: e.target.value})} 
                      autoFocus
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" 
                    />
                    {ubicacionesExistentes.length > 0 && (
                      <button 
                        onClick={() => { setNuevaUbicacionMode(false); setFormData({...formData, ubicacion: ubicacionesExistentes[0]}); }} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 font-bold uppercase hover:underline"
                        title="Volver a la selección de locales"
                      >
                        Atrás
                      </button>
                    )}
                  </div>
                ) : (
                  <select 
                    value={formData.ubicacion} 
                    onChange={e => {
                      if (e.target.value === '___NUEVA___') {
                        setNuevaUbicacionMode(true);
                        setFormData({...formData, ubicacion: ''});
                      } else {
                        setFormData({...formData, ubicacion: e.target.value});
                      }
                    }} 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {ubicacionesExistentes.map((ubi, i) => <option key={i} value={ubi}>{ubi}</option>)}
                    <option value="___NUEVA___" className="font-extrabold">+ Añadir nueva sede...</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block mb-1">Área específica</label>
                <input type="text" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block mb-1">Marca</label>
                <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block mb-1">Modelo</label>
                <input type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Serie</label>
                <input type="text" value={formData.serie} onChange={e => setFormData({...formData, serie: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModalAbierto(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={guardarEquipo} className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#0B1121] text-white hover:bg-black transition-colors shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
