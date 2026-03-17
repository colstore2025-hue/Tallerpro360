/**
 * reportes.js
 * Dashboard de reportes PRO360 · Nivel Tesla
 * KPI dinámicos + IA + Alertas + Export PDF/Excel + Gráficos
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { analizarNegocio } from "../ai/aiManager.js";
import { saveAs } from "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
import XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

export default async function reportesModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 12px #0ff;">📊 Reportes PRO360 · Nivel Tesla</h1>
    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-top:20px;"></div>
    <canvas id="chartIngresos" style="margin-top:30px; background:#111827; border-radius:10px; padding:10px;"></canvas>
    <div style="margin-top:20px;">
      <button id="exportPDF" style="margin-right:10px;">📄 Exportar PDF</button>
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

  // 🔄 Cargar y procesar datos
  async function cargarDatos() {
    try {
      const ordenesSnap = await getDocs(
        query(collection(db, "ordenes"), where("empresaId", "==", state.empresaId))
      );

      let ingresos = 0, costos = 0, utilidad = 0, totalOrdenes = 0;
      let dataTabla = [];
      let ingresosMes = {}; // Para gráfico mensual

      ordenesSnap.forEach(doc => {
        const o = doc.data();
        const t = Number(o.total || 0);
        const c = Number(o.costoTotal || 0);
        ingresos += t;
        costos += c;
        utilidad += t - c;
        totalOrdenes++;

        const fecha = o.creadoEn?.toDate?.() || new Date();
        const mes = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}`;
        ingresosMes[mes] = (ingresosMes[mes] || 0) + t;

        dataTabla.push({
          orden: doc.id,
          cliente: o.clienteId,
          vehiculo: o.vehiculoId,
          total: t,
          costo: c,
          utilidad: t - c,
          estado: o.estado,
          fecha: fecha.toISOString().split('T')[0]
        });
      });

      // 🎯 KPI Cards
      kpiDiv.innerHTML = `
        ${crearKPI("💰 Ingresos", ingresos, "#00ff99")}
        ${crearKPI("📉 Costos", costos, "#ff0044")}
        ${crearKPI("📈 Utilidad", utilidad, "#00ffff")}
        ${crearKPI("🧾 Órdenes", totalOrdenes, "#ffcc00")}
      `;

      // 📈 Gráfico de ingresos por mes
      const meses = Object.keys(ingresosMes).sort();
      const valores = meses.map(m => ingresosMes[m]);
      if(chartInstance) chartInstance.destroy();
      chartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
          labels: meses,
          datasets: [{
            label: 'Ingresos por mes',
            data: valores,
            borderColor: '#0ff',
            backgroundColor: '#0ff33',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color:'#fff' } }
          },
          scales: {
            x: { ticks: { color:'#0ff' }, grid:{ color:'#222' } },
            y: { ticks: { color:'#0ff' }, grid:{ color:'#222' } }
          }
        }
      });

      renderTabla(dataTabla);

      // 🧠 Panel IA
      const iaData = await analizarNegocio(state, dataTabla);
      if(iaData) renderIA(iaData);

      // Export buttons
      document.getElementById("exportExcel").onclick = () => exportExcel(dataTabla);
      document.getElementById("exportPDF").onclick = () => exportPDF(dataTabla);

    } catch(e) {
      console.error(e);
      tablaDiv.innerHTML = "❌ Error cargando reportes";
    }
  }

  // 📊 KPI Card
  function crearKPI(titulo, valor, color="#0ff") {
    return `
      <div style="
        background:#111827;
        border-left:6px solid ${color};
        border-radius:12px;
        padding:20px;
        text-align:center;
        box-shadow:0 0 15px ${color}50;
      ">
        <h3 style="font-size:20px; color:${color};">${titulo}</h3>
        <p style="font-size:28px; font-weight:bold; color:${color};">$${formatear(valor)}</p>
      </div>
    `;
  }

  // 📋 Tabla detallada
  function renderTabla(data) {
    tablaDiv.innerHTML = `
      <table style="width:100%; border-collapse:collapse; color:#0ff;">
        <thead style="background:#111;">
          <tr>
            <th style="border:1px solid #0f172a; padding:6px;">Orden</th>
            <th style="border:1px solid #0f172a; padding:6px;">Cliente</th>
            <th style="border:1px solid #0f172a; padding:6px;">Vehículo</th>
            <th style="border:1px solid #0f172a; padding:6px;">Total</th>
            <th style="border:1px solid #0f172a; padding:6px;">Costo</th>
            <th style="border:1px solid #0f172a; padding:6px;">Utilidad</th>
            <th style="border:1px solid #0f172a; padding:6px;">Estado</th>
            <th style="border:1px solid #0f172a; padding:6px;">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => `
            <tr>
              <td style="border:1px solid #0f172a; padding:4px;">${d.orden}</td>
              <td style="border:1px solid #0f172a; padding:4px;">${d.cliente}</td>
              <td style="border:1px solid #0f172a; padding:4px;">${d.vehiculo}</td>
              <td style="border:1px solid #0f172a; padding:4px;">$${formatear(d.total)}</td>
              <td style="border:1px solid #0f172a; padding:4px;">$${formatear(d.costo)}</td>
              <td style="border:1px solid #0f172a; padding:4px;">$${formatear(d.utilidad)}</td>
              <td style="border:1px solid #0f172a; padding:4px;">${d.estado}</td>
              <td style="border:1px solid #0f172a; padding:4px;">${d.fecha}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // ==========================
  // EXPORT EXCEL
  // ==========================
  function exportExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "Reporte_PRO360.xlsx");
  }

  // ==========================
  // EXPORT PDF
  // ==========================
  async function exportPDF(data) {
    const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    const doc = new jsPDF.jsPDF();
    doc.setFontSize(12);
    doc.setTextColor(15, 255, 255);
    doc.text("Reporte PRO360", 10, 10);

    data.forEach((d, i) => {
      const y = 20 + i * 8;
      if(y > 280){ doc.addPage(); y=20; }
      doc.text(`Orden: ${d.orden} | Cliente: ${d.cliente} | Total: $${formatear(d.total)} | Estado: ${d.estado}`, 10, y);
    });

    doc.save("Reporte_PRO360.pdf");
  }

  // ==========================
  // PANEL IA
  // ==========================
  function renderIA(data) {
    panelIA.innerHTML = `
      <div style="background:#0f172a; padding:15px; border-radius:10px; box-shadow:0 0 20px #0ff;">
        <h2 style="color:#0ff;">🧠 IA Recomendaciones</h2>
        <p>Ingresos estimados: $${formatear(data.resumen.ingresos)}</p>
        <p>Costos estimados: $${formatear(data.resumen.costos)}</p>
        <p>Utilidad: $${formatear(data.resumen.utilidad)}</p>
        <h3 style="color:#00ff99;">⚠️ Alertas</h3>
        ${data.alertas.map(a => `<p style="color:#ff4444;">${a}</p>`).join("")}
        <h3 style="color:#00ffff;">🚀 Recomendaciones</h3>
        ${data.recomendaciones.map(r => `<p style="color:#00ffcc;">${r}</p>`).join("")}
      </div>
    `;
  }

  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarDatos();
}