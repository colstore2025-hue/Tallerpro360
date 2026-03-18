/**
 * dashboard.js (VERSIÓN ESTABLE PRO)
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// ⚠️ IA opcional (no rompe si falla)
let analizarNegocio = null;
let hablarResumen = null;

try {
  const aiModule = await import("../ai/aiAssistant.js");
  analizarNegocio = aiModule.analizarNegocio;
  hablarResumen = aiModule.hablarResumen;
} catch (e) {
  console.warn("IA no disponible", e);
}

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="text-align:center; font-size:32px; color:#00ffcc;">📊 Dashboard PRO360</h1>
    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-top:20px;"></div>
    <div style="margin-top:30px;">
      <canvas id="graficaIngresos" style="background:#111827; border-radius:12px; padding:10px;"></canvas>
    </div>
    <div id="iaPanel" style="margin-top:30px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red">❌ Error: empresa no definida</h2>`;
    return;
  }

  try {

    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );

    const snapshot = await getDocs(q);

    let ingresos = 0;
    let costos = 0;
    let ordenes = 0;
    let ingresosPorDia = {};

    snapshot.forEach(doc => {
      const d = doc.data() || {};

      const total = Number(d.total) || 0;
      const costo = Number(d.costoTotal) || 0;

      ingresos += total;
      costos += costo;
      ordenes++;

      const fecha =
        d.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";

      ingresosPorDia[fecha] =
        (ingresosPorDia[fecha] || 0) + total;
    });

    const utilidad = ingresos - costos;

    document.getElementById("kpis").innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#00ff99")}
      ${crearKPI("📉 Costos", costos, "#ff0044")}
      ${crearKPI("📈 Utilidad", utilidad, "#00ffff")}
      ${crearKPI("🧾 Órdenes", ordenes, "#ffcc00")}
    `;

    renderGrafica(ingresosPorDia);

    // 🧠 IA segura
    if (analizarNegocio) {
      try {
        const iaData = await analizarNegocio(state);
        if (iaData) renderIA(iaData);
      } catch (e) {
        console.warn("Error IA:", e);
      }
    }

  } catch (e) {

    console.error("🔥 ERROR DASHBOARD:", e);

    container.innerHTML = `
      <div style="color:red">
        <h2>❌ Error cargando dashboard</h2>
        <pre>${e.stack || e.message}</pre>
      </div>
    `;
  }
}

/* ================= KPI ================= */

function crearKPI(titulo, valor, color) {
  return `
    <div style="background:#111827; border-left:6px solid ${color}; border-radius:12px; padding:20px; text-align:center;">
      <h3>${titulo}</h3>
      <p style="font-size:28px; color:${color};">$${formatear(valor)}</p>
    </div>
  `;
}

/* ================= GRÁFICA ================= */

function renderGrafica(data) {

  if (typeof Chart === "undefined") {
    console.warn("Chart.js no cargado");
    return;
  }

  const ctx = document.getElementById("graficaIngresos");

  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Ingresos",
        data: Object.values(data)
      }]
    },
    options: {
      responsive: true
    }
  });
}

/* ================= IA ================= */

function renderIA(data) {

  const panel = document.getElementById("iaPanel");

  if (!panel) return;

  const resumen = data?.resumen || {};
  const alertas = data?.alertas || [];
  const recomendaciones = data?.recomendaciones || [];

  panel.innerHTML = `
    <div style="background:#0f172a; padding:20px; border-radius:12px;">
      <h2>🧠 IA Gerente</h2>

      <p>💰 Ingresos: $${formatear(resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(resumen.utilidad)}</p>

      <h3>⚠️ Alertas</h3>
      ${alertas.map(a => `<p>${a}</p>`).join("")}

      <h3>🚀 Recomendaciones</h3>
      ${recomendaciones.map(r => `<p>${r}</p>`).join("")}

      ${hablarResumen ? `<button id="vozGerente">🎤 Voz IA</button>` : ""}
    </div>
  `;

  if (hablarResumen) {
    document.getElementById("vozGerente").onclick = () => hablarResumen(data);
  }
}

/* ================= UTILS ================= */

function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}