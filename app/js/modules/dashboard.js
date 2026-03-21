/**
 * dashboard.js
 * Dashboard PRO360 modular · ULTRA CORE
 * KPIs neon + gráficos dinámicos
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";

let charts = {};

/**
 * Inicializa el dashboard
 * @param {HTMLElement} container 
 * @param {Object} state 
 */
export default async function dashboard(container, state) {
  container.innerHTML = `
    <div style="text-align:center;color:#00ffff;margin-top:50px;">
      🔄 Cargando Dashboard...
    </div>
  `;

  const empresaId = state?.empresaId;
  if (!empresaId) {
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Empresa no definida</p>`;
    return;
  }

  try {
    // =========================
    // Obtener datos
    // =========================
    const [clientes, ordenes, inventario] = await Promise.all([
      getClientes(empresaId),
      getOrdenes(empresaId),
      getInventario(empresaId)
    ]);

    renderDashboard(container, { clientes, ordenes, inventario });

  } catch (e) {
    console.error("Error dashboard:", e);
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando dashboard</p>`;
  }
}

/**
 * Renderiza el dashboard principal con KPIs neon
 */
function renderDashboard(container, data) {
  const { clientes, ordenes, inventario } = data;

  container.innerHTML = `
    <div style="padding:20px;background:#0a0f1a;color:#ffffff;font-family:Segoe UI, sans-serif;">
      <h1 style="font-size:36px;font-weight:900;color:#00ffff;margin-bottom:20px;text-shadow:0 0 15px #00ffff;">
        🧠 Dashboard PRO360
      </h1>

      <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:18px;margin-bottom:30px;">
        ${kpiCard("Clientes", clientes.length, "#22c55e")}
        ${kpiCard("Órdenes", ordenes.length, "#00ffff")}
        ${kpiCard("Items Inventario", inventario.length, "#facc15")}
      </div>

      <div style="background:#0f172a;padding:20px;border-radius:14px;box-shadow:0 0 25px #00ffff33;">
        <canvas id="lineChart"></canvas>
      </div>
    </div>
  `;

  renderCharts(clientes, ordenes, inventario);
}

/**
 * Crea un KPI Card neon
 */
function kpiCard(title, value, color="#00ffff") {
  return `
    <div style="
      background:#0f172a;
      padding:18px;
      border-radius:12px;
      box-shadow:0 5px 25px ${color}44;
      border:1px solid #1e293b;
      transition:0.35s;
    ">
      <p style="color:#ffffff;font-size:14px;">${title}</p>
      <h2 style="color:${color};font-size:22px;margin-top:5px;">${value}</h2>
    </div>
  `;
}

/**
 * Renderiza los gráficos neon con Chart.js
 */
async function renderCharts(clientes, ordenes, inventario) {
  try {
    const ChartLib = (await import("https://cdn.jsdelivr.net/npm/chart.js/auto/+esm")).default;

    const ctx = document.getElementById("lineChart");

    if (charts.line) charts.line.destroy();

    charts.line = new ChartLib(ctx, {
      type: "line",
      data: {
        labels: ["Clientes", "Órdenes", "Inventario"],
        datasets: [{
          label: "Cantidad",
          data: [clientes.length, ordenes.length, inventario.length],
          borderColor: "#00ffff",
          backgroundColor: "#00ffff33",
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: "#facc15",
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#ffffff" } } },
        scales: {
          x: { ticks: { color: "#ffffff" } },
          y: { ticks: { color: "#ffffff" } }
        },
        animation: { duration: 1200 }
      }
    });

  } catch (e) {
    console.warn("⚠️ Chart.js no disponible:", e.message);
  }
}