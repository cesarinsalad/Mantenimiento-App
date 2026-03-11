import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function Scanner() {
  const navigate = useNavigate();
  const [errorCamara, setErrorCamara] = useState(false);

useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    
    // Dejamos la configuración nativa que funciona perfecto
    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // ÉXITO: Paramos la cámara y limpiamos ANTES de navegar
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear(); // Destruye el elemento HTML oculto
            navigate(`/equipo/${decodedText}`);
          }).catch(err => console.error(err));
        }
      },
      () => { /* Ignoramos el spam de la consola */ }
    ).catch(() => {
      setErrorCamara(true);
    });

    // LIMPIEZA: Cuando el usuario presiona "Atrás" o cierra el componente
    return () => {
      if (html5QrCode.isScanning) {
        // Esperamos a que se detenga y LUEGO limpiamos la memoria
        html5QrCode.stop().then(() => {
          html5QrCode.clear(); // APAGA EL HARDWARE DEL TELÉFONO
        }).catch(() => {
          // Silenciamos errores si se cerró demasiado rápido
        });
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans sm:max-w-md sm:mx-auto sm:border-x sm:border-slate-800">
      
{/* Header Superior */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 z-10">
        
        {/* 1. Botón de volver (Flecha) */}
        <button onClick={() => navigate(-1)} className="bg-[#1E293B] p-3 rounded-full hover:bg-slate-700 transition">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* 2. Título centrado */}
        <h1 className="font-bold text-lg text-white">Escanear Código QR</h1>

        {/* 3. Elemento fantasma (Ocupa el mismo ancho que el botón para equilibrar el flexbox) */}
        <div className="w-11 h-11"></div>
        
      </div>

      {/* Zona Central: El Escáner Puro */}
      <div className="flex-1 flex justify-center items-center px-6">
        {/* Este div contendrá la cámara y la interfaz nativa de la librería */}
        <div 
          id="reader" 
          className="w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl bg-black border-2 border-[#1E293B]"
        ></div>
      </div>

      {/* Tarjeta Inferior */}
      <div className="px-6 pb-10 z-10">
        <div className="bg-[#0B1121]/80 backdrop-blur-md border border-slate-700/50 rounded-[28px] p-6 flex flex-col items-center shadow-2xl">
          {errorCamara ? (
            <p className="text-red-400 text-sm font-medium text-center">Permita el acceso a la cámara en su navegador para continuar.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h2 className="font-bold text-lg">Escaneando...</h2>
              </div>
              <p className="text-slate-400 text-sm text-center">Coloque el código QR dentro del marco.</p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}