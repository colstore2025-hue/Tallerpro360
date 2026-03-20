/**
================================================
CEOAI.JS - Módulo IA Gerente PRO360 ULTRA (FIX)
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

const db = window.db;

export default async function CEOAIModule(container, state) {

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `❌ empresaId no definido`;
    return;
  }

  const base = `empresas/${state.empresaId}`;

  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  OBTENER DATA REAL (OK)
  ========================= */
  async function obtenerDatos() {

    try {

      const [ordenesSnap, invSnap] = await Promise.all([

        getDocs(
          query(
            collection(db, `${base}/ordenes`),
            orderBy("creadoEn", "desc")
          )
        ),

        getDocs(
          query(
            collection(db, `${base}/repuestos`),
            orderBy("creadoEn", "desc")
          )
        )

      ]);

      let ordenes = ordenesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      let inventario = invSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      /* 🔥 FILTRO NEGOCIO REAL */
      ordenes = ordenes.filter(o =>
        o.estado === "aprobada" || o.estado === "cerrada"
      );

      return { ordenes, inventario };

    } catch (e) {
      console.error("❌ Error obteniendo datos CEO:", e);
      return { ordenes: [], inventario: [] };
    }
  }

  /* =========================
  KPIs
  ========================= */
  function calcularKPIs(ordenes) {

    const ingresos = ordenes.reduce((a, o) => a + Number(o.total || 0), 0);
    const costos = ordenes.reduce((a, o) => a + Number(o.costoTotal || 0), 0);
    const utilidad = ingresos - costos;

    const ordenesCount = ordenes.length;

    return {
      ingresos,
      utilidad,
      margen: ingresos ? (utilidad / ingresos) * 100 : 0,
      ordenes: ordenesCount,
      ticketPromedio: ordenesCount ? ingresos / ordenesCount : 0
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

      let sugerencias = [];
      try {
        const res = await generarSugerencias({
          ordenes,
          inventario,
          empresaId: state.empresaId
        });
        sugerencias = Array.isArray(res) ? res : (res?.sugerencias || []);
      } catch (e) {
        console.warn("⚠️ Error IA sugerencias:", e);
      }

      let data = { alertas: [], recomendaciones: [] };

      try {
        data = await analizarNegocio({
          ordenes,
          inventario,
          empresaId: state.empresaId,
          resumen: kpis,
          sugerencias
        });
      } catch (e) {
        console.warn("⚠️ Error IA análisis:", e);
      }

      renderResultado(resultado, data, sugerencias, kpis);

      try {
        hablarResumen(data);
      } catch (e) {}

    } catch (error) {

      console.error("❌ CEO AI Error:", error);
      resultado.innerHTML = renderError(error);

    }
  };

  /* =========================
  VOZ
  ========================= */
  btnVoz.onclick = async () => {

    try {
      const { hablar } = await import("../voice/voiceCore.js");
      hablar(resultado.innerText || "No hay datos");
    } catch (e) {
      console.warn("⚠️ Voz no disponible:", e);
    }

  };
}

/* =========================
UI
========================= */

function renderUI() {
  return `
    <h1 style="color:#00ffff;">🧠 CEO AI PRO360</h1>

    <button id="analizar">🚀 Analizar</button>
    <button id="voz">🎤 Voz</button>

    <div id="resultado" style="margin-top:20px;"></div>
  `;
}

/* =========================
RENDER
========================= */

function setLoading(el){
  el.innerHTML = "🤖 Analizando negocio...";
}

function renderEmpty(){
  return "⚠️ No hay órdenes aprobadas aún";
}

function renderError(e){
  return `❌ ${e.message}`;
}

function renderResultado(el, data, sugerencias, kpis) {

  el.innerHTML = `

    <h2>📊 KPIs CEO</h2>

    ${card("Ingresos", money(kpis.ingresos))}
    ${card("Utilidad", money(kpis.utilidad))}
    ${card("Margen", kpis.margen.toFixed(2)+"%")}
    ${card("Órdenes", kpis.ordenes)}
    ${card("Ticket Promedio", money(kpis.ticketPromedio))}

    <h3>🚨 Alertas</h3>
    ${list(data.alertas)}

    <h3>💡 Recomendaciones CEO</h3>
    ${list(data.recomendaciones)}

    <h3>🤖 Sugerencias IA</h3>
    ${list(sugerencias)}

  `;
}

function card(t,v){
  return `<div><strong>${t}:</strong> ${v}</div>`;
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