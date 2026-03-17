/**
================================================
CEO-AI.JS - Módulo IA Gerente / CEO
TallerPRO360 - Nivel Tesla · Última generación
================================================
*/

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";

export default async function CEOAIModule(container, state) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;color:#0ff;text-shadow:0 0 8px #0ff;">🧠 IA Gerente - PRO360</h1>

    <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
      <button id="analizar" style="padding:10px 20px;background:#16a34a;border:none;color:white;border-radius:6px;cursor:pointer;">🚀 Analizar negocio</button>
      <button id="voz" style="padding:10px 20px;background:#0ff;border:none;color:#000;border-radius:6px;cursor:pointer;">🎤 Resumen por voz</button>
    </div>

    <div id="resultado" style="background:#111827;color:white;padding:15px;border-radius:10px;min-height:150px;"></div>
  `;

  const resultado = document.getElementById("resultado");

  async function obtenerDatos() {
    // 🔹 Traer órdenes
    const ordenesSnap = await getDocs(
      query(collection(window.db, "ordenes"), where("empresaId", "==", state.empresaId))
    );
    const ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 🔹 Traer inventario
    const invSnap = await getDocs(
      query(collection(window.db, "repuestos"), where("empresaId", "==", state.empresaId))
    );
    const inventario = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { ordenes, inventario };
  }

  document.getElementById("analizar").onclick = async () => {
    resultado.innerHTML = "🔄 Analizando negocio con IA...";

    try {
      const { ordenes, inventario } = await obtenerDatos();

      // 🔹 Generar alertas y sugerencias
      const { sugerencias, resumen } = await generarSugerencias({ ordenes, inventario, empresaId: state.empresaId });

      // 🔹 Analizar negocio completo con IA
      const data = await analizarNegocio({ ordenes, inventario, empresaId: state.empresaId, resumen, sugerencias });

      // 🗣 Resumen por voz
      hablarResumen(data);

      // 💻 Mostrar datos en pantalla
      resultado.innerHTML = `
        <h3 style="color:#00ffcc;">📊 Resumen Financiero</h3>
        <p><b>Ingresos:</b> $${Number(data.resumen.ingresos || 0).toLocaleString()}</p>
        <p><b>Utilidad:</b> $${Number(data.resumen.utilidad || 0).toLocaleString()}</p>
        <p><b>Margen:</b> ${Number(data.resumen.margen || 0).toFixed(2)}%</p>

        <h3 style="color:#ffcc00;">🚨 Alertas</h3>
        ${data.alertas && data.alertas.length > 0 
          ? data.alertas.map(a => `<div style="margin-bottom:5px;">⚠️ ${a}</div>`).join("") 
          : "<p>✅ Sin alertas</p>"
        }

        <h3 style="color:#00ffff;">💡 Recomendaciones</h3>
        ${data.recomendaciones && data.recomendaciones.length > 0 
          ? data.recomendaciones.map(r => `<div style="margin-bottom:5px;">💡 ${r}</div>`).join("") 
          : "<p>✅ Sin recomendaciones por el momento</p>"
        }

        <h3 style="color:#00ff99;">📊 Sugerencias Inteligentes</h3>
        ${sugerencias.map(s => `<div style="margin-bottom:5px;color:#0ff;">${s}</div>`).join("")}
      `;
    } catch (e) {
      console.error("Error IA Gerente:", e);
      resultado.innerHTML = "❌ Error ejecutando IA";
    }
  };

  document.getElementById("voz").onclick = () => {
    // Solo lectura del resultado por voz
    import("../voice/voiceCore.js").then(({ hablar }) => {
      const texto = resultado.innerText || "No hay datos aún";
      hablar(texto);
    });
  };
}