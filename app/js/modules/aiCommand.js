/**
 * aiCommand.js
 * AI Command Center con ayuda inteligente y sugerencias IA
 * TallerPRO360 ERP
 */

import AICommandCenter from "../ai/aiCommandCenter.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

const ai = new AICommandCenter();

export function aiCommand(container, state) {

  container.innerHTML = `
    <h1 style="font-size:26px;margin-bottom:20px;">🤖 AI Command Center</h1>

    <div class="card">
      <p style="color:#94a3b8;">Controla el ERP escribiendo comandos o solicita ayuda IA.</p>

      <input
        id="aiInput"
        placeholder="Ej: ver inventario"
        style="width:100%;padding:12px;margin-top:10px;border-radius:8px;border:1px solid #334155;background:#020617;color:white;"
      />

      <button
        id="aiRun"
        style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;"
      >Ejecutar</button>
    </div>

    <div class="card" style="margin-top:15px;">
      <h3>💡 Sugerencias IA</h3>
      <div id="aiSugerencias">Cargando sugerencias...</div>
      <button id="refrescarSugerencias" style="margin-top:10px;padding:8px 12px;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;">🔄 Actualizar Sugerencias</button>
    </div>

    <div class="card" style="margin-top:15px;">
      <h3>Historial de Comandos</h3>
      <div id="aiHistory"></div>
    </div>

    <div id="aiResponse" style="margin-top:20px;"></div>
  `;

  initAICommand(state);
}

/* ===========================
INICIALIZAR AI COMMAND
=========================== */
async function initAICommand(state) {
  const input = document.getElementById("aiInput");
  const btn = document.getElementById("aiRun");
  const btnRefrescar = document.getElementById("refrescarSugerencias");

  btn.onclick = runCommand;
  input.addEventListener("keydown", (e) => { if(e.key === "Enter") runCommand(); });
  btnRefrescar.onclick = async () => { await cargarSugerencias(state); };

  renderHistory();
  await cargarSugerencias(state);
}

/* ===========================
EJECUTAR COMANDO
=========================== */
function runCommand() {
  const input = document.getElementById("aiInput");
  const text = input.value.trim();
  if (!text) return alert("Escribe un comando");

  const module = ai.processCommand(text);
  const response = document.getElementById("aiResponse");

  if (!module) {
    response.innerHTML = `<div class="card">❌ Comando no reconocido</div>`;
    hablar("Comando no reconocido");
    return;
  }

  response.innerHTML = `<div class="card">🧠 Ejecutando comando...</div>`;
  ai.execute(text);
  hablar(`Comando ejecutado: ${text}`);

  renderHistory();
}

/* ===========================
RENDER HISTORIAL
=========================== */
function renderHistory() {
  const container = document.getElementById("aiHistory");
  if (!container) return;

  const history = AICommandCenter.getHistory();

  if (!history.length) {
    container.innerHTML = "<p>Sin comandos aún</p>";
    return;
  }

  container.innerHTML = history
    .slice().reverse()
    .map(item => `
      <div style="padding:8px;border-bottom:1px solid #1e293b;font-size:14px;">
        🧠 ${item.command}<br>
        <span style="color:#38bdf8">→ ${item.module || "no reconocido"}</span>
      </div>
    `).join("");
}

/* ===========================
CARGAR SUGERENCIAS IA
=========================== */
async function cargarSugerencias(state) {
  const container = document.getElementById("aiSugerencias");
  container.innerHTML = "Cargando sugerencias IA...";

  try {
    const sugerencias = await generarSugerencias({ estado: state });
    renderSugerencias("aiSugerencias", sugerencias);
  } catch (e) {
    console.error("Error cargando sugerencias IA:", e);
    container.innerHTML = "<p>❌ Error cargando sugerencias</p>";
  }
}

/* ===========================
SÍNTESIS DE VOZ
=========================== */
function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}