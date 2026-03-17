/**
 * 📊 Dashboard PRO360
 * TallerPRO360 – KPI Gerencial + IA + Gráficos
 * Estilo neón, colores brillantes, iconos ilustrativos
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { Advisor, actualizarAdvisor, renderSugerencias, notificarAlertas } from "./aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

export default async function dashboard(container, state) {
  container.innerHTML = `
    <h1 style="color:#00ffcc; text-shadow:0 0 15px #0ff;">📊 Dashboard Gerencial PRO360</h1>

    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:15px; margin-top:15px;"></div>

    <div style="margin-top:20px;">
      <canvas id="graficaIngresos"></canvas>
    </div>

    <div id="iaPanel" style="margin-top:20px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = "<p style='color:red;'>❌ Error: empresa no definida</p>";
    return;
  }

  try {
    // 🔹 Cargar órdenes desde Firestore
    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );
    const snapshot = await getDocs(q);

    const ordenes = [];
    let ingresosPorDia = {};
    let ingresos = 0, costos = 0, ordenesCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      ordenes.push(data);
      const total = Number(data.total) || 0;
      const costo = Number(data.costoTotal) || 0;

      ingresos += total;
      costos += costo;
      ordenesCount++;

      const fecha = data.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;
    });

    const utilidad = ingresos - costos;

    // 🔹 Render KPIs
    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "Ingresos totales del taller")}
      ${crearKPI("📉 Costos", costos, "Costos de repuestos y servicios")}
      ${crearKPI("📈 Utilidad", utilidad, "Ganancia neta")}
      ${crearKPI("🧾 Órdenes", ordenesCount, "Número de órdenes procesadas")}
    `;

    // 🔹 Gráfica de ingresos
    renderGrafica(ingresosPorDia);

    // 🔹 Inicializar IA Advisor
    await initAdvisor(state.empresaId);

  } catch (e) {
    console.error("❌ Error dashboard:", e);
    container.innerHTML = `<p style='color:red;'>Error cargando dashboard: ${e.message}</p>`;
  }
}

/* ===============================
🎯 KPI CARD NEÓN
=============================== */
function crearKPI(titulo, valor, tooltip = "") {
  return `
    <div style="
      background:#111827;
      color:#0ff;
      padding:20px;
      border-radius:12px;
      text-align:center;
      box-shadow:0 0 20px #0ff;
      cursor:pointer;"
      title="${tooltip}"
    >
      <h3 style="font-size:18px;">${titulo}</h3>
      <p style="font-size:24px; font-weight:bold;">$${formatear(valor)}</p>
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
        borderColor: "#00ffcc",
        backgroundColor: "rgba(0,255,204,0.2)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#00ffcc",
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#0ff" } },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        x: { ticks: { color: "#0ff" }, grid: { color: "#0f172a" } },
        y: { ticks: { color: "#0ff" }, grid: { color: "#0f172a" } }
      }
    }
  });
}

/* ===============================
🧠 PANEL IA ADVANCED
=============================== */
async function initAdvisor(empresaId) {
  await Advisor.init({ empresaId });
  await actualizarAdvisor();
  renderSugerencias("iaPanel");

  // Botón para alertas habladas
  const iaPanel = document.getElementById("iaPanel");
  const btnVoz = document.createElement("button");
  btnVoz.innerHTML = "🎤 Escuchar alertas";
  btnVoz.style = `
    margin-top:10px;
    padding:10px;
    background:#00ff99;
    border:none;
    border-radius:8px;
    cursor:pointer;
  `;
  btnVoz.onclick = () => notificarAlertas();
  iaPanel.appendChild(btnVoz);
}

/* ===============================
💰 FORMATEAR MONEDA
=============================== */
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}