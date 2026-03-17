/**
 * DASHBOARD PRO360 - BI AVANZADO
 * TallerPRO360 | SaaS Multiempresa
 * KPIs dinámicos, gráficos, alertas IA, voz gerente
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="color:#00ffcc;text-shadow:0 0 10px #00ffcc;">📊 Dashboard PRO360</h1>
    <div id="kpis" style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:15px;
      margin-top:15px;
    "></div>

    <div style="margin-top:25px;">
      <canvas id="graficaIngresos" height="120"></canvas>
    </div>

    <div id="iaPanel" style="margin-top:25px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = "❌ Error: empresa no definida";
    return;
  }

  try {
    // 🔹 Consultar todas las órdenes de esta empresa
    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );
    const snapshot = await getDocs(q);

    let ingresos = 0, costos = 0, ordenes = 0;
    const ingresosPorDia = {};

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
      ${crearKPI("💰 Ingresos", ingresos, "🟢")}
      ${crearKPI("📉 Costos", costos, "🔴")}
      ${crearKPI("📈 Utilidad", utilidad, "🟡")}
      ${crearKPI("🧾 Órdenes", ordenes, "🔵")}
      ${crearKPI("🎯 Ticket Promedio", ingresos/Math.max(ordenes,1), "🟣")}
    `;

    // 🔹 Render gráfica ingresos
    renderGrafica(ingresosPorDia);

    // 🔹 Panel IA Gerente
    const iaData = await analizarNegocio(state);
    if (iaData) renderIA(iaData);

  } catch (error) {
    console.error("❌ Error dashboard:", error);
    container.innerHTML = `<h2 style="color:red;">Error cargando dashboard</h2><p>${error.message}</p>`;
  }
}

// 🔹 Crear KPI card
function crearKPI(titulo, valor, color="🟢") {
  return `
    <div style="
      background:#111827;
      padding:20px;
      border-radius:12px;
      text-align:center;
      box-shadow:0 0 12px ${color === "🟢" ? "#00ff99" : color === "🔴" ? "#ff0044" : color === "🟡" ? "#ffd700" : color === "🔵" ? "#00aaff" : "#aa00ff"};
    ">
      <h3>${color} ${titulo}</h3>
      <p style="font-size:22px;">$${formatear(valor)}</p>
    </div>
  `;
}

// 🔹 Render gráfica
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
        borderWidth: 2,
        borderColor: "#00ff99",
        backgroundColor: "rgba(0,255,153,0.2)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#00ffcc"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, labels: { color: "#00ffcc" } },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        x: { ticks: { color: "#00ffcc" }, grid: { color: "#1e293b" } },
        y: { ticks: { color: "#00ffcc" }, grid: { color: "#1e293b" } }
      }
    }
  });
}

// 🔹 Panel IA Gerente
function renderIA(data) {
  const panel = document.getElementById("iaPanel");

  panel.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 15px #00ff99;
      color:#00ffcc;
    ">
      <h2>🧠 IA Gerente</h2>
      <p>💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p>📊 Margen: ${data.resumen.margen}%</p>
      <p>🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>

      <h3>⚠️ Alertas</h3>
      ${data.alertas.map(a => `<p>❗ ${a}</p>`).join("")}

      <h3>🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r => `<p>💡 ${r}</p>`).join("")}

      <button id="vozGerente" style="
        margin-top:12px;
        padding:10px;
        background:#00ff99;
        border:none;
        border-radius:8px;
        cursor:pointer;
        color:#000;
        font-weight:bold;
      ">🎤 Escuchar IA</button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = () => {
    hablarResumen(data);
  };
}

// 🔹 Formatear moneda
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}