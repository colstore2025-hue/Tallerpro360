/**
 * dashboard.js
 * PRO360 Dashboard · Producción estable (Modo NASA 🚀 FIX)
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

const db = window.db;

let chartInstance = null;

/* ================= EXPORT ================= */

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="text-align:center;font-size:36px;color:#00ffcc;font-weight:900;">
      📊 Dashboard PRO360
    </h1>

    <div id="kpis"
      style="display:grid;
      grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
      gap:25px;margin:30px 0;">
    </div>

    <canvas id="graficaIngresos"
      style="background:#111827;border-radius:16px;padding:15px;">
    </canvas>

    <div id="iaPanel" style="margin-top:40px;"></div>
  `;

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;text-align:center;">❌ Empresa no definida</h2>`;
    return;
  }

  try {

    const ref = collection(db, `empresas/${state.empresaId}/ordenes`);
    const snapshot = await getDocs(query(ref));

    if (snapshot.empty) {
      container.innerHTML += `
        <p style="text-align:center;margin-top:40px;">
          📭 Sin datos aún
        </p>`;
      return;
    }

    let ingresos = 0;
    let costos = 0;
    let ordenes = 0;
    let ingresosPorDia = {};
    let alertas = [];
    let recomendaciones = [];

    snapshot.forEach(docSnap => {

      const d = docSnap.data() || {};

      const total = Number(d.valorTrabajo || 0);

      const costo = Array.isArray(d.costoEstimado)
        ? d.costoEstimado.reduce((sum, i) => sum + Number(i?.total || 0), 0)
        : 0;

      ingresos += total;
      costos += costo;
      ordenes++;

      /* ===== FECHA SEGURA ===== */
      let fecha = "sin_fecha";
      try {
        if (d.creadoEn?.toDate) {
          fecha = d.creadoEn.toDate().toISOString().split("T")[0];
        }
      } catch {}

      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;

      /* ===== ALERTAS SEGURAS ===== */
      try {
        const a = typeof d.alertasIA === "string"
          ? JSON.parse(d.alertasIA)
          : d.alertasIA;

        if (Array.isArray(a)) alertas.push(...a);

      } catch {}

      /* ===== RECOMENDACIONES SEGURAS ===== */
      try {
        const r = typeof d.diagnosticoIA?.recomendaciones === "string"
          ? JSON.parse(d.diagnosticoIA.recomendaciones)
          : d.diagnosticoIA?.recomendaciones;

        if (Array.isArray(r)) recomendaciones.push(...r);

      } catch {}

    });

    const utilidad = ingresos - costos;

    renderKPIs(ingresos, costos, utilidad, ordenes);
    renderGrafica(ordenarDatos(ingresosPorDia));
    renderIA({
      ingresos,
      costos,
      utilidad,
      ordenes,
      alertas,
      recomendaciones
    });

  } catch (e) {

    console.error("🔥 ERROR DASHBOARD:", e);

    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ Error cargando dashboard
      </h2>
      <pre>${e.message}</pre>
    `;
  }
}

/* ================= KPIs ================= */

function renderKPIs(ingresos, costos, utilidad, ordenes) {

  const kpis = document.getElementById("kpis");
  if (!kpis) return;

  kpis.innerHTML = `
    ${card("💰 Ingresos", ingresos, "#00ff99")}
    ${card("📉 Costos", costos, "#ff0044")}
    ${card("📈 Utilidad", utilidad, "#00ffff")}
    ${card("🧾 Órdenes", ordenes, "#ffcc00")}
  `;
}

function card(titulo, valor, color) {
  return `
    <div style="
      background:#111827;
      border-left:8px solid ${color};
      border-radius:16px;
      padding:25px;
      text-align:center;
      box-shadow:0 0 25px ${color}40;
    ">
      <h3>${titulo}</h3>

      <p style="
        font-size:30px;
        font-weight:900;
        color:${color};
      ">
        ${titulo.includes("Órdenes") ? valor : "$" + fmt(valor)}
      </p>
    </div>
  `;
}

/* ================= GRÁFICA ================= */

function renderGrafica(data) {

  const ctx = document.getElementById("graficaIngresos");

  if (!ctx) return;

  /* 🔥 destruir gráfico anterior */
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Ingresos",
        data: Object.values(data),
        borderColor: "#00ffcc",
        backgroundColor: "rgba(0,255,204,0.15)",
        borderWidth: 3,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#00ffcc" }
        }
      }
    }
  });
}

/* ================= IA ================= */

function renderIA(data) {

  const panel = document.getElementById("iaPanel");
  if (!panel) return;

  const margen = data.ingresos
    ? ((data.utilidad / data.ingresos) * 100).toFixed(2)
    : 0;

  const ticket = data.ordenes
    ? (data.ingresos / data.ordenes).toFixed(0)
    : 0;

  panel.innerHTML = `
    <div style="
      background:#0f172a;
      padding:30px;
      border-radius:16px;
      box-shadow:0 0 30px #00ff99;
    ">

      <h2 style="color:#00ffcc;">🧠 IA Gerente</h2>

      <p>💰 Ingresos: $${fmt(data.ingresos)}</p>
      <p>📉 Costos: $${fmt(data.costos)}</p>
      <p>📈 Utilidad: $${fmt(data.utilidad)}</p>
      <p>📊 Margen: ${margen}%</p>
      <p>🎯 Ticket: $${fmt(ticket)}</p>

      <h3 style="color:#ff4444;">⚠️ Alertas</h3>
      ${
        data.alertas?.length
          ? data.alertas.map(a => `<p style="color:#ff4444;">${a}</p>`).join("")
          : "<p>Sin alertas</p>"
      }

      <h3 style="color:#00ffcc;">🚀 Recomendaciones</h3>
      ${
        data.recomendaciones?.length
          ? data.recomendaciones.map(r => `<p style="color:#00ff99;">${r}</p>`).join("")
          : "<p>Sin recomendaciones</p>"
      }

      <button id="vozGerente"
        style="
          margin-top:20px;
          padding:12px;
          background:#00ff99;
          border:none;
          border-radius:10px;
          font-weight:bold;
          cursor:pointer;
        ">
        🎤 Escuchar IA
      </button>

    </div>
  `;

  /* 🔊 VOZ REAL */
  document.getElementById("vozGerente").onclick = async () => {

    try {

      const { hablar } = await import("../voice/voiceCore.js");

      hablar(`
        Ingresos ${fmt(data.ingresos)},
        utilidad ${fmt(data.utilidad)},
        margen ${margen} por ciento
      `);

    } catch {
      alert("🎤 Voz no disponible");
    }

  };
}

/* ================= UTILS ================= */

function fmt(v) {
  return new Intl.NumberFormat("es-CO").format(v || 0);
}

function ordenarDatos(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(
      ([a], [b]) => new Date(a) - new Date(b)
    )
  );
}