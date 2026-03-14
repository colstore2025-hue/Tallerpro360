/**
 * dashboard.js
 * Panel avanzado para gerentes de taller - TallerPRO360 ERP
 * Versión Final Avanzada
 */

import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { configuracion } from "./configuracion.js";
import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { calcularPredicciones } from "../ai/aiMetrics.js";

export async function dashboard(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">🚀 Dashboard Gerente - TallerPRO360</h1>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
  <button id="btnClientes" class="btn-primary">👥 Clientes</button>
  <button id="btnOrdenes" class="btn-primary">🛠 Órdenes</button>
  <button id="btnInventario" class="btn-primary">📦 Inventario</button>
  <button id="btnConfiguracion" class="btn-primary">⚙ Configuración</button>
</div>

<!-- KPIs principales -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:25px;">
  <div class="card">
    <h3>Órdenes activas</h3>
    <p id="ordenesActivas" style="font-size:28px;">0</p>
  </div>
  <div class="card">
    <h3>Órdenes completadas hoy</h3>
    <p id="ordenesCompletadas" style="font-size:28px;">0</p>
  </div>
  <div class="card">
    <h3>Ingresos hoy</h3>
    <p id="ingresosHoy" style="font-size:28px;">$0</p>
  </div>
  <div class="card">
    <h3>Margen de utilidad promedio</h3>
    <p id="margenUtilidad" style="font-size:28px;">0%</p>
  </div>
  <div class="card">
    <h3>Tiempo promedio de reparación</h3>
    <p id="tiempoPromedio" style="font-size:28px;">0h</p>
  </div>
  <div class="card">
    <h3>Stock crítico</h3>
    <p id="stockCritico" style="font-size:28px;">0</p>
  </div>
</div>

<!-- Órdenes recientes -->
<div class="card">
  <h2>📋 Órdenes recientes</h2>
  <div id="ordenesRecientes">Cargando...</div>
</div>

<!-- Recomendaciones IA -->
<div class="card">
  <h2>🤖 Recomendaciones IA</h2>
  <div id="recomendacionesIA" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;">
    Cargando sugerencias...
  </div>
</div>
`;

  // ===========================
  // Botones de navegación rápida
  // ===========================
  document.getElementById("btnClientes").onclick = () => clientes(container);
  document.getElementById("btnOrdenes").onclick = () => ordenes(container);
  document.getElementById("btnInventario").onclick = () => inventario(container);
  document.getElementById("btnConfiguracion").onclick = () => configuracion(container);

  // ===========================
  // Cargar datos operativos
  // ===========================
  await cargarKPIs();
  await cargarOrdenes();
  await cargarRecomendacionesIA();
}

/* ===========================
CARGAR KPIs
=========================== */
async function cargarKPIs(){
  try{
    const clientesSnap = await getDocs(collection(db,"clientes"));
    const ordenesSnap = await getDocs(collection(db,"ordenes"));
    const inventarioSnap = await getDocs(collection(db,"inventario"));

    const hoy = new Date().toDateString();

    let ingresosHoy = 0;
    let completadasHoy = 0;
    let tiempoTotal = 0;
    let margenTotal = 0;

    ordenesSnap.docs.forEach(doc=>{
      const o = doc.data();
      const fechaOrden = o.fecha.toDate().toDateString();
      if(fechaOrden === hoy){
        ingresosHoy += o.total || 0;
        if(o.estado === "completada") completadasHoy++;
      }
      if(o.estado === "completada" && o.tiempoReparacion){
        tiempoTotal += o.tiempoReparacion;
      }
      if(o.margen) margenTotal += o.margen;
    });

    const tiempoPromedio = ordenesSnap.docs.length ? (tiempoTotal / ordenesSnap.docs.length).toFixed(1) : 0;
    const margenPromedio = ordenesSnap.docs.length ? (margenTotal / ordenesSnap.docs.length).toFixed(1) : 0;

    // Stock crítico
    const stockCritico = inventarioSnap.docs.filter(p=>p.data().stock <= 3).length;

    document.getElementById("ordenesActivas").innerText = ordenesSnap.docs.filter(o=>o.data().estado!=="completada").length;
    document.getElementById("ordenesCompletadas").innerText = completadasHoy;
    document.getElementById("ingresosHoy").innerText = `$${ingresosHoy}`;
    document.getElementById("margenUtilidad").innerText = `${margenPromedio}%`;
    document.getElementById("tiempoPromedio").innerText = `${tiempoPromedio}h`;
    document.getElementById("stockCritico").innerText = stockCritico;

  }catch(e){
    console.error("Error cargando KPIs:", e);
  }
}

/* ===========================
CARGAR ÓRDENES RECIENTES
=========================== */
async function cargarOrdenes(){
  try{
    const q = query(collection(db,"ordenes"), orderBy("fecha","desc"), limit(5));
    const snapshot = await getDocs(q);

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;"><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Total</th></tr>`;

    snapshot.forEach(doc=>{
      const o = doc.data();
      html += `<tr>
        <td>${o.cliente || "-"}</td>
        <td>${o.vehiculo || "-"}</td>
        <td>${o.estado || "En proceso"}</td>
        <td>$${o.total || 0}</td>
      </tr>`;
    });

    html += "</table>";
    document.getElementById("ordenesRecientes").innerHTML = html;
  }catch(e){
    console.error("Error cargando órdenes recientes:", e);
    document.getElementById("ordenesRecientes").innerText = "Error cargando órdenes";
  }
}

/* ===========================
CARGAR RECOMENDACIONES IA
=========================== */
async function cargarRecomendacionesIA(){
  try{
    const recomendaciones = await calcularPredicciones(); // retorna un array de strings
    const container = document.getElementById("recomendacionesIA");
    container.innerHTML = "";

    recomendaciones.forEach(r=>{
      const div = document.createElement("div");
      div.style.marginBottom = "6px";
      div.innerHTML = `• ${r}`;
      container.appendChild(div);
    });

  }catch(e){
    console.error("Error cargando recomendaciones IA:", e);
    document.getElementById("recomendacionesIA").innerText = "Error cargando sugerencias";
  }
}