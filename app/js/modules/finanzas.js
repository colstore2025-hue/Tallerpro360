/**
 * finanzas.js
 * Finanzas PRO360 · Producción estable (Modo SaaS limpio 🚀)
 */

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔥 DB GLOBAL */
const db = window.db;

export default async function finanzasModule(container, state) {

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ Empresa no definida
      </h2>
    `;
    return;
  }

  const base = `empresas/${state.empresaId}`;

  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">
      💰 Finanzas PRO360
    </h1>

    <div id="resumen"
      style="display:flex;flex-wrap:wrap;gap:20px;margin-top:20px;">
    </div>

    <canvas id="graficaFlujo"
      style="margin-top:30px;background:#111827;border-radius:12px;padding:15px;">
    </canvas>
  `;

  const resumenDiv = document.getElementById("resumen");

  try {

    /* ================= ORDENES ================= */

    const ordenesSnap = await getDocs(
      query(
        collection(db, `${base}/ordenes`),
        orderBy("creadoEn", "asc")
      )
    );

    /* ================= GASTOS ================= */

    const gastosSnap = await getDocs(
      query(
        collection(db, `${base}/finanzas`),
        orderBy("fecha", "asc")
      )
    );

    let ingresos = 0;
    let costos = 0;
    let utilidad = 0;
    let flujoPorDia = {};

    /* ================= PROCESAR ORDENES ================= */

    ordenesSnap.forEach(doc => {

      const o = doc.data() || {};

      const total = Number(o.total || 0);
      const costo = Number(o.costoTotal || 0);

      ingresos += total;
      costos += costo;
      utilidad += total - costo;

      let fecha = "sin_fecha";

      try {
        if (o.creadoEn?.toDate) {
          fecha = o.creadoEn.toDate().toISOString().split("T")[0];
        }
      } catch {}

      flujoPorDia[fecha] =
        (flujoPorDia[fecha] || 0) + (total - costo);

    });

    /* ================= PROCESAR GASTOS ================= */

    gastosSnap.forEach(doc => {

      const g = doc.data() || {};

      if (g.tipo === "gasto") {

        const monto = Number(g.monto || 0);

        costos += monto;
        utilidad -= monto;

        let fecha = "sin_fecha";

        try {
          if (g.fecha?.toDate) {
            fecha = g.fecha.toDate().toISOString().split("T")[0];
          }
        } catch {}

        flujoPorDia[fecha] =
          (flujoPorDia[fecha] || 0) - monto;
      }

    });

    /* ================= KPIs ================= */

    resumenDiv.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#00ff99")}
      ${crearKPI("📉 Costos", costos, "#ff0044")}
      ${crearKPI("📈 Utilidad", utilidad, "#00ffff")}
    `;

    /* ================= GRAFICA ================= */

    renderGrafica(ordenarDatos(flujoPorDia));

  } catch (e) {

    console.error("🔥 ERROR FINANZAS:", e);

    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ Error cargando finanzas
      </h2>
      <pre>${e.message}</pre>
    `;
  }

  /* ================= KPI ================= */

  function crearKPI(titulo, valor, color) {
    return `
      <div style="
        background:#111827;
        border-left:6px solid ${color};
        border-radius:12px;
        padding:20px;
        text-align:center;
        box-shadow:0 0 15px ${color}50;
      ">
        <h3 style="font-size:20px;">${titulo}</h3>
        <p style="
          font-size:28px;
          font-weight:bold;
          color:${color};
        ">
          $${fmt(valor)}
        </p>
      </div>
    `;
  }

  /* ================= GRAFICA ================= */

  function renderGrafica(data) {

    const ctx = document.getElementById("graficaFlujo");

    if (!ctx || typeof Chart === "undefined") return;

    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: "Flujo de caja",
          data: Object.values(data),
          borderColor: "#00ffcc",
          backgroundColor: "rgba(0,255,204,0.2)",
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
}