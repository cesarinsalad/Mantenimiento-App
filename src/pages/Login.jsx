import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center px-6 sm:max-w-md sm:mx-auto font-sans">
      <div className="bg-white p-10 rounded-[40px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/10">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tighter">Mantenimiento<br/>App</h1>
        <p className="text-slate-400 text-sm mb-10 font-medium">Inicie sesión para acceder al panel de mantenimiento</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-300 rounded-2xl px-5 py-4 mt-2 outline-none transition-all font-medium placeholder:text-slate-300 placeholder:font-normal"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-300 rounded-2xl px-5 py-4 mt-2 outline-none transition-all font-medium placeholder:text-slate-300 placeholder:font-normal"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}

          <button 
            disabled={cargando}
            className="w-full bg-[#1A1A1A] text-white font-bold py-5 rounded-[20px] shadow-lg shadow-black/10 hover:bg-black active:scale-[0.98] transition-all mt-4"
          >
            {cargando ? "Validando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
      
      <p className="text-center text-slate-300 text-[10px] mt-10 font-bold uppercase tracking-[0.2em]">
        Mantenimiento App — Versión 1.0
      </p>
    </div>
  );
}