/**
 * reportes.js
 * Dashboard de reportes PRO360 · Nivel Tesla (FIX FINAL)
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { analizarNegocio } from "../ai/aiManager.js";
import XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

export default async function reportesModule(container, state) {

  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 12px #0ff;">📊 Reportes PRO360 · Nivel Tesla</h1>

    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-top:20px;"></div>

    <canvas id="chartIngresos" style="margin-top:30px; background:#111827; border-radius:10px; padding:10px;"></canvas>

    <div style="margin-top:20px;">
      <button id="exportPDF">📄 Exportar PDF</button>
      <button id="exportExcel">📊 Exportar Excel</button>
    </div>

    <div id="reportesTabla" style="margin-top:20px;"></div>
    <div id="panelIA" style="margin-top:20px;"></div>
  `;

  const kpiDiv = document.getElementById("kpis");
  const tablaDiv = document.getElementById("reportesTabla");
  const panelIA = document.getElementById("panelIA");
  const chartCtx = document.getElementById("chartIngresos").getContext("2d");

  let chartInstance;

  /* =========================
  CARGAR DATOS
  ========================= */
  async function cargarDatos() {

    try {

      const snap = await getDocs(
        query(collection(db, "ordenes"), where("empresaId", "==", state.empresaId))
      );

      let ingresos = 0;
      let costos = 0;
      let totalOrdenes = 0;

      let dataTabla = [];
      let ingresosMes = {};

      snap.forEach(doc => {

        const o = doc.data();

        const t = Number(o.total || 0);
        const c = Number(o.costoTotal || 0);

        ingresos += t;
        costos += c;
        totalOrdenes++;

        const fecha = o.creadoEn?.toDate?.() || new Date();

        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}`;

        ingresosMes[mes] = (ingresosMes[mes] || 0) + t;

        dataTabla.push({
          orden: doc.id,
          cliente: o.clienteId || "N/A",
          vehiculo: o.vehiculoId || "N/A",
          total: t,
          costo: c,
          utilidad: t - c,
          estado: o.estado || "N/A",
          fecha: fecha.toISOString().split("T")[0]
        });

      });

      const utilidad = ingresos - costos;

      /* ================= KPI ================= */

      kpiDiv.innerHTML = `
        ${crearKPI("💰 Ingresos", ingresos, "#00ff99")}
        ${crearKPI("📉 Costos", costos, "#ff0044")}
        ${crearKPI("📈 Utilidad", utilidad, "#00ffff")}
        ${crearKPI("🧾 Órdenes", totalOrdenes, "#ffcc00")}
      `;

      /* ================= GRAFICO ================= */

      const meses = Object.keys(ingresosMes).sort();
      const valores = meses.map(m => ingresosMes[m]);

      if (chartInstance) chartInstance.destroy();

      chartInstance = new Chart(chartCtx, {
        type: "line",
        data: {
          labels: meses,
          datasets: [{
            label: "Ingresos por mes",
            data: valores,
            borderColor: "#0ff",
            backgroundColor: "#0ff33",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color:"#fff" } }
          },
          scales: {
            x: { ticks: { color:"#0ff" } },
            y: { ticks: { color:"#0ff" } }
          }
        }
      });

      renderTabla(dataTabla);

      /* ================= IA ================= */

      try {

        const iaData = await analizarNegocio({
          ordenes: dataTabla,
          empresaId: state.empresaId,
          resumen: { ingresos, costos, utilidad }
        });

        if (iaData) renderIA(iaData);

      } catch (e) {
        console.warn("⚠️ IA reportes falló:", e);
      }

      /* ================= EXPORT ================= */

      document.getElementById("exportExcel").onclick = () => exportExcel(dataTabla);
      document.getElementById("exportPDF").onclick = () => exportPDF(dataTabla);

    } catch (e) {

      console.error(e);
      tablaDiv.innerHTML = "❌ Error cargando reportes";

    }
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
      ">
        <h3 style="color:${color};">${titulo}</h3>
        <p style="font-size:26px;color:${color};">$${formatear(valor)}</p>
      </div>
    `;
  }

  /* ================= TABLA ================= */

  function renderTabla(data) {
    tablaDiv.innerHTML = `
      <table style="width:100%; color:#0ff;">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            <th>Total</th>
            <th>Costo</th>
            <th>Utilidad</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => `
            <tr>
              <td>${d.orden}</td>
              <td>${d.cliente}</td>
              <td>${d.vehiculo}</td>
              <td>$${formatear(d.total)}</td>
              <td>$${formatear(d.costo)}</td>
              <td>$${formatear(d.utilidad)}</td>
              <td>${d.estado}</td>
              <td>${d.fecha}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  /* ================= EXCEL ================= */

  function exportExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "Reporte_PRO360.xlsx");
  }

  /* ================= PDF ================= */

  async function exportPDF(data) {

    const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

    const doc = new jsPDF();

    doc.text("Reporte PRO360", 10, 10);

    let y = 20;

    data.forEach((d) => {

      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        `Orden:${d.orden} | $${formatear(d.total)} | ${d.estado}`,
        10,
        y
      );

      y += 8;

    });

    doc.save("Reporte_PRO360.pdf");
  }

  /* ================= IA PANEL ================= */

  function renderIA(data) {

    const alertas = data?.alertas || [];
    const recomendaciones = data?.recomendaciones || [];

    panelIA.innerHTML = `
      <div style="background:#0f172a; padding:15px; border-radius:10px;">
        <h2 style="color:#0ff;">🧠 IA Recomendaciones</h2>

        <h3>⚠️ Alertas</h3>
        ${alertas.length ? alertas.map(a => `<p style="color:red;">${a}</p>`).join("") : "Sin alertas"}

        <h3>🚀 Recomendaciones</h3>
        ${recomendaciones.length ? recomendaciones.map(r => `<p>${r}</p>`).join("") : "Sin recomendaciones"}
      </div>
    `;
  }

  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  /* ================= INIT ================= */

  cargarDatos();
}