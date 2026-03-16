/**
 * aiAssistant.js
 * Panel del asistente IA - TallerPRO360 ERP
 * Maneja comandos, historial y consultas inteligentes
 */

import AICommandCenter from "../ai/aiCommandCenter.js";

export async function aiassistant(container) {

  container.innerHTML = `
    <div class="card">
      <h2>🤖 AI Assistant</h2>
      <p>Escribe un comando para controlar el sistema.</p>
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

    <div class="card">
      <h3>Historial IA</h3>
      <div id="aiHistory"></div>
    </div>
  `;

  initAI();
}

/* ===========================
INICIALIZAR PANEL
=========================== */
function initAI() {
  const input = document.getElementById("aiCommandInput");
  const btn = document.getElementById("aiRunBtn");

  btn.onclick = runCommand;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runCommand();
  });

  renderHistory();
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
    .slice()
    .reverse()
    .map(item => `
      <div style="padding:8px;border-bottom:1px solid #1e293b;font-size:14px;">
        🧠 ${item.command}<br>
        <span style="color:#38bdf8">→ ${item.module || "no reconocido"}</span>
      </div>
    `)
    .join("");
}