/**
 * contabilidad.js
 * Contabilidad Avanzada + IA - TallerPRO360
 * Balance, P&L, Movimientos y Alertas inteligentes
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";
import jsPDF from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import { formatCurrency } from "../core/utils.js";

// Simulación de IA contable
async function IAContable(ingresos, gastos, balance) {
  const alerts = [];
  if(balance < 0) alerts.push("⚠️ Balance negativo, revisar gastos urgentes");
  if(ingresos < gastos*0.8) alerts.push("⚠️ Los ingresos están bajos respecto a gastos");
  if(balance > 1000000) alerts.push("✅ Excelente balance, posibilidad de reinversión");
  return alerts;
}

export async function contabilidad(container){
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💼 Contabilidad Avanzada + IA</h1>

    <div class="card" style="margin-bottom:20px;">
      <h3>Filtros</h3>
      <label>Mes:</label>
      <input type="month" id="mesContabilidad" style="padding:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="cargarReporte" style="margin-left:10px;padding:6px 12px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Generar Reporte</button>
      <button id="exportPDF" style="margin-left:10px;padding:6px 12px;background:#3b82f6;border:none;border-radius:6px;color:white;cursor:pointer;">Exportar PDF</button>
    </div>

    <div class="card" id="resumenContabilidad" style="margin-bottom:20px;">
      <h3>Resumen Contable</h3>
      <p>Seleccione un mes y haga clic en "Generar Reporte"</p>
    </div>

    <div class="card" id="detallesContabilidad" style="margin-bottom:20px;">
      <h3>Detalles de Movimientos</h3>
      <p>Sin datos aún.</p>
    </div>

    <div class="card" id="alertasIA" style="margin-bottom:20px;">
      <h3>Alertas IA</h3>
      <p>Sin alertas</p>
    </div>

    <div class="card">
      <h3>Gráficos</h3>
      <canvas id="chartContabilidad" height="200"></canvas>
    </div>
  `;

  const btnReporte = document.getElementById("cargarReporte");
  const btnPDF = document.getElementById("exportPDF");

  btnReporte.onclick = async () => {
    const mesInput = document.getElementById("mesContabilidad").value;
    if(!mesInput) return alert("Seleccione un mes");
    const [anio, mes] = mesInput.split("-").map(Number);
    await generarReporteIA(anio, mes);
  };

  btnPDF.onclick = exportarPDF;
}

/* ===================================
REPORTE + IA
=================================== */
let chartInstance = null;

async function generarReporteIA(anio, mes){
  const resumen = document.getElementById("resumenContabilidad");
  const detalles = document.getElementById("detallesContabilidad");
  const alertas = document.getElementById("alertasIA");

  resumen.innerHTML = "Cargando datos contables...";
  detalles.innerHTML = "Cargando movimientos...";
  alertas.innerHTML = "Analizando alertas IA...";

  try {
    const ingresosSnap = await getDocs(collection(db,"finanzasIngresos"));
    const gastosSnap = await getDocs(collection(db,"finanzasGastos"));

    let ingresos = 0, gastos = 0;
    const movimientos = [];
    const cuentas = {};

    ingresosSnap.forEach(docSnap => {
      const m = docSnap.data();
      const fecha = new Date(m.fecha.seconds * 1000);
      if(fecha.getFullYear() === anio && fecha.getMonth()+1 === mes){
        ingresos += m.monto || 0;
        movimientos.push({...m, tipo:"Ingreso"});
        cuentas[m.cuenta] = (cuentas[m.cuenta] || 0) + m.monto;
      }
    });

    gastosSnap.forEach(docSnap => {
      const m = docSnap.data();
      const fecha = new Date(m.fecha.seconds * 1000);
      if(fecha.getFullYear() === anio && fecha.getMonth()+1 === mes){
        gastos += m.monto || 0;
        movimientos.push({...m, tipo:"Gasto"});
        cuentas[m.cuenta] = (cuentas[m.cuenta] || 0) - m.monto;
      }
    });

    const balance = ingresos - gastos;

    resumen.innerHTML = `
      <h3>Resumen ${anio}-${String(mes).padStart(2,"0")}</h3>
      <p>Ingresos: <b>${formatCurrency(ingresos)}</b></p>
      <p>Gastos: <b>${formatCurrency(gastos)}</b></p>
      <p>Balance: <b>${formatCurrency(balance)}</b></p>
    `;

    // Movimientos
    if(movimientos.length === 0){
      detalles.innerHTML = "<p>No hay movimientos registrados para este mes.</p>";
    } else {
      let html = `<table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #333;"><th>Fecha</th><th>Tipo</th><th>Cuenta</th><th>Concepto</th><th>Monto</th></tr>`;
      movimientos.sort((a,b)=>b.fecha.seconds - a.fecha.seconds);
      movimientos.forEach(m=>{
        const fecha = new Date(m.fecha.seconds * 1000).toLocaleDateString();
        html += `<tr>
          <td>${fecha}</td>
          <td>${m.tipo}</td>
          <td>${m.cuenta || "-"}</td>
          <td>${m.descripcion || "-"}</td>
          <td>${formatCurrency(m.monto)}</td>
        </tr>`;
      });
      html += "</table>";
      detalles.innerHTML = html;
    }

    // Alertas IA
    const alerts = await IAContable(ingresos, gastos, balance);
    alertas.innerHTML = alerts.length ? alerts.map(a=>`<p>${a}</p>`).join("") : "<p>✅ Todo en orden</p>";

    // Gráfico P&L
    renderChart(cuentas);

  } catch(error){
    console.error("Error generando reporte contable IA:",error);
    resumen.innerHTML = "❌ Error cargando datos contables";
    detalles.innerHTML = "";
    alertas.innerHTML = "";
  }
}

/* ===================================
GRAFICO P&L
=================================== */
function renderChart(cuentas){
  const ctx = document.getElementById("chartContabilidad").getContext("2d");
  const labels = Object.keys(cuentas);
  const data = Object.values(cuentas);

  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx,{
    type: 'bar',
    data: {
      labels,
      datasets:[{
        label: 'Ingresos/Gastos por cuenta',
        data,
        backgroundColor: data.map(v => v>=0 ? '#16a34a' : '#dc2626')
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        title:{display:true,text:'P&L por cuentas contables'}
      }
    }
  });
}

/* ===================================
EXPORTAR PDF
=================================== */
async function exportarPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const resumen = document.getElementById("resumenContabilidad").innerText;
  const detalles = document.getElementById("detallesContabilidad").innerText;
  const alertas = document.getElementById("alertasIA").innerText;

  doc.setFontSize(14);
  doc.text("Reporte Contable + IA - TallerPRO360", 10, 10);
  doc.setFontSize(12);
  doc.text(resumen, 10, 20);
  doc.text(detalles, 10, 40);
  doc.text(alertas, 10, 60);
  doc.save(`ContabilidadIA-${new Date().toISOString().slice(0,10)}.pdf`);
}