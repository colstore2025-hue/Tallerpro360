/**
 * aiAdvisor.js
 * 🧠 IA Advisor GLOBAL - TallerPRO360
 */

import autonomousWorkshopAI from "./autonomousWorkshopAI.js";
import { analizarNegocio } from "./aiManager.js";
import { generarSugerencias, renderSugerencias } from "./aiAdvisor.js";


/* =========================================
GENERAR SUGERENCIAS POR CONTEXTO
========================================= */
export async function generarSugerencias(contexto = {}) {

  try {

const sugerencias = await generarSugerencias({
  ordenes: [orden]
});

renderSugerencias("aiResultado", sugerencias);
    

    // 🧠 IA GERENTE
    const negocio = await analizarNegocio();

    if (negocio?.alertas?.length) {
      negocio.alertas.forEach(a => {
        sugerencias.push({
          tipo: "gerencial",
          mensaje: a,
          accion: "revisar_finanzas"
        });
      });
    }

    // 🤖 IA AUTÓNOMA (solo sugerencias)
    const auto = await autonomousWorkshopAI.analyzeWorkshop(contexto);

    if (auto?.insights?.length) {
      auto.insights.forEach(i => {
        sugerencias.push({
          tipo: i.type,
          mensaje: i.message,
          prioridad: i.priority,
          data: i.data || null
        });
      });
    }

    return sugerencias;

  } catch (e) {
    console.error("Error AI Advisor:", e);
    return [];
  }
}

/* =========================================
RENDER UI UNIVERSAL
========================================= */
export function renderSugerencias(containerId, sugerencias = []) {

  const container = document.getElementById(containerId);
  if (!container) return;

  if (!sugerencias.length) {
    container.innerHTML = `<div>✅ Sin sugerencias</div>`;
    return;
  }

  container.innerHTML = `
    <div style="background:#020617;padding:15px;border-radius:12px;">
      <h3>🤖 Sugerencias IA</h3>

      ${sugerencias.map((s, i) => `
        <div style="margin:10px 0;padding:10px;background:#111;border-radius:8px;">
          <p>${s.mensaje}</p>

          <button onclick="window.aplicarSug(${i})">✔ Aplicar</button>
          <button onclick="window.editarSug(${i})">✏ Editar</button>
          <button onclick="window.descartarSug(${i})">❌ Ignorar</button>
        </div>
      `).join("")}
    </div>
  `;

  // acciones globales (luego las mejoramos con persistencia)
  window.aplicarSug = (i) => {
    alert("Aplicada (aquí conectas lógica real)");
  };

  window.editarSug = (i) => {
    alert("Editar sugerencia");
  };

  window.descartarSug = (i) => {
    alert("Sugerencia ignorada");
  };
}