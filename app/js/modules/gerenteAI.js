/**
 * gerenteAI.js
 * 🧠 IA GERENTE TOTAL PRO360 v1.0
 * Módulo global de análisis de negocio
 * Conecta con todas las AI existentes en /app/js/ai/
 */

import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { analizarNegocio } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

const db = window.db;

export default async function gerenteAIModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;">❌ Empresa no definida</h2>`;
    return;
  }

  container.innerHTML = renderBaseUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  // ==================================
  // BOTÓN ANALIZAR NEGOCIO
  // ==================================
  btnAnalizar.onclick = async () => {
    setLoading(resultado);

    try {
      const data = await obtenerDatosGlobal(state.empresaId);

      if (!data.ordenes.length) {
        resultado.innerHTML = renderEmpty();
        return;
      }

      const resumenKPIs = calcularKPIs(data.ordenes);

      // Conectar con AI sugerencias y análisis global
      let sugerencias = [];
      try {
        const res = await generarSugerencias({ ordenes: data.ordenes, inventario: data.inventario, empresaId: state.empresaId });
        sugerencias = res?.sugerencias || [];
      } catch (e) { console.warn("⚠️ Error AI sugerencias:", e); }

      let dataIA = { alertas: [], recomendaciones: [] };
      try {
        dataIA = await analizarNegocio({ empresaId: state.empresaId });
      } catch(e) { console.warn("⚠️ Error IA analizarNegocio:", e); }

      renderResultado(resultado, resumenKPIs, dataIA, sugerencias);

    } catch (e) {
      console.error("❌ Error gerenteAI:", e);
      resultado.innerHTML = renderError(e);
    }
  };

  // ==================================
  // BOTÓN VOZ
  // ==================================
  btnVoz.onclick = () => {
    try {
      const texto = resultado.innerText || "No hay datos para leer";
      hablar(texto);
    } catch (e) {
      console.warn("⚠️ Voz no disponible", e);
    }
  };
}

// ==================================
// OBTENER DATOS GLOBAL DEL NEGOCIO
// ==================================
async function obtenerDatosGlobal(empresaId) {
  const base = `empresas/${empresaId}`;

  const [ordenesSnap, invSnap] = await Promise.all([
    getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn","desc"))),
    getDocs(query(collection(db, `${base}/repuestos`), orderBy("creadoEn","desc")))
  ]);

  const ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const inventario = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filtrar solo órdenes activas/aprobadas/cerradas
  const filtroActivo = ["aprobada","cerrada"];
  return {
    ordenes: ordenes.filter(o => filtroActivo.includes(o.estado)),
    inventario
  };
}

// ==================================
// KPIs GENERALES
// ==================================
function calcularKPIs(ordenes) {
  const ingresos = ordenes.reduce((a,o) => a + Number(o.total || o.valorTrabajo || 0), 0);
  const costos = ordenes.reduce((a,o) => a + Number(o.costoTotal || 0), 0);
  const utilidad = ingresos - costos;
  const ordenesCount = ordenes.length;
  const ticketPromedio = ordenesCount ? ingresos / ordenesCount : 0;
  const margen = ingresos ? (utilidad/ingresos)*100 : 0;

  return { ingresos, costos, utilidad, margen, ordenes: ordenesCount, ticketPromedio };
}

// ==================================
// UI BASE
// ==================================
function renderBaseUI() {
  return `
    <h1 style="color:#00ffcc;">🧠 Gerente AI PRO360</h1>
    <div style="margin-bottom:15px;">
      <button id="analizar" style="padding:10px 15px;margin-right:10px;">🚀 Analizar Negocio</button>
      <button id="voz" style="padding:10px 15px;">🎤 Escuchar</button>
    </div>
    <div id="resultado" style="margin-top:20px;background:#111827;padding:15px;border-radius:10px;color:#0ff;font-family:sans-serif;"></div>
  `;
}

// ==================================
// RENDER RESULTADO GLOBAL
// ==================================
function renderResultado(el, kpis, dataIA, sugerencias) {

  el.innerHTML = `
    <h2>📊 KPIs Generales</h2>
    ${card("Ingresos", kpis.ingresos)}
    ${card("Costos", kpis.costos)}
    ${card("Utilidad", kpis.utilidad)}
    ${card("Margen", kpis.margen.toFixed(2)+"%")}
    ${card("Órdenes", kpis.ordenes)}
    ${card("Ticket Promedio", kpis.ticketPromedio)}

    <h2>⚠️ Alertas Inteligentes</h2>
    ${list(dataIA.alertas)}

    <h2>💡 Recomendaciones IA</h2>
    ${list(dataIA.recomendaciones)}

    <h2>🚀 Sugerencias Accionables</h2>
    ${list(sugerencias.map(s=>`${s.tipo}: ${s.mensaje} (${s.impacto})`))}
  `;
}

// ==================================
// UTILS
// ==================================
function card(t,v){ return `<div style="margin:5px 0;"><strong>${t}:</strong> ${v}</div>`; }
function list(arr){ return arr && arr.length ? arr.map(i=>`• ${i}`).join("<br>") : "Sin datos"; }
function setLoading(el){ el.innerHTML = "🤖 Analizando negocio..."; }
function renderEmpty(){ return "⚠️ No hay órdenes aprobadas aún"; }
function renderError(e){ return `❌ ${e.message}`; }