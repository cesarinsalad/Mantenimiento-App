import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import TabUsuarios from './TabUsuarios';
import TabEquipos from './TabEquipos';
import TabReportes from './TabReportes';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
      if (!data || String(data.rol).toUpperCase() !== 'ADMIN') {
        navigate('/'); // Expulsar si no es admin
      } else {
        setVerificando(false);
      }
    }
    checkAdmin();
  }, [navigate]);

  if (verificando) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-bold text-slate-400">Verificando administrador...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans sm:max-w-5xl sm:mx-auto">
      
      {/* HEADER OCULTO AL IMPRIMIR */}
      <div className="px-6 pt-12 pb-6 print:hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[32px] font-extrabold text-[#0B1121] tracking-tight">Panel de Administración</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Gestión del sistema</p>
          </div>
          <button onClick={() => navigate('/')} className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
        </div>

        {/* CONTROLES DE TABS */}
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`py-2 px-6 rounded-full font-bold text-sm transition-all border ${activeTab === 'usuarios' ? 'bg-[#0B1121] text-white border-transparent shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('equipos')}
            className={`py-2 px-6 rounded-full font-bold text-sm transition-all border ${activeTab === 'equipos' ? 'bg-[#0B1121] text-white border-transparent shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Equipos
          </button>
          <button 
            onClick={() => setActiveTab('reportes')}
            className={`py-2 px-6 rounded-full font-bold text-sm transition-all border ${activeTab === 'reportes' ? 'bg-[#0B1121] text-white border-transparent shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Reportes
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE TABS */}
      <div className="px-6 pb-20">
        {activeTab === 'usuarios' && <TabUsuarios />}
        {activeTab === 'equipos' && <TabEquipos />}
        {activeTab === 'reportes' && <TabReportes />}
      </div>
    </div>
  );
}
