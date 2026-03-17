/**
 * 📊 DASHBOARD ERP PRO360
 * Multi-módulo: Órdenes, Clientes, Inventario, Finanzas
 * Integración total: IA, voz, KPIs dinámicos, gráficos neón
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
    <h1 style="color:#0ff; text-shadow:0 0 12px #0ff;">📊 Dashboard PRO360</h1>

    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:15px;"></div>

    <div style="margin-top:20px;">
      <canvas id="graficaIngresos" style="background:#111; border-radius:12px; padding:10px;"></canvas>
    </div>

    <div id="iaPanel" style="margin-top:20px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = "❌ Error: empresa no definida";
    return;
  }

  try {
    // 🔹 CONSULTA FIRESTORE
    const q = query(collection(db, "ordenes"), where("empresaId", "==", state.empresaId));
    const snapshot = await getDocs(q);

    let ingresos = 0, costos = 0, ordenes = 0;
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

    // 🔹 RENDER KPIs
    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#0ff", "💵")}
      ${crearKPI("📉 Costos", costos, "#f00", "📊")}
      ${crearKPI("📈 Utilidad", utilidad, "#0f0", "📈")}
      ${crearKPI("🧾 Órdenes", ordenes, "#ff0", "📝")}
    `;

    // 🔹 GRÁFICA INGRESOS
    renderGrafica(ingresosPorDia);

    // 🔹 IA GERENTE
    const iaData = await analizarNegocio(state);
    if (iaData) renderIA(iaData);

  } catch (error) {
    console.error("❌ error dashboard", error);
    container.innerHTML = `
      <h2 style="color:red">Error cargando dashboard</h2>
      <p>${error.message}</p>
    `;
  }
}


/* ===============================
🎯 KPI CARD
=============================== */
function crearKPI(titulo, valor, color="#0ff", icono="📊") {
  return `
    <div style="
      background:#111827;
      padding:20px;
      border-radius:12px;
      text-align:center;
      box-shadow:0 0 15px ${color};
      display:flex;
      flex-direction:column;
      align-items:center;
    ">
      <span style="font-size:28px;">${icono}</span>
      <h3 style="color:${color}; text-shadow:0 0 8px ${color}; margin:5px 0;">${titulo}</h3>
      <p style="font-size:22px; font-weight:bold;">$${formatear(valor)}</p>
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
        borderColor: "#0ff",
        backgroundColor: "rgba(0,255,255,0.1)",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: "#ff0",
        pointRadius: 5
      }]
    },
    options: {
      responsive:true,
      plugins: { legend:{ display:true, labels:{ color:"#0ff" } } },
      scales:{
        x:{ ticks:{ color:"#0ff" }, grid:{ color:"rgba(0,255,255,0.1)" } },
        y:{ ticks:{ color:"#0ff" }, grid:{ color:"rgba(0,255,255,0.1)" } }
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
      box-shadow:0 0 15px #0ff;
    ">
      <h2 style="color:#0ff; text-shadow:0 0 8px #0ff;">🧠 IA Gerente</h2>

      <p>💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p>📊 Margen: ${data.resumen.margen}%</p>
      <p>🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>

      <h3 style="color:#ff0;">⚠️ Alertas</h3>
      ${data.alertas.map(a => `<p style="color:#f00;">${a}</p>`).join("")}

      <h3 style="color:#0f0;">🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r => `<p>${r}</p>`).join("")}

      <button id="vozGerente" style="
        margin-top:10px;
        padding:10px;
        background:#0ff;
        border:none;
        border-radius:8px;
        cursor:pointer;
        font-weight:bold;
      ">🎤 Escuchar IA</button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = () => hablarResumen(data);
}


/* ===============================
💰 FORMATEAR DINERO
=============================== */
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}