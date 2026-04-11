import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Cliente Secundario Sigiloso: No guarda sesión ni pisa la del Admin.
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
);

export default function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Estados para el Modal de Nuevo Usuario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [formConfig, setFormConfig] = useState({
    email: '',
    password: '',
    nombre: '',
    cargo: '',
    rol: 'USER'
  });

  const fetchUsuarios = async () => {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (data) setUsuarios(data);
    setCargando(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const alternarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'ADMIN' ? 'USER' : 'ADMIN';
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id);

    if (!error) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
    } else alert("Error al actualizar rol: " + error.message);
  };

  const eliminarUsuario = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este usuario de la plataforma?");
    if (!confirmar) return;

    const { error } = await supabase.from('perfiles').delete().eq('id', id);
    if (!error) setUsuarios(usuarios.filter(u => u.id !== id));
    else alert("Error al eliminar perfil:\n" + error.message);
  };

  const registrarUsuarioDirecto = async () => {
    const { email, password, nombre, cargo, rol } = formConfig;
    if (!email || !password || !nombre) {
      alert("Por favor completa al menos el nombre, email y contraseña.");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    setProcesando(true);

    // 1. Registrar Sigilosamente en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password
    });

    if (authError) {
      alert("Error al crear cuenta: " + authError.message);
      setProcesando(false);
      return;
    }

    const nuevoId = authData.user?.id;
    if (!nuevoId) {
      alert("Error: Supabase no devolvió el ID del nuevo usuario. Revisa la consola.");
      setProcesando(false);
      return;
    }

    if (!authData.session?.access_token) {
      alert("Alerta de Seguridad RLS: Supabase creó la cuenta pero no otorgó credenciales de acceso directo.\nConsecuencia: La tabla 'perfiles' bloqueó el registro de su nombre y rol.\n\nPor favor verifica en Supabase -> Authentication que 'Confirm email' realmente este APAGADO, o elimina el usuario incompleto e inténtalo de nuevo.");
      setProcesando(false);
      return;
    }

    // 2. Insertar usando un TERCER mini-cliente inyectando EXACTAMENTE el token (Llave) del usuario recién nacido.
    // Esto es 100% infalible si la sesión fue devuelta, porque para la base de datos, literalmente es el nuevo técnico guardando su propio perfil (Bypassing RLS auth.uid() = id limit).
    const tokenClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } } }
    );

    const { error: profileError } = await tokenClient.from('perfiles').insert([{
      id: nuevoId,
      nombre,
      cargo,
      rol
    }]);

    if (profileError) {
      alert("Aviso crítico: Cuenta creada pero hubo error guardando en perfiles: " + profileError.message);
    } else {
      // Éxito Total
      setUsuarios([{ id: nuevoId, nombre, cargo, rol }, ...usuarios]);
      setModalAbierto(false);
      setFormConfig({ email: '', password: '', nombre: '', cargo: '', rol: 'USER' });
    }

    setProcesando(false);
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">

      {/* HEADER DE LA TARJETA */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-[#0B1121]">Directorio de Usuarios</h2>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#0B1121] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-black transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Nuevo Usuario
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-4 px-2">Nombre</th>
              <th className="pb-4 px-2">Cargo</th>
              <th className="pb-4 px-2">Rol</th>
              <th className="pb-4 px-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {cargando ? (
              <tr><td colSpan="4" className="py-8 text-center text-slate-400 font-medium">Cargando directorio...</td></tr>
            ) : usuarios.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-2">
                  <p className="font-bold text-slate-900">{user.nombre || 'Sin nombre'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user.id.substring(0, 8)}...</p>
                </td>
                <td className="py-4 px-2 text-slate-500 font-medium">
                  {user.cargo || 'Sin cargo asignado'}
                </td>
                <td className="py-4 px-2">
                  <span className={`text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full ${user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.rol || 'USER'}
                  </span>
                </td>
                <td className="py-4 px-2 text-right font-bold space-x-4">
                  <button onClick={() => alternarRol(user.id, user.rol)} className="text-blue-600 hover:text-blue-800 transition-colors">
                    Alternar Rol
                  </button>
                  {currentUser?.id !== user.id ? (
                    <button onClick={() => eliminarUsuario(user.id)} className="text-red-500 hover:text-red-700 transition-colors">
                      Eliminar
                    </button>
                  ) : (
                    <span className="text-slate-300 cursor-not-allowed">Eliminar</span>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && !cargando && (
              <tr><td colSpan="4" className="py-8 text-center text-slate-400">No hay usuarios registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE NUEVO USUARIO (ADMINISTRADO) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Añadir Empleado</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Genera la cuenta temporal para brindarle acceso a la plataforma.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">Nombre Completo *</label>
                <input
                  type="text"
                  autoFocus
                  value={formConfig.nombre}
                  onChange={e => setFormConfig({ ...formConfig, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">Cargo</label>
                <input
                  type="text"
                  value={formConfig.cargo}
                  onChange={e => setFormConfig({ ...formConfig, cargo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:bg-white"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">Acceso *</label>
                  <select
                    value={formConfig.rol}
                    onChange={e => setFormConfig({ ...formConfig, rol: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:bg-white"
                  >
                    <option value="USER">Permisos Limitados (USER)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">Email (Institucional o Personal) *</label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={formConfig.email}
                  onChange={e => setFormConfig({ ...formConfig, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">Contraseña Temporal *</label>
                <input
                  type="text"
                  placeholder="Mínimo 6 caracteres"
                  value={formConfig.password}
                  onChange={e => setFormConfig({ ...formConfig, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalAbierto(false)}
                disabled={procesando}
                className="w-full px-5 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={registrarUsuarioDirecto}
                disabled={procesando}
                className="w-full px-5 py-3 rounded-2xl font-bold bg-[#0B1121] text-white hover:bg-black transition-colors shadow-lg shadow-slate-900/10 flex justify-center items-center gap-2"
              >
                {procesando ? (
                  <span className="animate-pulse">Registrando...</span>
                ) : (
                  <>Guardar Usuario</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
