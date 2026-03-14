/**
 * contabilidad.js
 * Módulo Contabilidad Avanzada - TallerPRO360
 * Ruta: app/js/modules/contabilidad.js
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function contabilidad(container) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💼 Contabilidad</h1>

    <div class="card">
      <h3>Filtrar por fecha</h3>
      <input type="month" id="fechaInicio" style="padding:8px;margin-right:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input type="month" id="fechaFin" style="padding:8px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="btnGenerar" style="padding:10px 20px;margin-left:10px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Generar Reporte</button>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Balance General</h3>
      <div id="balanceGeneral">Cargando...</div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Estado de Resultados (P&L)</h3>
      <div id="estadoResultados">Cargando...</div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Alertas Financieras IA</h3>
      <div id="alertasIA">Esperando generación...</div>
    </div>
  `;

  document.getElementById("btnGenerar").onclick = generarReporte;

  // Cargar reporte inicial
  await generarReporte();
}

/* ===========================
GENERAR REPORTE CONTABLE
=========================== */
async function generarReporte() {
  const inicio = document.getElementById("fechaInicio").value;
  const fin = document.getElementById("fechaFin").value;

  // Convertir fechas
  const fechaInicio = inicio ? new Date(inicio + "-01") : new Date(new Date().getFullYear(), 0, 1);
  const fechaFin = fin ? new Date(fin + "-01") : new Date();

  // Balance General
  const balance = await calcularBalance(fechaInicio, fechaFin);
  document.getElementById("balanceGeneral").innerHTML = `
    <p>Activos: $${balance.activos}</p>
    <p>Pasivos: $${balance.pasivos}</p>
    <p>Patrimonio: $${balance.patrimonio}</p>
  `;

  // Estado de Resultados
  const resultados = await calcularEstadoResultados(fechaInicio, fechaFin);
  document.getElementById("estadoResultados").innerHTML = `
    <p>Ingresos: $${resultados.ingresos}</p>
    <p>Costos: $${resultados.costos}</p>
    <p>Gastos: $${resultados.gastos}</p>
    <p>Ganancia Neta: $${resultados.gananciaNeta}</p>
  `;

  // Alertas IA
  document.getElementById("alertasIA").innerHTML = await generarAlertasIA(resultados);
}

/* ===========================
CALCULAR BALANCE
=========================== */
async function calcularBalance(inicio, fin){
  // Ejemplo: integrar órdenes, inventario, caja y cuentas
  let activos = 0, pasivos = 0, patrimonio = 0;

  // Obtener inventario
  const invSnap = await getDocs(collection(db,"inventario"));
  invSnap.forEach(docSnap=>{
    const p = docSnap.data();
    activos += p.precio * p.stock || 0;
  });

  // Ingresos y gastos de finanzas
  const ordSnap = await getDocs(collection(db,"ordenes"));
  ordSnap.forEach(docSnap=>{
    const o = docSnap.data();
    const fecha = o.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      activos += o.estimatedRevenue || 0;
    }
  });

  // Pasivos (ejemplo: por pagar)
  const gastosSnap = await getDocs(collection(db,"gastos"));
  gastosSnap.forEach(docSnap=>{
    const g = docSnap.data();
    const fecha = g.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      pasivos += g.monto || 0;
    }
  });

  patrimonio = activos - pasivos;
  return {activos,pasivos,patrimonio};
}

/* ===========================
CALCULAR ESTADO DE RESULTADOS
=========================== */
async function calcularEstadoResultados(inicio, fin){
  let ingresos = 0, costos = 0, gastos = 0;

  const ordSnap = await getDocs(collection(db,"ordenes"));
  ordSnap.forEach(docSnap=>{
    const o = docSnap.data();
    const fecha = o.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      ingresos += o.estimatedRevenue || 0;
      costos += o.estimatedCost?.total || 0;
    }
  });

  const gastosSnap = await getDocs(collection(db,"gastos"));
  gastosSnap.forEach(docSnap=>{
    const g = docSnap.data();
    const fecha = g.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      gastos += g.monto || 0;
    }
  });

  const gananciaNeta = ingresos - costos - gastos;
  return {ingresos,costos,gastos,gananciaNeta};
}

/* ===========================
GENERAR ALERTAS IA
=========================== */
async function generarAlertasIA(resultados){
  if(!window.SuperAI) return "<p>SuperAI no disponible</p>";

  try{
    const alertas = await window.SuperAI.analyzeFinance(resultados);
    return alertas.map(a=>`<p>⚠️ ${a}</p>`).join("");
  } catch(e){
    console.error("Error IA alertas:",e);
    return "<p>❌ Error generando alertas</p>";
  }
}