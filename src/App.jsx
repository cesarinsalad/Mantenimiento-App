import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import DetalleEquipo from './pages/DetalleEquipo';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Ver sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Escuchar cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans">
        <Routes>
          {/* Si no hay sesión, cualquier ruta te lleva al Login */}
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          
          {/* Rutas Protegidas */}
          <Route path="/" element={session ? <Welcome /> : <Navigate to="/login" />} />
          <Route path="/dashboard/:ubicacion" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/escaner" element={session ? <Scanner /> : <Navigate to="/login" />} />
          <Route path="/equipo/:id" element={session ? <DetalleEquipo /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;