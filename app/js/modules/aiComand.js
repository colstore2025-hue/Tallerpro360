/**
 * aiCommand.js - TallerPRO360 V4 🤖
 * Centro de Comando por Voz y Texto Nexus-X
 */
import AICommandCenter from "../ai/aiCommandCenter.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

const ai = new AICommandCenter();

export function aiCommand(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  if (!empresaId) {
    container.innerHTML = `<div class="p-10 text-red-500 font-black uppercase text-center">❌ Identidad Nexus No Definida</div>`;
    return;
  }

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      
      <div class="mb-8">
        <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
            COMMAND <span class="text-cyan-400">CENTER</span>
        </h1>
        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Control de Ecosistema por Algoritmos</p>
      </div>

      <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 opacity-5 text-6xl text-cyan-500"><i class="fas fa-terminal"></i></div>
        <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-4">Ingrese instrucción de sistema</p>
        
        <div class="relative">
            <input id="aiInput" placeholder="Ej: 'ver reportes', 'nuevo repuesto'..." 
                   class="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-xs font-bold text-cyan-400 outline-none focus:border-cyan-500 transition-all shadow-inner uppercase">
            <button id="aiRun" class="absolute right-2 top-2 bottom-2 bg-cyan-500 text-black px-6 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">
                EJECUTAR
            </button>
        </div>
      </div>

      <div class="mb-6">
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">💡 Insights de Optimización</h3>
            <button id="refrescarSugerencias" class="text-[8px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full active:scale-90 transition-all">
                <i class="fas fa-sync-alt mr-1"></i> Sincronizar
            </button>
        </div>
        <div id="aiSugerencias" class="min-h-[100px]">
            <div class="animate-pulse flex flex-col items-center py-10">
                <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p class="text-[8px] text-slate-600 font-black uppercase">Analizando métricas de rendimiento...</p>
            </div>
        </div>
      </div>

      <div class="bg-[#0f172a]/50 rounded-[2rem] border border-white/5 p-6">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Log de Comandos Recientes</h3>
        <div id="aiHistory" class="space-y-3 opacity-80">
            </div>
      </div>

      <div id="aiResponse" class="fixed bottom-4 left-4 right-4 pointer-events-none"></div>
    </div>
  `;

  initAICommand(state);
}

async function initAICommand(state) {
  const input = document.getElementById("aiInput");
  const btn = document.getElementById("aiRun");
  const btnRefrescar = document.getElementById("refrescarSugerencias");

  btn.onclick = () => runCommand();
  input.onkeydown = (e) => { if (e.key === "Enter") runCommand(); };
  btnRefrescar.onclick = () => cargarSugerencias(state);

  renderHistory();
  await cargarSugerencias(state);
}

function runCommand() {
  const input = document.getElementById("aiInput");
  const text = input.value.trim();
  if (!text) return;

  const result = ai.processCommand(text);
  const responseArea = document.getElementById("aiResponse");

  if (!result) {
    showToast("❌ Comando No Reconocido", "red");
    hablar("Lo siento, no reconozco esa instrucción en la matriz.");
    return;
  }

  ai.execute(text);
  hablar(`Iniciando ejecución de ${text}`);
  showToast(`🚀 Ejecutando: ${result.module}`, "cyan");

  input.value = "";
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById("aiHistory");
  if (!container) return;

  const history = AICommandCenter.getHistory();
  if (!history.length) {
    container.innerHTML = `<p class="text-[9px] text-slate-700 italic font-black uppercase tracking-widest">Sin actividad registrada</p>`;
    return;
  }

  container.innerHTML = history.slice().reverse().slice(0, 5).map(item => `
    <div class="flex items-center justify-between border-b border-white/5 pb-2">
      <div class="flex items-center gap-2">
          <i class="fas fa-terminal text-[8px] text-cyan-500"></i>
          <span class="text-[10px] font-bold text-slate-300 uppercase">${item.command}</span>
      </div>
      <span class="text-[8px] font-black text-slate-600 uppercase tracking-tighter italic">${item.module}</span>
    </div>
  `).join("");
}

async function cargarSugerencias(state) {
  const container = document.getElementById("aiSugerencias");
  const base = `empresas/${state.empresaId}`;

  try {
    const [ordenesSnap, invSnap] = await Promise.all([
      getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "desc"), limit(20))),
      getDocs(query(collection(db, `${base}/repuestos`), orderBy("creadoEn", "desc"), limit(20)))
    ]);

    const data = await generarSugerencias({
      ordenes: ordenesSnap.docs.map(d => d.data()),
      inventario: invSnap.docs.map(d => d.data()),
      empresaId: state.empresaId
    });

    renderSugerencias("aiSugerencias", data);
  } catch (e) {
    container.innerHTML = `<p class="text-red-500 text-[8px] font-black">Error de Sincronización</p>`;
  }
}

function showToast(msg, color) {
    const area = document.getElementById("aiResponse");
    area.innerHTML = `<div class="bg-${color}-500 text-black p-4 rounded-2xl font-black text-[10px] uppercase text-center animate-bounce shadow-2xl pointer-events-auto mx-auto max-w-xs">${msg}</div>`;
    setTimeout(() => { area.innerHTML = ""; }, 3000);
}

function hablar(texto) {
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1.1;
  window.speechSynthesis.speak(speech);
}
