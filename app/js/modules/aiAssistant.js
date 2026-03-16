/*
================================================
AIASSISTANT.JS - Versión Final
Panel del asistente IA - TallerPRO360 ERP
Ubicación: /app/js/modules/aiAssistant.js
================================================
*/

import AICommandCenter from "../ai/aiCommandCenter.js"; // Motor IA de comandos
import { actualizarStock } from "./inventario.js"; // Integración con inventario
import { cargarOrdenes } from "./ordenes.js"; // Integración con órdenes

// Función principal para inicializar el asistente IA
export async function aiAssistant(pregunta){
  if(!pregunta) return "No se proporcionó consulta";

  try {
    const respuesta = await AICommandCenter.execute(pregunta);

    // Opciones de integración automática
    if(respuesta?.acciones){
      if(respuesta.acciones.includes("crear_orden")){
        // Aquí se puede crear la orden en Firestore automáticamente
        // usando los datos que provengan de la IA
        // ejemplo: actualizarStock o cargarOrdenes
        await actualizarStock(respuesta.repuestos || "");
        await cargarOrdenes();
      }
    }

    return respuesta?.mensaje || "IA procesó la consulta correctamente";
  } catch(e){
    console.error("Error en aiAssistant:", e);
    return "❌ Error procesando la consulta";
  }
}

// ===========================
// Inicializar UI del asistente IA
// ===========================
export async function aiassistant(container){

  container.innerHTML = `
  <div class="card">
    <h2>🤖 Asistente IA</h2>
    <p>Consulta sobre órdenes, inventario o diagnósticos.</p>
    <input id="aiCommandInput" placeholder="Ej: generar orden para cliente X" style="width:100%;padding:12px;margin-top:10px;background:#020617;border:1px solid #1e293b;color:white;border-radius:8px;">
    <button id="aiRunBtn" style="margin-top:10px;padding:10px 16px;background:#16a34a;border:none;border-radius:8px;color:white;cursor:pointer;">Ejecutar</button>
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
function initAI(){
  const input = document.getElementById("aiCommandInput");
  const btn = document.getElementById("aiRunBtn");

  btn.onclick = runCommand;
  input.addEventListener("keydown",(e)=>{
    if(e.key==="Enter") runCommand();
  });

  renderHistory();
}

/* ===========================
EJECUTAR COMANDO
=========================== */
async function runCommand(){
  const input = document.getElementById("aiCommandInput");
  const text = input.value.trim();
  if(!text) return;

  const respuesta = await aiAssistant(text);

  input.value = "";

  // Actualizar historial
  const container = document.getElementById("aiHistory");
  const div = document.createElement("div");
  div.style.padding = "8px";
  div.style.borderBottom = "1px solid #1e293b";
  div.style.fontSize = "14px";
  div.innerHTML = `<b>🧠 Consulta:</b> ${text}<br><span style="color:#38bdf8">→ ${respuesta}</span>`;
  container.prepend(div);

  hablar(respuesta);
}

/* ===========================
FUNCIÓN DE SÍNTESIS DE VOZ
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

/* ===========================
INTEGRACIÓN AVANZADA
=========================== */
// Permite que otros módulos puedan enviar preguntas directamente a la IA
window.aiAssistant = aiAssistant;