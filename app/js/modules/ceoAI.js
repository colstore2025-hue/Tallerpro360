/**
================================================
CEO-AI.JS - Módulo IA Gerente / CEO
Ruta: /app/js/modules/ceoAI.js
TallerPRO360 - Nivel Tesla PRO360 ULTRA
================================================
*/

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function CEOAIModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `
      <div style="color:#ef4444;">
        ❌ Error: empresaId no definido
      </div>
    `;
    return;
  }

  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  DATA
  ========================= */
  async function obtenerDatos() {

    const [ordenesSnap, invSnap] = await Promise.all([

      getDocs(
        query(
          collection(window.db, "ordenes"),
          where("empresaId", "==", state.empresaId)
        )
      ),

      getDocs(
        query(
          collection(window.db, "repuestos"),
          where("empresaId", "==", state.empresaId)
        )
      )

    ]);

    return {
      ordenes: ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      inventario: invSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  }

  /* =========================
  ANALIZAR IA
  ========================= */
  btnAnalizar.onclick = async () => {

    setLoading(resultado);

    try {

      const { ordenes, inventario } = await obtenerDatos();

      if (!ordenes.length) {
        resultado.innerHTML = renderEmpty();
        return;
      }

      const { sugerencias, resumen } =
        await generarSugerencias({
          ordenes,
          inventario,
          empresaId: state.empresaId
        });

      const data = await analizarNegocio({
        ordenes,
        inventario,
        empresaId: state.empresaId,
        resumen,
        sugerencias
      });

      renderResultado(resultado, data, sugerencias);

      // 🔊 Voz automática estilo Tesla
      hablarResumen(data);

    } catch (error) {

      console.error("CEO AI Error:", error);

      resultado.innerHTML = renderError(error);

    }
  };

  /* =========================
  VOZ
  ========================= */
  btnVoz.onclick = async () => {

    try {
      const { hablar } = await import("../voice/voiceCore.js");
      const texto = resultado.innerText || "No hay datos aún";
      hablar(texto);
    } catch (e) {
      console.warn("Voice error:", e);
    }

  };
}

/* =====================================================
UI
===================================================== */

function renderUI() {
  return `
    <div style="font-family:Inter,sans-serif; color:#e5e7eb;">

      <h1 style="font-size:28px;font-weight:800;color:#00ffff;margin-bottom:20px;">
        🧠 CEO AI · TallerPRO360
      </h1>

      <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
        
        <button id="analizar" style="${btn('#16a34a')}">
          🚀 Analizar Empresa
        </button>

        <button id="voz" style="${btn('#06b6d4','#000')}">
          🎤 Escuchar
        </button>

      </div>

      <div id="resultado" style="
        background:#020617;
        border:1px solid #1e293b;
        padding:20px;
        border-radius:12px;
        min-height:180px;
      ">
        <p style="color:#64748b;">Ejecuta el análisis para ver resultados...</p>
      </div>

    </div>
  `;
}

function btn(bg, color="#fff") {
  return `
    padding:10px 18px;
    background:${bg};
    color:${color};
    border:none;
    border-radius:8px;
    font-weight:600;
    cursor:pointer;
  `;
}

/* =====================================================
RENDER STATES
===================================================== */

function setLoading(el) {
  el.innerHTML = `🤖 Analizando con IA...`;
}

function renderEmpty() {
  return `⚠️ No hay datos suficientes para análisis`;
}

function renderError(e) {
  return `
    <div style="color:#ef4444;">
      ❌ Error IA<br/>
      <small>${e.message}</small>
    </div>
  `;
}

/* =====================================================
RESULTADO
===================================================== */

function renderResultado(el, data, sugerencias) {

  el.innerHTML = `

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">

      ${card("Ingresos", format(data.resumen.ingresos), "#10b981")}
      ${card("Utilidad", format(data.resumen.utilidad), "#facc15")}
      ${card("Margen", data.resumen.margen.toFixed(2)+"%", "#38bdf8")}

    </div>

    <h3 style="color:#f87171;">🚨 Alertas</h3>
    ${list(data.alertas, "Sin alertas")}

    <h3 style="color:#22d3ee;margin-top:10px;">💡 Recomendaciones</h3>
    ${list(data.recomendaciones, "Sin recomendaciones")}

    <h3 style="color:#4ade80;margin-top:10px;">📊 Sugerencias</h3>
    ${list(sugerencias)}

  `;
}

function card(title, value, color) {
  return `
    <div style="background:#111827;padding:12px;border-radius:10px;">
      <div style="font-size:12px;color:#9ca3af;">${title}</div>
      <div style="font-size:20px;font-weight:800;color:${color};">${value}</div>
    </div>
  `;
}

function list(arr, empty="") {
  if (!arr || arr.length === 0) {
    return `<p style="color:#64748b;">${empty}</p>`;
  }

  return arr.map(i => `<div>• ${i}</div>`).join("");
}

function format(num) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP"
  }).format(num || 0);
}