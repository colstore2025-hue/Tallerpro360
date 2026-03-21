/**
 * ordenes.js - TallerPRO360 ULTRA-SINCRO
 * Flujo de Trabajo Automatizado (Dictado + Inspección Visual)
 * Ruta: app/js/modules/ordenes.js
 */
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { saveOrder } from "../services/ordenesService.js";

export default async function ordenesModule(container, state) {
  const empresaId = state.empresaId;

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-black italic">ÓRDENES <span class="text-cyan-400">PRO</span></h1>
        <div class="flex gap-2">
           <button id="btnVozGlobal" class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
             <i class="fas fa-microphone text-white"></i>
           </button>
        </div>
      </div>

      <div class="flex justify-between mb-8 px-2 relative">
        <div class="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -z-10"></div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
          <span class="text-[8px] font-bold text-cyan-400">RECIBIDO</span>
        </div>
        <div class="flex flex-col items-center gap-2 opacity-30">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-[8px] font-bold">TALLER</span>
        </div>
        <div class="flex flex-col items-center gap-2 opacity-30">
          <div class="w-4 h-4 rounded-full bg-emerald-500"></div>
          <span class="text-[8px] font-bold">LISTO</span>
        </div>
      </div>

      <div class="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 mb-6">
        <h3 class="text-xs font-bold text-slate-500 mb-4 uppercase tracking-tighter">Diagnóstico Asistido por IA</h3>
        <textarea id="txtDiagnostico" placeholder="Dicta o escribe la falla..." 
          class="w-full bg-transparent border-none text-lg text-white outline-none resize-none h-32"></textarea>
        
        <div class="flex justify-between mt-4">
          <button class="bg-slate-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <i class="fas fa-camera text-cyan-400"></i> EVIDENCIA
          </button>
          <button id="btnGenerarOrden" class="bg-cyan-500 text-black px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg">
            Sincronizar Orden
          </button>
        </div>
      </div>

      <div id="listaOrdenesActivas" class="space-y-4">
        </div>
    </div>
  `;

  // --- LÓGICA DE VOZ (Integrada con Nexus-X) ---
  const btnVoz = document.getElementById("btnVozGlobal");
  const txtDiag = document.getElementById("txtDiagnostico");

  btnVoz.onclick = () => {
    hablar("William, te escucho. Describe el problema del vehículo.");
    // Aquí disparamos el reconocimiento de voz de voiceCore.js
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "es-CO";
      recognition.start();
      recognition.onresult = (e) => {
        txtDiag.value = e.results[0][0].transcript;
        hablar("Entendido, analizando requerimientos técnicos.");
      };
    }
  };

  // --- GUARDADO AUTOMÁTICO ---
  document.getElementById("btnGenerarOrden").onclick = async () => {
    if(!txtDiag.value) return hablar("No has dictado el diagnóstico.");
    
    const loader = document.createElement("div");
    loader.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 font-black text-cyan-400";
    loader.innerText = "IA GENERANDO ORDEN...";
    document.body.appendChild(loader);

    try {
      const nuevaOrden = {
        empresaId,
        diagnostico: txtDiag.value,
        fecha: new Date(),
        estado: "RECIBIDO",
        iaGenerated: true
      };
      
      await saveOrder(nuevaOrden);
      hablar("Orden sincronizada con éxito. El cliente recibirá un mensaje de WhatsApp.");
      location.reload();
    } catch (e) {
      hablar("Error en el servidor de Nexus-X.");
    } finally {
      loader.remove();
    }
  };
}
