/**
 * contabilidad.js
 * Módulo de Contabilidad Avanzada - TallerPRO360
 * Balance, P&L y Reportes contables
 * Ruta: app/js/modules/contabilidad.js
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatCurrency } from "../core/utils.js"; // función utilitaria para formato de moneda

export async function contabilidad(container) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💼 Contabilidad</h1>

    <div class="card" style="margin-bottom:20px;">
      <h3>Filtros</h3>
      <label>Mes:</label>
      <input type="month" id="mesContabilidad" style="padding:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="cargarReporte" style="margin-left:10px;padding:6px 12px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Generar Reporte</button>
    </div>

    <div class="card" id="resumenContabilidad" style="margin-bottom:20px;">
      <h3>Resumen Contable</h3>
      <p>Seleccione un mes y haga clic en "Generar Reporte"</p>
    </div>

    <div class="card" id="detallesContabilidad">
      <h3>Detalles de Movimientos</h3>
      <p>Sin datos aún.</p>
    </div>
  `;

  document.getElementById("cargarReporte").onclick = async () => {
    const mesInput = document.getElementById("mesContabilidad").value;
    if(!mesInput) return alert("Seleccione un mes");
    const [anio, mes] = mesInput.split("-").map(Number);
    await generarReporte(anio, mes);
  };
}

/* ===================================
GENERAR REPORTE CONTABLE
=================================== */
async function generarReporte(anio, mes){

  const resumen = document.getElementById("resumenContabilidad");
  const detalles = document.getElementById("detallesContabilidad");

  resumen.innerHTML = "Cargando datos contables...";
  detalles.innerHTML = "Cargando movimientos...";

  try {
    // =========================
    // Obtener ingresos y gastos desde Firestore
    // =========================
    const ingresosSnap = await getDocs(collection(db,"finanzasIngresos"));
    const gastosSnap = await getDocs(collection(db,"finanzasGastos"));

    let ingresos = 0, gastos = 0;
    const movimientos = [];

    ingresosSnap.forEach(docSnap => {
      const m = docSnap.data();
      const fecha = new Date(m.fecha.seconds * 1000);
      if(fecha.getFullYear() === anio && fecha.getMonth()+1 === mes){
        ingresos += m.monto || 0;
        movimientos.push({...m, tipo:"Ingreso"});
      }
    });

    gastosSnap.forEach(docSnap => {
      const m = docSnap.data();
      const fecha = new Date(m.fecha.seconds * 1000);
      if(fecha.getFullYear() === anio && fecha.getMonth()+1 === mes){
        gastos += m.monto || 0;
        movimientos.push({...m, tipo:"Gasto"});
      }
    });

    const balance = ingresos - gastos;

    // =========================
    // Renderizar resumen
    // =========================
    resumen.innerHTML = `
      <h3>Resumen ${anio}-${String(mes).padStart(2,"0")}</h3>
      <p>Ingresos: <b>${formatCurrency(ingresos)}</b></p>
      <p>Gastos: <b>${formatCurrency(gastos)}</b></p>
      <p>Balance: <b>${formatCurrency(balance)}</b></p>
    `;

    // =========================
    // Renderizar movimientos
    // =========================
    if(movimientos.length === 0){
      detalles.innerHTML = "<p>No hay movimientos registrados para este mes.</p>";
      return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #333;"><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Monto</th></tr>`;

    movimientos.sort((a,b)=>b.fecha.seconds - a.fecha.seconds);

    movimientos.forEach(m=>{
      const fecha = new Date(m.fecha.seconds * 1000).toLocaleDateString();
      html += `<tr>
        <td>${fecha}</td>
        <td>${m.tipo}</td>
        <td>${m.descripcion || "-"}</td>
        <td>${formatCurrency(m.monto)}</td>
      </tr>`;
    });

    html += "</table>";
    detalles.innerHTML = html;

  } catch(error){
    console.error("Error generando reporte contable:",error);
    resumen.innerHTML = "❌ Error cargando datos contables";
    detalles.innerHTML = "";
  }

}