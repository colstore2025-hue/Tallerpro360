/**
 * dashboard.js
 * PRO360 Dashboard · MODO INDESTRUCTIBLE 🛡️
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

let chartInstance = null;

/* ================= EXPORT ================= */

export default async function dashboard(container, state) {

  safeRender(container, `
    <h1 style="text-align:center;color:#00ffcc;">🛡️ Dashboard PRO360</h1>
    <div id="kpis"></div>
    <canvas id="chart"></canvas>
    <div id="iaPanel"></div>
  `);

  if (!state?.empresaId) {
    return safeRender(container, "❌ Empresa no definida");
  }

  let data = {
    ingresos: 0,
    costos: 0,
    ordenes: 0,
    ingresosPorDia: {},
    alertas: []
  };

  /* ================= FIRESTORE SEGURO ================= */

  try {

    const snap = await getDocs(
      query(collection(db, `empresas/${state.empresaId}/ordenes`))
    );

    snap.forEach(doc => {

      const d = doc.data() || {};

      const total = safeNumber(d.valorTrabajo);
      const costo = safeNumber(d.costoTotal);

      data.ingresos += total;
      data.costos += costo;
      data.ordenes++;

      const fecha = safeFecha(d.creadoEn);

      data.ingresosPorDia[fecha] =
        (data.ingresosPorDia[fecha] || 0) + total;

      if (total < costo) {
        data.alertas.push("⚠️ Orden con pérdida");
      }

    });

  } catch (e) {
    console.error("🔥 Firestore falló:", e);
  }

  /* ================= CALCULOS ================= */

  const utilidad = data.ingresos - data.costos;
  const margen = data.ingresos ? (utilidad / data.ingresos) * 100 : 0;

  renderKPIs({
    ingresos: data.ingresos,
    costos: data.costos,
    utilidad,
    ordenes: data.ordenes,
    margen
  });

  await renderChartSeguro(data.ingresosPorDia);

  renderIA({
    margen,
    alertas: data.alertas
  });
}

/* ================= KPIs ================= */

function renderKPIs(d) {

  const el = document.getElementById("kpis");
  if (!el) return;

  el.innerHTML = `
    ${card("💰 Ingresos", d.ingresos)}
    ${card("📉 Costos", d.costos)}
    ${card("📈 Utilidad", d.utilidad)}
    ${card("📊 Margen", d.margen.toFixed(2)+"%")}
    ${card("🧾 Órdenes", d.ordenes)}
  `;
}

function card(t, v) {
  return `
    <div style="background:#0f172a;padding:15px;margin:10px;border-radius:10px;">
      <strong>${t}</strong><br>
      ${typeof v === "number" ? "$"+fmt(v) : v}
    </div>
  `;
}

/* ================= CHART INDESTRUCTIBLE ================= */

async function renderChartSeguro(data) {

  const ctx = document.getElementById("chart");
  if (!ctx) return;

  let ChartLib = null;

  try {
    ChartLib = (await import("https://cdn.jsdelivr.net/npm/chart.js/auto/+esm")).default;
  } catch (e) {
    console.warn("⚠️ Chart CDN falló");
  }

  /* ===== FALLBACK SIN CHART ===== */
  if (!ChartLib) {
    ctx.outerHTML = renderFallbackChart(data);
    return;
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

  } catch (e) {
    console.error("🔥 Error render chart:", e);
    ctx.outerHTML = renderFallbackChart(data);
  }
}

/* ===== FALLBACK VISUAL ===== */

function renderFallbackChart(data) {

  const items = Object.entries(data)
    .map(([k,v]) => `<div>${k}: $${fmt(v)}</div>`)
    .join("");

  return `
    <div style="background:#111;padding:15px;border-radius:10px;">
      <h3>📊 Datos (modo fallback)</h3>
      ${items || "Sin datos"}
    </div>
  `;
}

/* ================= IA ================= */

function renderIA({ margen, alertas }) {

  const el = document.getElementById("iaPanel");
  if (!el) return;

  el.innerHTML = `
    <div style="background:#020617;padding:20px;border-radius:10px;">
      <h2>🧠 IA</h2>
      <p>Margen: ${margen.toFixed(2)}%</p>

      <h3>⚠️ Alertas</h3>
      ${
        alertas.length
          ? alertas.map(a => `<p>${a}</p>`).join("")
          : "Sin alertas"
      }

      <button id="voz">🎤 Voz</button>
    </div>
  `;

  document.getElementById("voz").onclick = () => {

    try {
      const msg = new SpeechSynthesisUtterance(
        `Margen actual ${margen.toFixed(1)} por ciento`
      );
      speechSynthesis.speak(msg);
    } catch {
      alert("Voz no disponible");
    }

  };
}

/* ================= HELPERS ================= */

function safeRender(container, html) {
  try {
    container.innerHTML = html;
  } catch (e) {
    console.error("Render error", e);
  }
}

function safeNumber(v) {
  return Number(v || 0);
}

function safeFecha(f) {
  try {
    return f?.toDate?.().toISOString().split("T")[0];
  } catch {
    return "NA";
  }
}

function fmt(v) {
  return new Intl.NumberFormat("es-CO").format(v || 0);
}