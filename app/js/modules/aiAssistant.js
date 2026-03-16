/**
================================================
aiAssistant.js - Panel del Asistente IA
TallerPRO360 ERP
Ubicación: /app/js/modules/aiAssistant.js
================================================
*/

import AICommandCenter from "../ai/aiCommandCenter.js";
import { inventario } from "./inventario.js";
import { ordenes } from "./ordenes.js";

export async function aiAssistant(pregunta) {
  // Simulación de procesamiento IA (puede conectar con SuperAI)
  // Se puede reemplazar con fetch a API real
  return new Promise((resolve) => {
    setTimeout(() => {
      let respuesta = "No entendí la consulta.";

      // Comandos simples de ejemplo
      const cmd = pregunta.toLowerCase();
      if(cmd.includes("inventario")) respuesta = "Puedes abrir el inventario desde el panel principal.";
      else if(cmd.includes("orden")) respuesta = "Para crear una orden, ingresa los datos del cliente y vehículo.";
      else if(cmd.includes("diagnóstico")) respuesta = "Describe los síntomas del vehículo y generaré un diagnóstico inteligente.";
      else if(cmd.includes("ayuda")) respuesta = "Soy tu asistente IA, puedo ayudarte a manejar órdenes, inventario y diagnósticos.";

      resolve(respuesta);
    }, 500);
  });
}

/* ===========================
INICIALIZAR PANEL DE IA EN UI
=========================== */
export async function initAIPanel(container) {
  container.innerHTML = `
<div class="card">
  <h2>🤖 AI Assistant</h2>
  <input
    id="aiCommandInput"
    placeholder="Ej: abrir inventario, crear orden..."
    style="width:100%;padding:12px;margin-top:10px;background:#020617;border:1px solid #1e293b;color:white;border-radius:8px;"
  />
  <button id="aiRunBtn" style="margin-top:10px;padding:10px 16px;background:#16a34a;border:none;border-radius:8px;color:white;cursor:pointer;">
    Ejecutar
  </button>
</div>

<div class="card">
  <h3>Historial IA</h3>
  <div id="aiHistory"></div>
</div>
`;

const input = document.getElementById("aiCommandInput");
const btn = document.getElementById("aiRunBtn");

btn.onclick = runCommand;
input.addEventListener("keydown", (e) => { if(e.key==="Enter") runCommand(); });

renderHistory();

/* ===========================
FUNCIONES DE PANEL
=========================== */
async function runCommand() {
  const text = input.value.trim();
  if(!text) return;

  let result = await aiAssistant(text);
  input.value = "";

  // Historial
  const history = JSON.parse(localStorage.getItem("aiHistory") || "[]");
  history.push({ command: text, module: result });
  localStorage.setItem("aiHistory", JSON.stringify(history));

  renderHistory();

  // Acciones especiales
  const cmd = text.toLowerCase();
  if(cmd.includes("abrir inventario")) inventario(document.getElementById("appContainer"));
  if(cmd.includes("abrir ordenes") || cmd.includes("crear orden")) ordenes(document.getElementById("appContainer"));

  // Voz
  hablar(result);
}

function renderHistory() {
  const container = document.getElementById("aiHistory");
  if(!container) return;

  const history = JSON.parse(localStorage.getItem("aiHistory") || "[]");
  if(!history.length){
    container.innerHTML = "<p>Sin comandos aún</p>";
    return;
  }

  container.innerHTML = history
    .slice()
    .reverse()
    .map(item => `
      <div style="padding:8px;border-bottom:1px solid #1e293b;font-size:14px;">
        🧠 ${item.command}<br>
        <span style="color:#38bdf8">→ ${item.module}</span>
      </div>
    `)
    .join("");
}

/* ===========================
FUNCIÓN DE VOZ UNIFICADA
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