/**
================================================
CEO-AI.JS - Módulo IA Gerente / CEO
TallerPRO360 - Última generación
================================================
*/

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

export default async function (container, state) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">🧠 IA Gerente - TallerPRO360</h1>

    <div style="margin-bottom:20px;">
      <button id="analizar" style="padding:10px 20px;background:#16a34a;border:none;color:white;border-radius:6px;cursor:pointer;">🚀 Analizar negocio</button>
    </div>

    <div id="resultado" style="background:#111827;color:white;padding:15px;border-radius:10px;"></div>
  `;

  const resultado = document.getElementById("resultado");

  document.getElementById("analizar").onclick = async () => {

    resultado.innerHTML = "🔄 Analizando negocio con IA...";

    try {
      const data = await analizarNegocio(state);

      if (!data) {
        resultado.innerHTML = "❌ Error al procesar IA";
        return;
      }

      // 🗣 Resumen por voz
      hablarResumen(data);

      // 💻 Mostrar datos en pantalla
      resultado.innerHTML = `
        <h3>📊 Resumen Financiero</h3>
        <p><b>Ingresos:</b> $${Number(data.resumen.ingresos || 0).toLocaleString()}</p>
        <p><b>Utilidad:</b> $${Number(data.resumen.utilidad || 0).toLocaleString()}</p>
        <p><b>Margen:</b> ${Number(data.resumen.margen || 0).toFixed(2)}%</p>

        <h3>🚨 Alertas</h3>
        ${data.alertas && data.alertas.length > 0 
          ? data.alertas.map(a => `<div style="margin-bottom:5px;">⚠️ ${a}</div>`).join("") 
          : "<p>✅ Sin alertas</p>"
        }

        <h3>💡 Recomendaciones</h3>
        ${data.recomendaciones && data.recomendaciones.length > 0 
          ? data.recomendaciones.map(r => `<div style="margin-bottom:5px;">💡 ${r}</div>`).join("") 
          : "<p>✅ Sin recomendaciones por el momento</p>"
        }
      `;
    } catch (e) {
      console.error("Error IA Gerente:", e);
      resultado.innerHTML = "❌ Error ejecutando IA";
    }
  };
}