/**
================================================
CEOAI.JS - PRO360 GOD CORE 👑🧠 FINAL
Ubicación: /app/js/modules/ceoAI.js
================================================
*/

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";
import { analizarEmpresaAvanzado } from "../ai/ceoIntelligence.js";

const db = window.db;

export default async function CEOAIModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = renderError("❌ empresaId no definido");
    return;
  }

  const base = `empresas/${state.empresaId}`;
  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  DATA REAL
  ========================= */
  async function obtenerDatos() {

    try {

      const [ordenesSnap, invSnap] = await Promise.all([
        getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "desc"))),
        getDocs(query(collection(db, `${base}/repuestos`), orderBy("creadoEn", "desc")))
      ]);

      let ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      let inventario = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      ordenes = ordenes.filter(o =>
        o.estado === "aprobada" || o.estado === "cerrada"
      );

      return { ordenes, inventario };

    } catch (e) {
      console.error("❌ Error datos CEO:", e);
      return { ordenes: [], inventario: [] };
    }
  }

  /* =========================
  KPIs
  ========================= */
  function calcularKPIs(ordenes) {

    const ingresos = ordenes.reduce((a,o)=>a + Number(o.total || 0),0);
    const costos = ordenes.reduce((a,o)=>a + Number(o.costoTotal || 0),0);
    const utilidad = ingresos - costos;

    const count = ordenes.length;

    return {
      ingresos,
      utilidad,
      margen: ingresos ? (utilidad / ingresos) * 100 : 0,
      ordenes: count,
      ticketPromedio: count ? ingresos / count : 0
    };
  }

  /* =========================
  ANALIZAR
  ========================= */
  btnAnalizar.onclick = async () => {

    setLoading(resultado);

    try {

      const { ordenes, inventario } = await obtenerDatos();

      if (!ordenes.length) {
        resultado.innerHTML = renderEmpty();
        return;
      }

      const kpis = calcularKPIs(ordenes);

      /* IA SUGERENCIAS */
      let sugerencias = [];
      try {
        const res = await generarSugerencias({
          ordenes,
          inventario,
          empresaId: state.empresaId
        });
        sugerencias = res?.sugerencias || [];
      } catch {}

      /* IA CLÁSICA */
      let data = { alertas: [], recomendaciones: [] };
      try {
        data = await analizarNegocio({
          ordenes,
          inventario,
          empresaId: state.empresaId,
          resumen: kpis,
          sugerencias
        });
      } catch {}

      /* 🧠 IA AVANZADA */
      let analisisPro = {
        riesgo:"medio",
        alertas:[],
        decisiones:[],
        proyecciones:{ proyeccion7dias:0, proyeccion30dias:0 }
      };

      try {
        analisisPro = analizarEmpresaAvanzado({ ordenes, inventario });
      } catch(e){
        console.warn("⚠️ IA avanzada fallback");
      }

      renderResultado(resultado, data, sugerencias, kpis, analisisPro);

      /* VOZ CEO */
      try {
        hablarResumen(`
          Ingresos ${kpis.ingresos}.
          Utilidad ${kpis.utilidad}.
          Riesgo ${analisisPro.riesgo}.
        `);
      } catch {}

    } catch (error) {

      console.error("❌ CEO AI Error:", error);
      resultado.innerHTML = renderError(error.message);

    }
  };

  /* =========================
  VOZ MANUAL
  ========================= */
  btnVoz.onclick = async () => {
    try {
      const { hablar } = await import("../voice/voiceCore.js");
      hablar(resultado.innerText || "Sin datos");
    } catch {}
  };
}

/* =========================
UI POWER BI STYLE
========================= */

function renderUI() {
  return `
    <div style="padding:20px;background:#020617;color:white;">

      <h1 style="color:#00f0ff;font-size:28px;">
        👑 CEO AI PRO360
      </h1>

      <div style="margin:15px 0;">
        <button id="analizar" style="${btnStyle("#00ffcc")}">🚀 Analizar</button>
        <button id="voz" style="${btnStyle("#6366f1")}">🎤 Voz</button>
      </div>

      <div id="resultado"></div>

    </div>
  `;
}

/* =========================
RENDER RESULTADO PRO
========================= */

function renderResultado(el, data, sugerencias, kpis, pro) {

  el.innerHTML = `

    <div style="${cardBox()}">

      <h2>🧠 Estado del negocio</h2>
      <p>Riesgo: <strong style="color:${colorRiesgo(pro.riesgo)}">
        ${pro.riesgo.toUpperCase()}
      </strong></p>

      <h2>📊 KPIs</h2>
      ${kpi("Ingresos", kpis.ingresos)}
      ${kpi("Utilidad", kpis.utilidad)}
      ${kpi("Margen", kpis.margen.toFixed(2)+"%")}
      ${kpi("Órdenes", kpis.ordenes)}
      ${kpi("Ticket", kpis.ticketPromedio)}

      <h2>🔮 Proyección</h2>
      ${kpi("7 días", pro.proyecciones.proyeccion7dias)}
      ${kpi("30 días", pro.proyecciones.proyeccion30dias)}

      <h2>🚨 Alertas</h2>
      ${list(pro.alertas)}

      <h2>⚡ Decisiones CEO</h2>
      ${list(pro.decisiones)}

      <h2>💡 Recomendaciones</h2>
      ${list(data.recomendaciones)}

      <h2>🤖 Sugerencias IA</h2>
      ${list(sugerencias)}

    </div>
  `;
}

/* =========================
COMPONENTES UI
========================= */

function kpi(t,v){
  return `
    <div style="margin:6px 0;">
      <strong>${t}:</strong> ${typeof v === "number" ? money(v) : v}
    </div>
  `;
}

function list(arr){
  if(!arr || !arr.length) return "Sin datos";
  return arr.map(i=>`• ${i}`).join("<br>");
}

function money(v){
  return new Intl.NumberFormat("es-CO",{
    style:"currency",
    currency:"COP"
  }).format(v || 0);
}

function colorRiesgo(r){
  if(r==="alto") return "#ff4d4d";
  if(r==="medio") return "#facc15";
  return "#00ffcc";
}

function btnStyle(color){
  return `
    background:${color};
    border:none;
    padding:10px 15px;
    border-radius:8px;
    margin-right:10px;
    cursor:pointer;
    font-weight:bold;
  `;
}

function cardBox(){
  return `
    background:#0f172a;
    padding:20px;
    border-radius:12px;
    border:1px solid #1e293b;
  `;
}

/* =========================
ESTADOS
========================= */

function setLoading(el){
  el.innerHTML = "🤖 Analizando negocio...";
}

function renderEmpty(){
  return "⚠️ No hay órdenes aún";
}

function renderError(msg){
  return `<div style="color:red;">${msg}</div>`;
}