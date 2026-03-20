/**
 * dashboard.js
 * PRO360 GOD CORE v2 🧠🚀
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;
let chartInstance = null;

export default async function dashboard(container, state) {

  renderBaseUI(container);

  if (!state?.empresaId) {
    return renderError("❌ Empresa no definida");
  }

  /* =========================
  1. CARGAR CACHE INSTANTÁNEO
  ========================= */
  const cacheKey = `dashboard_${state.empresaId}`;
  const cache = loadCache(cacheKey);

  if (cache) {
    console.log("⚡ Cargando desde cache");
    renderAll(cache, true);
  }

  /* =========================
  2. CARGAR DATOS REALES
  ========================= */
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
UI BASE
========================= */

function renderBaseUI(container) {
  container.innerHTML = `
    <h1 style="text-align:center;color:#00ffcc;">🚀 PRO360 GOD CORE</h1>

    <div id="kpis"></div>
    <canvas id="chart"></canvas>
    <div id="iaPanel"></div>
  `;
}

/* =========================
FETCH DATA SEGURO
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
    alertas: []
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

    /* IA ALERTA */
    if (total < costo) {
      data.alertas.push("⚠️ Orden con pérdida detectada");
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

  renderKPIs(data, utilidad, margen, fromCache);
  await renderChart(data.ingresosPorDia);
  renderIA(margen, data.alertas);
}

/* =========================
KPIs
========================= */

function renderKPIs(d, utilidad, margen, cache) {

  const el = document.getElementById("kpis");

  el.innerHTML = `
    ${badge(cache)}

    ${card("💰 Ingresos", d.ingresos)}
    ${card("📉 Costos", d.costos)}
    ${card("📈 Utilidad", utilidad)}
    ${card("📊 Margen", margen.toFixed(2)+"%")}
    ${card("🧾 Órdenes", d.ordenes)}
  `;
}

function badge(cache) {
  return cache
    ? `<div style="color:#ffcc00;">⚡ Modo cache</div>`
    : "";
}

function card(t, v) {
  return `
    <div style="background:#0f172a;padding:12px;margin:10px;border-radius:8px;">
      <strong>${t}</strong><br>
      ${typeof v === "number" ? "$"+fmt(v) : v}
    </div>
  `;
}

/* =========================
CHART SEGURO + FALLBACK
========================= */

async function renderChart(data) {

  const ctx = document.getElementById("chart");

  let ChartLib;

  try {
    ChartLib = (await import("https://cdn.jsdelivr.net/npm/chart.js/auto/+esm")).default;
  } catch {
    return fallbackChart(data);
  }

  try {

    if (chartInstance) chartInstance.destroy();

    chartInstance = new ChartLib(ctx, {
      type: "line",
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: "Ingresos",
          data: Object.values(data)
        }]
      }
    });

  } catch {
    fallbackChart(data);
  }
}

function fallbackChart(data) {
  const ctx = document.getElementById("chart");

  ctx.outerHTML = `
    <div style="background:#111;padding:10px;">
      ${Object.entries(data).map(([k,v])=>`${k}: $${fmt(v)}`).join("<br>")}
    </div>
  `;
}

/* =========================
IA PANEL
========================= */

function renderIA(margen, alertas) {

  const el = document.getElementById("iaPanel");

  el.innerHTML = `
    <div style="background:#020617;padding:15px;">
      <h2>🧠 IA</h2>

      <p>Margen: ${margen.toFixed(2)}%</p>

      <h3>⚠️ Alertas</h3>
      ${alertas.length ? alertas.join("<br>") : "Sin alertas"}

      <button id="voz">🎤 Hablar</button>
    </div>
  `;

  document.getElementById("voz").onclick = () => {
    speechSynthesis.speak(
      new SpeechSynthesisUtterance(`Margen ${margen.toFixed(1)} por ciento`)
    );
  };
}

/* =========================
CACHE
========================= */

function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function loadCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

/* =========================
UTILS
========================= */

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