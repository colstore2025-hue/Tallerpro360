/**
 * aiAssistant.js - Versión Avanzada
 * Panel del Asistente IA Integrado con aiAdvisor y alertas en tiempo real
 * TallerPRO360 ERP
 */

import AICommandCenter from "../ai/aiCommandCenter.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

export async function aiassistant(container, state) {

  container.innerHTML = `
    <div class="card">
      <h2>🤖 AI Assistant Avanzado</h2>
      <p>Escribe un comando para controlar el sistema o pedir sugerencias inteligentes.</p>
      <input
        id="aiCommandInput"
        placeholder="Ej: abrir inventario"
        style="width:100%;padding:12px;margin-top:10px;background:#020617;border:1px solid #1e293b;color:white;border-radius:8px;"
      />
      <button
        id="aiRunBtn"
        style="margin-top:10px;padding:10px 16px;background:#16a34a;border:none;border-radius:8px;color:white;cursor:pointer;"
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
  `;

  initAI(state);
}

/* ===========================
INICIALIZAR PANEL
=========================== */
async function initAI(state) {
  const input = document.getElementById("aiCommandInput");
  const btn = document.getElementById("aiRunBtn");
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
  const input = document.getElementById("aiCommandInput");
  const text = input.value.trim();
  if (!text) return;

  const result = AICommandCenter.execute(text);
  input.value = "";
  renderHistory();

  if (!result) {
    alert("❌ Comando no reconocido");
  } else {
    // Opcional: leer comando ejecutado por voz
    hablar(`Comando ejecutado: ${text}`);
  }
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