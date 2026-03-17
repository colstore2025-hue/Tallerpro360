/**
 * aiAssistant.js
 * Asistente Inteligente para TallerPRO360
 * Nivel Tesla · Última generación
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { generarResumenOrdenes, generarSugerencias } from "./aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

export default async function aiAssistantModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">🤖 Asistente IA PRO360</h1>

    <div style="margin-bottom:10px;">
      <textarea id="consultaIA" placeholder="Pregunta al asistente..." style="width:100%; height:80px;"></textarea>
      <button id="consultarIA" style="background:#0ff; color:#000; font-weight:bold; padding:10px 15px; border:none; border-radius:6px;">💬 Consultar IA</button>
      <button id="vozIA" style="background:#16a34a; color:#fff; font-weight:bold; padding:10px 15px; border:none; border-radius:6px; margin-left:5px;">🎤 Voz</button>
    </div>

    <div id="respuestaIA" style="background:#111; padding:15px; border-radius:10px; color:#0ff; min-height:80px;"></div>
  `;

  const consultaInput = document.getElementById("consultaIA");
  const respuestaDiv = document.getElementById("respuestaIA");

  // ➡️ Consultar IA con texto
  document.getElementById("consultarIA").onclick = async () => {
    const pregunta = consultaInput.value.trim();
    if (!pregunta) return;

    respuestaDiv.innerHTML = "Procesando...";

    try {
      const sugerencias = await generarSugerencias({ pregunta, empresaId: state.empresaId });
      const resumen = await generarResumenOrdenes(state.empresaId);

      // Combinar datos y recomendaciones
      const respuesta = `
        <p>🧾 Resumen órdenes: Ingresos: $${resumen.ingresos}, Utilidad: $${resumen.utilidad}, Órdenes abiertas: ${resumen.ordenesAbiertas}</p>
        <p>💡 Recomendaciones IA:</p>
        <ul>${sugerencias.map(s => `<li>${s}</li>`).join("")}</ul>
      `;

      respuestaDiv.innerHTML = respuesta;
      hablar("✅ Aquí están los datos y recomendaciones de tu asistente IA");
    } catch (e) {
      console.error(e);
      respuestaDiv.innerHTML = `<p style="color:red;">❌ Error generando respuesta IA</p>`;
      hablar("❌ Hubo un error procesando tu solicitud");
    }
  };

  // ➡️ Consultar IA por voz
  document.getElementById("vozIA").onclick = () => {
    import("./voice/voiceCore.js").then(({ iniciarVoz }) => {
      iniciarVoz(async (texto) => {
        consultaInput.value = texto;
        document.getElementById("consultarIA").click();
      });
    });
  };
}