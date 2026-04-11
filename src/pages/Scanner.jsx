import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function Scanner() {
  const navigate = useNavigate();
  const [errorCamara, setErrorCamara] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    let isMounted = true;
    let isCameraActive = false; // Solo true cuando start() completó
    let isStopping = false; // Previsión para que stop() actúe una sola vez
    let streamRef = null;
    
    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    // Buscamos el elemento de video continuamente de las entrañas ocultas
    // de la librería para "robar" la referencia directa la cámara
    const intervalId = setInterval(() => {
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        streamRef = videoElement.srcObject;
        clearInterval(intervalId);
      }
    }, 100);

    const stopCameraAndNavigate = async (decodedText) => {
      if (isStopping) return;
      isStopping = true;
      clearInterval(intervalId); // Detenemos la búsqueda si apenas comenzó

      // 1. FORZAR APAGADO DE HARDWARE: 
      try {
        if (streamRef) {
          streamRef.getTracks().forEach(track => track.stop());
        } else {
          // Fallback por si la cámara se detuvo en el mismo milisegundo o no encontró el stream antes
          const videoElement = document.querySelector("#reader video");
          if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
          }
        }
      } catch (e) {
        console.error("Error forzando apagado de tracks", e);
      }

      // 2. DETENER LIBRERÍA:
      try {
        if (isCameraActive) {
          await html5QrCode.stop();
        }
        html5QrCode.clear();
      } catch (e) {
        console.error("Ignorado fallo al detener cámara: ", e);
      } finally {
        if (decodedText) {
          navigate(`/equipo/${decodedText}`);
        }
      }
    };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // En vez de parar y desencadenar un montón de fallos si se cruza con el return(),
        // llamamos a nuestra función blindada.
        if (isMounted) stopCameraAndNavigate(decodedText);
      },
      () => { /* Ignoramos spam */ }
    ).then(() => {
      isCameraActive = true;
      if (!isMounted) {
        // Si el usuario presionó volver mientras se estaba encendiendo la cámara
        stopCameraAndNavigate(null);
      }
    }).catch(() => {
      if (isMounted) setErrorCamara(true);
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      stopCameraAndNavigate(null);
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