/*
================================================
FINANZAS.JS - Dashboard Financiero Avanzado
Módulo de KPIs y gráficas inteligentes
Ubicación: /app/js/modules/finanzas.js
================================================
*/

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function (container, state) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💰 Finanzas del Taller</h1>

    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px;"></div>

    <canvas id="graficoIngresos" height="100"></canvas>
  `;

  const kpis = document.getElementById("kpis");
  let chartInstance = null;

  async function cargarFinanzas() {
    try {

      // 🔐 FILTRO SaaS por empresa
      const q = query(
        collection(window.db, "ordenes"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);

      let totalIngresos = 0;
      let totalCostos = 0;
      let totalUtilidad = 0;
      let ordenesCompletadas = 0;

      const ingresosPorDia = {};

      snap.forEach(doc => {
        const o = doc.data() || {};

        const total = Number(o.total || o.valorTrabajo || 0);
        const costo = Number(o.costoTotal || o.diagnosticoIA?.costoestimado || 0);

        totalIngresos += total;
        totalCostos += costo;

        if (o.estado === "finalizada") {
          ordenesCompletadas++;
        }

        // 📅 Fecha segura
        let fecha = "sin_fecha";
        if (o.creadoEn?.toDate) {
          fecha = o.creadoEn.toDate().toISOString().split("T")[0];
        }
        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;
      });

      totalUtilidad = totalIngresos - totalCostos;

      // 📊 KPIs
      kpis.innerHTML = `
        ${crearKPI("💵 Ingresos", totalIngresos)}
        ${crearKPI("💸 Costos", totalCostos)}
        ${crearKPI("📈 Utilidad", totalUtilidad)}
        ${crearKPI("🧾 Órdenes finalizadas", ordenesCompletadas)}
      `;

      renderGrafica(ingresosPorDia);

    } catch (e) {
      console.error(e);
      container.innerHTML = "❌ Error cargando finanzas";
    }
  }

  // 🎯 KPI CARD
  function crearKPI(titulo, valor) {
    return `
      <div style="
        background:#111827;
        padding:20px;
        border-radius:12px;
        text-align:center;
        box-shadow:0 0 10px rgba(0,255,153,0.3);
      ">
        <h3>${titulo}</h3>
        <p style="font-size:20px;">$${formatear(valor)}</p>
      </div>
    `;
  }

  // 📈 GRÁFICA DE INGRESOS
  function renderGrafica(data) {

    const ctx = document.getElementById("graficoIngresos");
    if (!ctx) return;

    // 🔥 Destruir gráfico anterior
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: "Ingresos por día",
          data: Object.values(data),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.2)",
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: "Fecha" } },
          y: { title: { display: true, text: "Ingresos ($)" }, beginAtZero: true }
        }
      }
    });
  }

  // 💰 FORMATEAR DINERO
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarFinanzas();
}