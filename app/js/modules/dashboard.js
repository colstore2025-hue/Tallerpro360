/**
 * DASHBOARD FINAL PRO360
 * TallerPRO360 – ERP+CRM+IA
 * Compatible Vercel / Firestore / Voz
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="color:#00ffcc; text-shadow:0 0 8px #00ffcc;">📊 Dashboard Gerencial PRO360</h1>

    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;margin-top:20px;"></div>

    <div style="margin-top:20px;">
      <canvas id="graficaIngresos" style="background:#111827; border-radius:12px; padding:10px;"></canvas>
    </div>

    <div id="iaPanel" style="margin-top:20px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = "<p style='color:red'>❌ Error: empresa no definida</p>";
    return;
  }

  try {

    // 🔹 Consulta Firestore
    const q = query(
      collection(window.db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );

    const snapshot = await getDocs(q);

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
      const fecha = data.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;
    });

    const utilidad = ingresos - costos;

    // 🔹 Render KPIs
    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos)}
      ${crearKPI("📉 Costos", costos)}
      ${crearKPI("📈 Utilidad", utilidad)}
      ${crearKPI("🧾 Órdenes", ordenes)}
    `;

    // 🔹 Gráfica ingresos
    renderGrafica(ingresosPorDia);

    // 🔹 Panel IA
    const iaData = await analizarNegocio(state);
    if (iaData) renderIA(iaData);

  } catch (error) {
    console.error("❌ Error dashboard", error);
    container.innerHTML = `
      <h2 style="color:red">Error cargando dashboard</h2>
      <p>${error.message}</p>
    `;
  }
}

/* ===============================
🎯 KPI CARD
=============================== */
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

/* ===============================
📈 GRÁFICA INGRESOS
=============================== */
function renderGrafica(data) {
  const ctx = document.getElementById("graficaIngresos");
  if (!ctx || typeof Chart === "undefined") return;

  const labels = Object.keys(data);
  const valores = Object.values(data);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ingresos por día",
        data: valores,
        borderColor: "#00ff99",
        backgroundColor: "rgba(0,255,153,0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#00ffcc" } }
      },
      scales: {
        x: { ticks: { color: "#00ffcc" }, grid: { color: "#334155" } },
        y: { ticks: { color: "#00ffcc" }, grid: { color: "#334155" } }
      }
    }
  });
}

/* ===============================
🧠 PANEL IA
=============================== */
function renderIA(data) {
  const panel = document.getElementById("iaPanel");

  panel.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 15px #00ff99;
    ">
      <h2>🧠 IA Gerente PRO360</h2>

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

/* ===============================
💰 FORMATEAR DINERO
=============================== */
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}