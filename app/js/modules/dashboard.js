/**
 * dashboard.js
 * PRO360 GOD CORE v3 🧠👑 (Power BI Style + CEO Autónomo)
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;
let chartInstance = null;

export default async function dashboard(container, state) {

  renderBaseUI(container);

  if (!state?.empresaId) {
    return renderError("❌ Empresa no definida");
  }

  const cacheKey = `dashboard_${state.empresaId}`;
  const cache = loadCache(cacheKey);

  if (cache) {
    renderAll(cache, true);
  }

  try {

    const data = await fetchData(state.empresaId);

    saveCache(cacheKey, data);

    renderAll(data, false);

  } catch (e) {

    console.error("🔥 Error backend:", e);

    if (!cache) {
      renderError("⚠️ Sin conexión y sin datos");
    }

  }
}

/* =========================
UI BASE (POWER BI STYLE)
========================= */

function renderBaseUI(container) {
  container.innerHTML = `
    <div style="padding:20px;background:#020617;color:white;font-family:Segoe UI;">

      <h1 style="
        font-size:32px;
        font-weight:800;
        color:#00f0ff;
        margin-bottom:20px;
      ">
        🧠 Dashboard CEO PRO360
      </h1>

      <div id="kpis" style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
        gap:15px;
      "></div>

      <div style="
        margin-top:25px;
        background:#0f172a;
        padding:15px;
        border-radius:12px;
        box-shadow:0 0 25px #00f0ff22;
      ">
        <canvas id="chart"></canvas>
      </div>

      <div id="iaPanel" style="margin-top:25px;"></div>

    </div>
  `;
}

/* =========================
FETCH DATA
========================= */

async function fetchData(empresaId) {

  const snap = await getDocs(
    query(collection(db, `empresas/${empresaId}/ordenes`))
  );

  let data = {
    ingresos: 0,
    costos: 0,
    ordenes: 0,
    ingresosPorDia: {},
    alertas: [],
    decisiones: []
  };

  snap.forEach(doc => {

    const d = doc.data() || {};

    const total = safeNum(d.valorTrabajo);
    const costo = safeNum(d.costoTotal);

    data.ingresos += total;
    data.costos += costo;
    data.ordenes++;

    const fecha = safeDate(d.creadoEn);

    data.ingresosPorDia[fecha] =
      (data.ingresosPorDia[fecha] || 0) + total;

    if (total < costo) {
      data.alertas.push("⚠️ Orden con pérdida");
    }

  });

  return data;
}

/* =========================
RENDER GLOBAL
========================= */

async function renderAll(data, fromCache) {

  const utilidad = data.ingresos - data.costos;
  const margen = data.ingresos ? (utilidad / data.ingresos) * 100 : 0;
  const ticket = data.ordenes ? data.ingresos / data.ordenes : 0;

  const decisiones = generarDecisiones({ margen, ticket }, data.alertas);

  renderKPIs(data, utilidad, margen, ticket, fromCache);
  await renderChart(data.ingresosPorDia);
  renderIA({ margen, alertas: data.alertas, decisiones });
}

/* =========================
KPIs POWER BI
========================= */

function renderKPIs(d, utilidad, margen, ticket, cache) {

  const el = document.getElementById("kpis");

  el.innerHTML = `
    ${badge(cache)}

    ${kpiCard("Ingresos", d.ingresos, "#00ffcc")}
    ${kpiCard("Costos", d.costos, "#ff4d4d")}
    ${kpiCard("Utilidad", utilidad, "#00ff99")}
    ${kpiCard("Margen", margen.toFixed(2)+"%", "#00f0ff")}
    ${kpiCard("Órdenes", d.ordenes, "#facc15")}
    ${kpiCard("Ticket Prom.", "$"+fmt(ticket), "#a78bfa")}
  `;
}

function kpiCard(title, value, color) {
  return `
    <div style="
      background:#0f172a;
      padding:15px;
      border-radius:12px;
      box-shadow:0 4px 20px ${color}22;
      border:1px solid #1e293b;
    ">
      <p style="color:#94a3b8;font-size:13px;">${title}</p>
      <h2 style="color:${color};font-size:22px;margin-top:5px;">
        ${typeof value === "number" ? "$"+fmt(value) : value}
      </h2>
    </div>
  `;
}

function badge(cache) {
  return cache
    ? `<div style="color:#facc15;margin-bottom:10px;">⚡ Datos desde cache</div>`
    : "";
}

/* =========================
CHART
========================= */

async function renderChart(data) {

  const ctx = document.getElementById("chart");

  let ChartLib;

  try {
    ChartLib = (await import("https://cdn.jsdelivr.net/npm/chart.js/auto/+esm")).default;
  } catch {
    return fallbackChart(data);
  }

  if (chartInstance) chartInstance.destroy();

  chartInstance = new ChartLib(ctx, {
    type: "line",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Ingresos",
        data: Object.values(data),
        borderWidth: 2,
        tension: 0.4
      }]
    }
  });
}

/* =========================
CEO AI PANEL
========================= */

function renderIA({ margen, alertas, decisiones }) {

  const el = document.getElementById("iaPanel");

  el.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      border:1px solid #1e293b;
    ">

      <h2 style="color:#00f0ff;">👑 CEO AI</h2>

      <p>Margen actual: <strong>${margen.toFixed(2)}%</strong></p>

      <h3 style="color:#ff4d4d;">⚠️ Alertas</h3>
      ${alertas.length ? alertas.join("<br>") : "Sin alertas"}

      <h3 style="color:#00ffcc;margin-top:10px;">🧠 Decisiones</h3>
      ${renderDecisiones(decisiones)}

    </div>
  `;
}

/* =========================
DECISIONES CEO
========================= */

function generarDecisiones(kpis, alertas){

  const decisiones = [];

  if(kpis.margen < 25){
    decisiones.push({
      accion:"subir precios",
      impacto:"alto"
    });
  }

  if(alertas.length){
    decisiones.push({
      accion:"revisar pérdidas",
      impacto:"alto"
    });
  }

  if(kpis.ticket < 70000){
    decisiones.push({
      accion:"crear combos",
      impacto:"medio"
    });
  }

  return decisiones;
}

function renderDecisiones(decisiones){

  if(!decisiones.length) return "Sin decisiones";

  return decisiones.map(d=>`
    <div style="
      background:#020617;
      padding:10px;
      border-radius:8px;
      margin-top:5px;
    ">
      ⚡ ${d.accion} (${d.impacto})
    </div>
  `).join("");
}

/* =========================
UTILS
========================= */

function fallbackChart(data) {
  const ctx = document.getElementById("chart");

  ctx.outerHTML = `
    <div style="background:#111;padding:10px;">
      ${Object.entries(data).map(([k,v])=>`${k}: $${fmt(v)}`).join("<br>")}
    </div>
  `;
}

function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

function safeNum(v){ return Number(v || 0); }

function safeDate(f){
  try { return f?.toDate?.().toISOString().split("T")[0]; }
  catch { return "NA"; }
}

function fmt(v){
  return new Intl.NumberFormat("es-CO").format(v || 0);
}

function renderError(msg){
  document.getElementById("kpis").innerHTML = msg;
}