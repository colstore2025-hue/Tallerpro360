/**
 * dashboard.js
 * Dashboard PRO360 modular con Neon KPIs y Charts
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { bootStatus } from "../system/bootDiagnostic.js";

let charts = {};

/**
 * Inicializa el dashboard
 * @param {HTMLElement} container - contenedor donde renderizar
 * @param {Object} options - { empresaId: string }
 */
export default async function dashboard(container, options = {}) {
  container.innerHTML = `<h2 style="color:#00ffff;text-align:center;margin-top:50px;">Cargando Dashboard...</h2>`;

  const empresaId = options.empresaId;
  if (!empresaId) {
    container.innerHTML = `<p style="color:red;text-align:center">Empresa no definida</p>`;
    bootStatus?.("❌ Dashboard: empresaId no definido");
    return;
  }

  bootStatus?.(`🟢 Dashboard: cargando datos de empresa ${empresaId}...`);

  try {
    const [clientes, ordenes, inventario] = await Promise.all([
      getClientes(empresaId),
      getOrdenes(empresaId),
      getInventario(empresaId),
    ]);

    bootStatus?.(`✔ Dashboard: datos cargados correctamente`);

    renderDashboard(container, { clientes, ordenes, inventario });

  } catch (e) {
    console.error("Error dashboard:", e);
    container.innerHTML = `<p style="color:red;text-align:center">Error cargando dashboard</p>`;
    bootStatus?.(`❌ Dashboard: error cargando datos`);
  }
}

/**
 * Render principal del dashboard
 */
function renderDashboard(container, data) {
  const { clientes, ordenes, inventario } = data;

  container.innerHTML = `
    <div style="padding:20px;font-family:Segoe UI,sans-serif;">
      <h1 style="color:#00ffff;text-align:center;text-shadow:0 0 15px #00ffff;">🧠 Dashboard PRO360</h1>

      <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin-top:25px;"></div>

      <div style="margin-top:30px;">
        <canvas id="lineChart" style="background:#0f172a;padding:15px;border-radius:12px;"></canvas>
      </div>
    </div>
  `;

  // Render KPIs neon
  const kpisEl = container.querySelector("#kpis");
  const kpiData = [
    { label: "Clientes", value: clientes.length, color: "#22c55e" },
    { label: "Órdenes", value: ordenes.length, color: "#00ffff" },
    { label: "Items Inventario", value: inventario.length, color: "#facc15" }
  ];

  kpisEl.innerHTML = kpiData.map(kpi => `
    <div style="
      background:#0f172a; padding:18px; border-radius:12px;
      box-shadow:0 5px 25px ${kpi.color}44; text-align:center;
      border:1px solid #1e293b;">
      <p style="color:#ffffff;font-size:13px;">${kpi.label}</p>
      <h2 style="color:${kpi.color};font-size:22px;margin-top:5px;">${kpi.value}</h2>
    </div>
  `).join("");

  // Render gráfico de ejemplo
  renderLineChart(container.querySelector("#lineChart"), ordenes);
}

/**
 * Renderiza un gráfico de líneas básico con Chart.js
 */
function renderLineChart(ctx, ordenes) {
  if (!ctx) return;

  if (charts.line) charts.line.destroy();

  const fechas = ordenes.map(o => new Date(o.creadoEn).toLocaleDateString());
  const valores = ordenes.map(o => Number(o.valorTrabajo || 0));

  try {
    const ChartLib = window.Chart;
    charts.line = new ChartLib(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [{
          label: "Ingresos por orden",
          data: valores,
          borderColor: "#00ffff",
          backgroundColor: "#00ffff33",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#ffffff" } } },
        scales: { x: { ticks: { color: "#ffffff" } }, y: { ticks: { color: "#ffffff" } } }
      }
    });
  } catch (e) {
    console.warn("Chart.js no disponible, omitiendo gráfico");
  }
}