/**
 * dashboard.js
 * PRO360 Dashboard · NIVEL DIOS 🚀🧠
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

const db = window.db;

let chartInstance = null;

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="text-align:center;font-size:34px;color:#00ffcc;font-weight:900;">
      🚀 Dashboard PRO360 · IA Ejecutiva
    </h1>

    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin:30px 0;"></div>

    <canvas id="chart" style="background:#111827;border-radius:12px;padding:10px;"></canvas>

    <div id="topClientes" style="margin-top:30px;"></div>

    <div id="iaPanel" style="margin-top:40px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = "❌ Empresa no definida";
    return;
  }

  try {

    const snap = await getDocs(
      query(collection(db, `empresas/${state.empresaId}/ordenes`))
    );

    if (snap.empty) {
      container.innerHTML += "📭 Sin datos";
      return;
    }

    let ingresos = 0, costos = 0, ordenes = 0;
    let ingresosPorDia = {};
    let clientesMap = {};
    let alertas = [];

    snap.forEach(doc => {

      const d = doc.data() || {};

      const total = Number(d.valorTrabajo || 0);
      const costo = Number(d.costoTotal || 0);

      ingresos += total;
      costos += costo;
      ordenes++;

      /* ===== FECHA ===== */
      let fecha = "NA";
      try {
        fecha = d.creadoEn?.toDate?.().toISOString().split("T")[0];
      } catch {}

      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;

      /* ===== CLIENTES TOP ===== */
      const cliente = d.clienteId || "General";
      clientesMap[cliente] = (clientesMap[cliente] || 0) + total;

      /* ===== ALERTAS ===== */
      if (total < costo) {
        alertas.push(`⚠️ Orden con pérdida detectada`);
      }

    });

    const utilidad = ingresos - costos;
    const margen = ingresos ? (utilidad / ingresos) * 100 : 0;
    const ticket = ordenes ? ingresos / ordenes : 0;

    /* ================= IA PREDICTIVA ================= */

    const prediccion = ingresos * 1.08; // crecimiento 8%
    const crecimiento = ((prediccion - ingresos) / ingresos) * 100;

    /* ================= RENDER ================= */

    renderKPIs({ ingresos, costos, utilidad, ordenes, margen, ticket, prediccion });
    renderChart(ordenar(ingresosPorDia));
    renderTopClientes(clientesMap);
    renderIA({ alertas, crecimiento, prediccion });

  } catch (e) {
    container.innerHTML = "❌ Error cargando dashboard";
    console.error(e);
  }
}

/* ================= KPIs ================= */

function renderKPIs(d) {

  const k = document.getElementById("kpis");

  k.innerHTML = `
    ${card("💰 Ingresos", d.ingresos)}
    ${card("📉 Costos", d.costos)}
    ${card("📈 Utilidad", d.utilidad)}
    ${card("📊 Margen", d.margen.toFixed(2) + "%")}
    ${card("🎯 Ticket", d.ticket)}
    ${card("🔮 Proyección", d.prediccion)}
  `;
}

function card(t, v) {
  return `
    <div style="background:#0f172a;padding:20px;border-radius:12px;text-align:center;box-shadow:0 0 15px #00ffcc30;">
      <h3>${t}</h3>
      <p style="font-size:24px;color:#00ffcc;">${typeof v === "number" ? "$"+fmt(v) : v}</p>
    </div>
  `;
}

/* ================= GRÁFICA ================= */

function renderChart(data) {

  const ctx = document.getElementById("chart");

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Ingresos",
          data: Object.values(data),
          borderColor: "#00ffcc"
        }
      ]
    }
  });
}

/* ================= TOP CLIENTES ================= */

function renderTopClientes(map) {

  const div = document.getElementById("topClientes");

  const top = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5);

  div.innerHTML = `
    <h2 style="color:#0ff;">🏆 Top Clientes</h2>
    ${
      top.map(([c,v])=>`<p>${c} → $${fmt(v)}</p>`).join("")
    }
  `;
}

/* ================= IA ================= */

function renderIA({ alertas, crecimiento, prediccion }) {

  const div = document.getElementById("iaPanel");

  div.innerHTML = `
    <div style="background:#020617;padding:25px;border-radius:12px;box-shadow:0 0 20px #00ffcc;">
      
      <h2>🧠 IA Ejecutiva</h2>

      <p>📈 Crecimiento estimado: ${crecimiento.toFixed(2)}%</p>
      <p>🔮 Proyección: $${fmt(prediccion)}</p>

      <h3>⚠️ Alertas</h3>
      ${alertas.length ? alertas.map(a=>`<p>${a}</p>`).join("") : "Sin alertas"}

      <button id="voz">🎤 Hablar</button>

    </div>
  `;

  document.getElementById("voz").onclick = () => {
    const msg = new SpeechSynthesisUtterance(
      `Crecimiento proyectado ${crecimiento.toFixed(1)} por ciento`
    );
    speechSynthesis.speak(msg);
  };
}

/* ================= UTILS ================= */

function fmt(v){
  return new Intl.NumberFormat("es-CO").format(v || 0);
}

function ordenar(obj){
  return Object.fromEntries(
    Object.entries(obj).sort(([a],[b])=>new Date(a)-new Date(b))
  );
}