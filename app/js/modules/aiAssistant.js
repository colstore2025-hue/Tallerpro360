/**
 * aiAssistant.js
 * Asistente Inteligente para TallerPRO360
 * Nivel Tesla · Última generación
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { generarResumenOrdenes, generarSugerencias } from "./aiAdvisor.js";
import { hablar, iniciarVoz } from "../voice/voiceCore.js";

export default async function aiAssistantModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">🤖 Asistente IA PRO360</h1>

    <div style="margin-bottom:10px;">
      <textarea id="consultaIA" placeholder="Pregunta al asistente..." style="width:100%; height:80px; background:#111; color:#0ff; padding:10px; border-radius:8px; border:none;"></textarea>
      <div style="margin-top:8px;">
        <button id="consultarIA" style="background:#0ff; color:#000; font-weight:bold; padding:10px 15px; border:none; border-radius:6px;">💬 Consultar IA</button>
        <button id="vozIA" style="background:#16a34a; color:#fff; font-weight:bold; padding:10px 15px; border:none; border-radius:6px; margin-left:5px;">🎤 Voz</button>
        <button id="limpiarChat" style="background:#ff0044; color:#fff; font-weight:bold; padding:10px 15px; border:none; border-radius:6px; margin-left:5px;">🧹 Limpiar</button>
      </div>
    </div>

    <div id="respuestaIA" style="background:#111; padding:15px; border-radius:10px; color:#0ff; min-height:150px; max-height:400px; overflow-y:auto; font-family:monospace;"></div>
  `;

  const consultaInput = document.getElementById("consultaIA");
  const respuestaDiv = document.getElementById("respuestaIA");

  // 📝 Historial de chat temporal
  let historialChat = [];

  // ➡️ Función principal para procesar consultas
  async function procesarConsulta(pregunta) {
    if (!pregunta) return;
    respuestaDiv.innerHTML += `<p style="color:#ff0;">> ${pregunta}</p>`;
    
    try {
      // 🔹 Obtener resumen del taller
      const resumen = await generarResumenOrdenes(state.empresaId);
      
      // 🔹 Generar sugerencias contextuales
      const sugerenciasData = await generarSugerencias({ ordenes: resumen.ordenes, inventario: resumen.inventario, empresaId: state.empresaId });
      const sugerencias = sugerenciasData.sugerencias || [];

      // 🔹 Combinar información en respuesta enriquecida
      const respuesta = `
        <p>🧾 Resumen órdenes:</p>
        <ul>
          <li>Ingresos: $${formatear(resumen.ingresos)}</li>
          <li>Utilidad: $${formatear(resumen.utilidad)}</li>
          <li>Órdenes abiertas: ${resumen.ordenesAbiertas}</li>
        </ul>
        <p>💡 Sugerencias IA:</p>
        <ul>${sugerencias.map(s => `<li>${s}</li>`).join("")}</ul>
      `;

      historialChat.push({ pregunta, respuesta });
      respuestaDiv.innerHTML += respuesta;
      respuestaDiv.scrollTop = respuestaDiv.scrollHeight;

      // 🔊 Voz
      hablar(`Aquí están las recomendaciones y el resumen solicitado`);

    } catch (e) {
      console.error(e);
      respuestaDiv.innerHTML += `<p style="color:red;">❌ Error procesando la IA</p>`;
      hablar("❌ Hubo un error procesando tu solicitud");
    }
  }

  // 💬 Consultar IA mediante texto
  document.getElementById("consultarIA").onclick = async () => {
    const pregunta = consultaInput.value.trim();
    consultaInput.value = "";
    await procesarConsulta(pregunta);
  };

  // 🎤 Consultar IA mediante voz
  document.getElementById("vozIA").onclick = () => {
    iniciarVoz(async (texto) => {
      consultaInput.value = texto;
      await procesarConsulta(texto);
    });
  };

  // 🧹 Limpiar chat
  document.getElementById("limpiarChat").onclick = () => {
    historialChat = [];
    respuestaDiv.innerHTML = "";
  };
}

// 💰 Formatear dinero
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}