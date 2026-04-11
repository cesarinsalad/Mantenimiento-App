import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/robusta-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
      setCargando(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center px-6 font-sans">
      <div className="bg-white p-10 sm:p-12 w-full max-w-md rounded-[48px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-50 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        
        {/* LOGO DE EMPRESA */}
        <div className="flex justify-center mb-10 w-full px-4">
          <img 
            src={logo} 
            alt="Robusta Food Group Gerencia" 
            className="w-full max-w-[220px] object-contain"
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[11px] font-bold text-[#8fa3ba] uppercase tracking-[0.15em] ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="w-full bg-[#f6f8fb] border border-[#eef2f6] focus:border-[#d0dbe7] focus:bg-white focus:ring-2 focus:ring-[#f0f4f8] rounded-3xl px-6 py-4 mt-2 outline-none transition-all font-medium text-slate-800"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8fa3ba] uppercase tracking-[0.15em] ml-1">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full bg-[#f6f8fb] border border-[#eef2f6] focus:border-[#d0dbe7] focus:bg-white focus:ring-2 focus:ring-[#f0f4f8] rounded-3xl px-6 py-4 mt-2 outline-none transition-all font-medium text-slate-800"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}

          <button 
            disabled={cargando}
            className="w-full bg-[#151515] text-white font-bold py-5 rounded-[32px] hover:bg-black hover:shadow-lg hover:shadow-black/10 active:scale-[0.98] transition-all mt-4 text-[17px] tracking-wide"
          >
            {cargando ? "Validando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
      
      {/* FOOTER */}
      <p className="text-center text-[#B0BCC9] text-[10px] sm:text-xs mt-12 font-bold uppercase tracking-[0.2em] relative z-0">
        Mantenimiento App — Versión 1.0
      </p>
    </div>
  );
}