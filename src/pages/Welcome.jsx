import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Welcome() {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // NUEVO ESTADO: Para guardar el nombre del usuario
  const [nombreUsuario, setNombreUsuario] = useState('...');

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
    // 1. Buscamos el nombre del usuario logueado
    async function fetchUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('nombre, rol')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.nombre) {
            const primerNombre = data.nombre.split(' ')[0];
            setNombreUsuario(primerNombre);
          } else {
            setNombreUsuario(user.email.split('@')[0]);
          }
          
          setIsAdmin(String(data.rol).toUpperCase() === 'ADMIN');
        } else {
          setNombreUsuario(user.email.split('@')[0]);
        }
      }
    }

    // 2. Buscamos las ubicaciones (equipos activos)
    async function fetchUbicaciones() {
      const { data, error } = await supabase.from('equipos').select('ubicacion').eq('activo', true);
      if (data) {
        const conteo = data.reduce((acc, equipo) => {
          const ubi = equipo.ubicacion || 'Sin Ubicación';
          acc[ubi] = (acc[ubi] || 0) + 1;
          return acc;
        }, {});

        const listaUbicaciones = Object.keys(conteo).map(nombre => ({
          nombre,
          cantidad: conteo[nombre]
        }));
        
        listaUbicaciones.sort((a, b) => b.cantidad - a.cantidad);
        setUbicaciones(listaUbicaciones);
      }
      setCargando(false);
    }

    fetchUsuario();
    fetchUbicaciones();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-10 sm:border-x sm:border-slate-200">
      
      {/* Header Superior Blanco */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[32px] shadow-sm flex justify-between items-start">
        <div>
          {/* TÍTULO DINÁMICO AQUÍ */}
          <h1 className="text-3xl font-extrabold tracking-tight">¡Bienvenido, {nombreUsuario}!</h1>
          <p className="text-slate-500 text-sm mt-1">Seleccione su ubicación para continuar</p>
        </div>
        
        {/* Botón de Logout (Cerrar Sesión) */}
        <button 
          onClick={handleLogout}
          className="bg-slate-50 p-3 rounded-full border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors group"
          title="Cerrar Sesión"
        >
          <svg className="w-5 h-5 text-slate-700 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Cuerpo principal (Tus tarjetas de ubicaciones) */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center text-slate-900 font-extrabold gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl">Ubicaciones Disponibles</h2>
          </div>
          
          {/* BOTÓN ADMIN AQUÍ (SOLO SI ES ADMIN) */}
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="bg-[#0B1121] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 hover:bg-black transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Admin
            </button>
          )}
        </div>

        {cargando ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200/50 rounded-[28px]"></div>)}
          </div>
        ) : (
          <div className="space-y-4">
            {ubicaciones.map((ubi, index) => (
              <button 
                key={index}
                onClick={() => navigate(`/dashboard/${ubi.nombre}`)}
                className="w-full text-left bg-white border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] rounded-[28px] p-5 flex items-center justify-between hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                <div>
                  <h3 className="text-[19px] font-bold text-slate-900">{ubi.nombre}</h3>
                  <p className="text-sm text-slate-400 mt-1">Sede Principal</p>
                  
                  <span className="inline-block mt-4 bg-slate-50 border border-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    {ubi.cantidad} {ubi.cantidad === 1 ? 'Equipo' : 'Equipos'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-full border border-slate-100">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            
            <div className="mt-6 border border-slate-200/60 rounded-[24px] p-4 text-center bg-white/50">
              <p className="text-xs text-slate-500 font-medium">
                Puede cambiar de ubicación en cualquier momento desde el panel
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}