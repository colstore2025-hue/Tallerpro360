/**
 * gerenteAI.js
 * 🧠 Gerente AI PRO360
 * Módulo visible en la app/js/modules
 */

import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";

const db = window.db;

export default async function gerenteAI(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = "❌ Empresa no definida";
    return;
  }

  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  btnAnalizar.onclick = async () => {
    setLoading(resultado);

    try {
      // Cargar datos reales
      const [ordenesSnap, repuestosSnap] = await Promise.all([
        getDocs(query(collection(db, `empresas/${state.empresaId}/ordenes`), orderBy("creadoEn", "desc"))),
        getDocs(query(collection(db, `empresas/${state.empresaId}/repuestos`), orderBy("creadoEn", "desc")))
      ]);

      const ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                                    .filter(o => o.estado === "aprobada" || o.estado === "cerrada");

      const inventario = repuestosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!ordenes.length) {
        resultado.innerHTML = "⚠️ No hay órdenes aprobadas aún";
        return;
      }

      // 🔹 KPIs
      const kpis = calcularKPIs(ordenes);

      // 🔹 Sugerencias IA
      let sugerencias = [];
      try {
        const res = await generarSugerencias({ ordenes, inventario, empresaId: state.empresaId });
        sugerencias = res?.sugerencias || [];
      } catch(e) {
        console.warn("⚠️ Error IA sugerencias:", e);
      }

      // 🔹 Análisis gerente IA
      const data = await analizarNegocio({ empresaId: state.empresaId });

      // Render completo
      renderResultado(resultado, kpis, data, sugerencias);

      // 🔹 Voz
      try {
        hablarResumen(data);
      } catch(e) {}

    } catch(e) {
      console.error("❌ Error Gerente AI:", e);
      resultado.innerHTML = `❌ Error cargando datos: ${e.message}`;
    }
  };

  btnVoz.onclick = async () => {
    try {
      const { hablar } = await import("../voice/voiceCore.js");
      hablar(resultado.innerText || "No hay datos");
    } catch(e) {
      console.warn("⚠️ Voz no disponible:", e);
    }
  };
}

/* ================= UI ================= */
function renderUI() {
  return `
    <h1 style="color:#00ffff;">🧠 Gerente AI PRO360</h1>
    <button id="analizar">🚀 Analizar Negocio</button>
    <button id="voz">🎤 Escuchar Resumen</button>
    <div id="resultado" style="margin-top:20px;"></div>
  `;
}

function setLoading(el){
  el.innerHTML = "🤖 Analizando negocio...";
}

/* ================= KPIs ================= */
function calcularKPIs(ordenes){
  const ingresos = ordenes.reduce((a,o)=>a + Number(o.valorTrabajo || 0),0);
  const costos = ordenes.reduce((a,o)=>a + Number(o.costoTotal || 0),0);
  const utilidad = ingresos - costos;
  const ticketPromedio = ordenes.length ? ingresos / ordenes.length : 0;
  const margen = ingresos ? (utilidad / ingresos) * 100 : 0;
  return { ingresos, costos, utilidad, ordenes: ordenes.length, ticketPromedio, margen };
}

/* ================= RENDER ================= */
function renderResultado(el, kpis, data, sugerencias){
  el.innerHTML = `
    <h2>📊 KPIs</h2>
    ${card("Ingresos", kpis.ingresos)}
    ${card("Costos", kpis.costos)}
    ${card("Utilidad", kpis.utilidad)}
    ${card("Margen", kpis.margen.toFixed(2)+"%")}
    ${card("Órdenes", kpis.ordenes)}
    ${card("Ticket Promedio", kpis.ticketPromedio)}

    <h2>🚨 Alertas</h2>
    ${list(data?.alertas)}

    <h2>💡 Recomendaciones IA</h2>
    ${list(data?.recomendaciones)}

    <h2>🤖 Sugerencias Accionables</h2>
    ${sugerencias.length ? sugerencias.map(s=>`• ${s.mensaje} (${s.impacto})`).join("<br>") : "Sin sugerencias"}
  `;
}

function card(t,v){ return `<div style="margin:8px 0;"><strong>${t}:</strong> $${v}</div>`; }
function list(arr){ if(!arr || !arr.length) return "Sin datos"; return arr.map(i=>`• ${i}`).join("<br>"); }