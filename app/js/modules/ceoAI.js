/**
================================================
CEO-AI.JS - Módulo IA Gerente PRO360 ULTRA
================================================
*/

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

export default async function CEOAIModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `❌ empresaId no definido`;
    return;
  }

  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  DATA REAL (NUEVA ESTRUCTURA)
  ========================= */
  async function obtenerDatos() {

    const base = `empresas/${state.empresaId}`;

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

    /* 🔥 FILTRO CEO (solo negocio real) */
    ordenes = ordenes.filter(o =>
      o.estado === "aprobada" || o.estado === "cerrada"
    );

    return { ordenes, inventario };
  }

  /* =========================
  KPIs REALES
  ========================= */
  function calcularKPIs(ordenes) {

    const totalIngresos = ordenes.reduce((a, o) => a + (o.total || 0), 0);
    const totalCostos = ordenes.reduce((a, o) => a + (o.costoTotal || 0), 0);
    const utilidad = totalIngresos - totalCostos;

    const ordenesCount = ordenes.length;
    const ticketPromedio = ordenesCount
      ? totalIngresos / ordenesCount
      : 0;

    return {
      ingresos: totalIngresos,
      utilidad,
      margen: totalIngresos ? (utilidad / totalIngresos) * 100 : 0,
      ordenes: ordenesCount,
      ticketPromedio
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

      const kpis = calcularKPIs(ordenes);

      const { sugerencias } = await generarSugerencias({
        ordenes,
        inventario,
        empresaId: state.empresaId
      });

      const data = await analizarNegocio({
        ordenes,
        inventario,
        empresaId: state.empresaId,
        resumen: kpis,
        sugerencias
      });

      renderResultado(resultado, data, sugerencias, kpis);

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
      hablar(resultado.innerText || "No hay datos");
    } catch (e) {
      console.warn(e);
    }

  };
}

/* =====================================================
UI
===================================================== */

function renderUI() {
  return `
    <h1 style="color:#00ffff;">🧠 CEO AI PRO360</h1>

    <button id="analizar">🚀 Analizar</button>
    <button id="voz">🎤 Voz</button>

    <div id="resultado" style="margin-top:20px;"></div>
  `;
}

/* =====================================================
RENDER
===================================================== */

function setLoading(el){
  el.innerHTML = "🤖 Analizando negocio...";
}

function renderEmpty(){
  return "⚠️ No hay órdenes aprobadas aún";
}

function renderError(e){
  return `❌ ${e.message}`;
}

/* =====================================================
RESULTADO
===================================================== */

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
  }).format(v||0);
}