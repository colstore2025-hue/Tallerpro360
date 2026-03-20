/**
 * aiCommand.js
 * AI Command Center PRO360 · FIX TOTAL
 */

import AICommandCenter from "../ai/aiCommandCenter.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

const ai = new AICommandCenter();

/* ===========================
MODULE
=========================== */
export function aiCommand(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = "❌ empresaId no definido";
    return;
  }

  container.innerHTML = `
    <h1 style="font-size:26px;margin-bottom:20px;">🤖 AI Command Center</h1>

    <div class="card">
      <p style="color:#94a3b8;">Controla el ERP con comandos.</p>

      <input id="aiInput" placeholder="Ej: ver inventario"
        style="width:100%;padding:12px;margin-top:10px;border-radius:8px;background:#020617;color:white;" />

      <button id="aiRun" style="margin-top:10px;">Ejecutar</button>
    </div>

    <div class="card" style="margin-top:15px;">
      <h3>💡 Sugerencias IA</h3>
      <div id="aiSugerencias">Cargando...</div>
      <button id="refrescarSugerencias">🔄 Actualizar</button>
    </div>

    <div class="card" style="margin-top:15px;">
      <h3>Historial</h3>
      <div id="aiHistory"></div>
    </div>

    <div id="aiResponse" style="margin-top:20px;"></div>
  `;

  initAICommand(state);
}

/* ===========================
INIT
=========================== */
async function initAICommand(state) {

  const input = document.getElementById("aiInput");
  const btn = document.getElementById("aiRun");
  const btnRefrescar = document.getElementById("refrescarSugerencias");

  btn.onclick = runCommand;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") runCommand();
  });

  btnRefrescar.onclick = () => cargarSugerencias(state);

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
    response.innerHTML = `<div>❌ Comando no reconocido</div>`;
    hablar("Comando no reconocido");
    return;
  }

  response.innerHTML = `<div>🧠 Ejecutando...</div>`;

  ai.execute(text);
  hablar(`Ejecutando ${text}`);

  renderHistory();
}

/* ===========================
HISTORIAL
=========================== */
function renderHistory() {

  const container = document.getElementById("aiHistory");
  if (!container) return;

  const history = AICommandCenter.getHistory();

  if (!history.length) {
    container.innerHTML = "Sin comandos aún";
    return;
  }

  container.innerHTML = history
    .slice().reverse()
    .map(item => `
      <div style="padding:8px;border-bottom:1px solid #1e293b;">
        🧠 ${item.command}<br>
        <span style="color:#38bdf8">${item.module || "no reconocido"}</span>
      </div>
    `).join("");
}

/* ===========================
SUGERENCIAS IA REALES
=========================== */
async function cargarSugerencias(state) {

  const container = document.getElementById("aiSugerencias");
  container.innerHTML = "Cargando IA...";

  const base = `empresas/${state.empresaId}`;

  try {

    const [ordenesSnap, invSnap] = await Promise.all([

      getDocs(query(
        collection(db, `${base}/ordenes`),
        orderBy("creadoEn", "desc")
      )),

      getDocs(query(
        collection(db, `${base}/repuestos`),
        orderBy("creadoEn", "desc")
      ))

    ]);

    const ordenes = ordenesSnap.docs.map(d => d.data());
    const inventario = invSnap.docs.map(d => d.data());

    const data = await generarSugerencias({
      ordenes,
      inventario,
      empresaId: state.empresaId
    });

    renderSugerencias("aiSugerencias", data);

  } catch (e) {

    console.error("❌ Error IA:", e);

    container.innerHTML = "❌ Error cargando sugerencias";
  }
}

/* ===========================
VOZ
=========================== */
function hablar(texto){
  if (!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  window.speechSynthesis.speak(speech);
}