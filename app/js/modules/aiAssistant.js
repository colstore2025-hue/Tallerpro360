/**
 * aiAssistant.js - TallerPRO360 V4 🤖
 * Asistente Conversacional con Procesamiento de Voz Nexus-X
 */
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";
import { hablar, iniciarVoz } from "../voice/voiceCore.js";

export default async function aiAssistantModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const base = `empresas/${empresaId}`;

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      
      <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
                NEXUS <span class="text-cyan-400">VOICE</span>
            </h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Interfaz de Lenguaje Natural</p>
        </div>
        <div class="flex gap-2">
            <button id="limpiarChat" class="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 active:scale-90 transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
        </div>
      </div>

      <div id="respuestaIA" class="bg-black/40 border border-white/5 rounded-[2rem] p-6 mb-6 h-[45vh] overflow-y-auto space-y-4 custom-scrollbar shadow-inner">
        <div class="flex gap-3">
            <div class="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-500 text-[10px]"><i class="fas fa-robot"></i></div>
            <p class="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest leading-relaxed">Sistemas Nexus-X en línea. ¿En qué puedo asistirte, Comandante?</p>
        </div>
      </div>

      <div class="fixed bottom-28 left-4 right-4 space-y-4">
          <div class="relative">
              <textarea id="consultaIA" placeholder="Escribe un comando o consulta..." 
                        class="w-full bg-[#0f172a] border border-white/10 p-5 rounded-[2rem] text-xs font-bold text-white outline-none focus:border-cyan-500 transition-all shadow-2xl pr-16 resize-none h-16 flex items-center"></textarea>
              <button id="vozIA" class="absolute right-3 top-3 w-10 h-10 bg-cyan-500 rounded-2xl text-black shadow-lg active:scale-90 transition-all">
                  <i class="fas fa-microphone"></i>
              </button>
          </div>
          
          <button id="consultarIA" class="w-full bg-white text-black py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
              Enviar Consulta a Nexus
          </button>
      </div>

    </div>
  `;

  const input = document.getElementById("consultaIA");
  const output = document.getElementById("respuestaIA");

  async function procesarConsulta(pregunta) {
    if (!pregunta) return;

    // Burbuja de Usuario
    output.innerHTML += `
      <div class="flex justify-end gap-3 animate-fade-in">
        <div class="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-3xl rounded-tr-none max-w-[80%]">
            <p class="text-[11px] font-black text-cyan-400 uppercase tracking-tighter">${pregunta}</p>
        </div>
      </div>
    `;

    try {
      // 1. Obtener Datos Reales de Producción
      const snap = await getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "desc"), limit(50)));
      
      let totalVentas = 0, totalCosto = 0, abiertas = 0, dataOrdenes = [];
      snap.forEach(d => {
        const o = d.data();
        dataOrdenes.push(o);
        totalVentas += Number(o.total || 0);
        totalCosto += Number(o.costoTotal || 0);
        if (o.estado !== "CERRADA") abiertas++;
      });

      // 2. Ejecutar Advisor
      const { sugerencias } = await generarSugerencias({ ordenes: dataOrdenes, empresaId });

      // 3. Respuesta de la IA
      const respuestaHTML = `
        <div class="flex gap-3 animate-fade-in">
          <div class="bg-white/5 border border-white/5 p-5 rounded-3xl rounded-tl-none max-w-[90%] shadow-xl">
              <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic underline decoration-cyan-500">Reporte Nexus-X</p>
              <div class="grid grid-cols-2 gap-2 mb-4">
                  <div class="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                      <span class="block text-[7px] text-slate-600 font-black uppercase">Ingresos</span>
                      <span class="text-[10px] font-black text-emerald-400">$${fmt(totalVentas)}</span>
                  </div>
                  <div class="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                      <span class="block text-[7px] text-slate-600 font-black uppercase">Pendientes</span>
                      <span class="text-[10px] font-black text-yellow-500">${abiertas} Órdenes</span>
                  </div>
              </div>
              <ul class="space-y-2">
                ${sugerencias.slice(0, 2).map(s => `
                  <li class="flex items-start gap-2 text-[10px] font-bold text-slate-300 leading-tight border-l border-cyan-500 pl-2">
                    ${s.msg || s}
                  </li>
                `).join("")}
              </ul>
          </div>
        </div>
      `;

      setTimeout(() => {
          output.innerHTML += respuestaHTML;
          output.scrollTop = output.scrollHeight;
          hablar("Análisis del sistema completado. Aquí tienes los resultados actuales.");
      }, 600);

    } catch (e) {
      console.error(e);
      output.innerHTML += `<p class="text-red-500 text-[8px] font-black uppercase">Error en el enlace de datos</p>`;
    }
  }

  // --- Eventos ---
  document.getElementById("consultarIA").onclick = () => {
    const q = input.value.trim();
    if(q) {
        procesarConsulta(q);
        input.value = "";
    }
  };

  document.getElementById("vozIA").onclick = () => {
    iniciarVoz((texto) => {
      procesarConsulta(texto);
    });
  };

  document.getElementById("limpiarChat").onclick = () => {
    output.innerHTML = "";
  };
}

function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }
