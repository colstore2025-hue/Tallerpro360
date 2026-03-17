/**
 * DASHBOARD FINAL PRO
 * TallerPRO360
 */

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { query, where } from "firebase/firestore";

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1>📊 Dashboard Gerencial</h1>

    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;"></div>

    <div style="margin-top:20px;">
      <canvas id="graficaIngresos"></canvas>
    </div>

    <div id="iaPanel" style="margin-top:20px;"></div>
  `;

  const db = window.db;

  if (!db) {
    container.innerHTML = "❌ Error conexión DB";
    return;
  }

  // 🔥 CARGAR DATOS
  const snapshot = await getDocs(collection(db, "ordenes"));

  let ingresos = 0;
  let costos = 0;
  let ordenes = 0;

  let ingresosPorDia = {};

  snapshot.forEach(doc => {
    const data = doc.data() || {};

    const total = Number(data.total) || 0;
    const costo = Number(data.costoTotal) || 0;

    ingresos += total;
    costos += costo;
    ordenes++;

    const fecha = data.creadoEn?.toDate?.().toISOString().split("T")[0] || "sin_fecha";

    ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;
  });

  const utilidad = ingresos - costos;

  // 📊 KPI UI
  const kpis = document.getElementById("kpis");

  kpis.innerHTML = `
    ${crearKPI("💰 Ingresos", ingresos)}
    ${crearKPI("📉 Costos", costos)}
    ${crearKPI("📈 Utilidad", utilidad)}
    ${crearKPI("🧾 Órdenes", ordenes)}
  `;

  // 📈 GRÁFICA
  renderGrafica(ingresosPorDia);

  // 🧠 IA GERENTE
  const iaData = await analizarNegocio();

  if (iaData) {
    renderIA(iaData);
  }

}

/**
 * 🎯 KPI CARD
 */
function crearKPI(titulo, valor) {
  return `
    <div style="
      background:#111827;
      padding:20px;
      border-radius:12px;
      text-align:center;
      box-shadow:0 0 10px rgba(0,255,153,0.4);
    ">
      <h3>${titulo}</h3>
      <p style="font-size:22px;">$${formatear(valor)}</p>
    </div>
  `;
}

/**
 * 📈 GRÁFICA INGRESOS
 */
function renderGrafica(data) {

  const ctx = document.getElementById("graficaIngresos");

  if (!ctx) return;

  const labels = Object.keys(data);
  const valores = Object.values(data);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ingresos por día",
        data: valores,
        borderWidth: 2
      }]
    }
  });
}

/**
 * 🧠 PANEL IA
 */
function renderIA(data) {

  const panel = document.getElementById("iaPanel");

  panel.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 15px #00ff99;
    ">
      <h2>🧠 IA Gerente</h2>

      <p>💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p>📊 Margen: ${data.resumen.margen}%</p>
      <p>🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>

      <h3>⚠️ Alertas</h3>
      ${data.alertas.map(a => `<p>${a}</p>`).join("")}

      <h3>🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r => `<p>${r}</p>`).join("")}

      <button id="vozGerente" style="
        margin-top:10px;
        padding:10px;
        background:#00ff99;
        border:none;
        border-radius:8px;
        cursor:pointer;
      ">
        🎤 Escuchar IA
      </button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = () => {
    hablarResumen(data);
  };
}

/**
 * 💰 FORMATEAR DINERO
 */
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}