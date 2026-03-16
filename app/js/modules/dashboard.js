/*
================================================
DASHBOARD.JS - Versión Última Generación
Dashboard Ejecutivo Gerencial - TallerPRO360
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container, userId) {
  console.log("📊 cargando dashboard gerencial última generación");

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">📊 Dashboard Ejecutivo - TallerPRO360</h1>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:30px;">
      <div class="card" id="ordenesHoyCard">Órdenes Hoy: <span id="ordenesHoy">0</span></div>
      <div class="card" id="ingresosHoyCard">Ingresos Hoy: $<span id="ingresosHoy">0</span></div>
      <div class="card" id="gananciaHoyCard">Ganancia Neta Hoy: $<span id="gananciaHoy">0</span></div>
      <div class="card" id="clientesActivosCard">Clientes Activos: <span id="clientesActivos">0</span></div>
      <div class="card" id="clientesNuevosCard">Clientes Nuevos: <span id="clientesNuevos">0</span></div>
      <div class="card" id="ordenesPendientesCard">Órdenes Pendientes: <span id="ordenesPendientes">0</span></div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:20px;">
      <div class="card" style="flex:1;min-width:300px;">
        <h3>Estado Órdenes</h3>
        <canvas id="graficoEstadoOrdenes" style="width:100%;height:200px;"></canvas>
      </div>
      <div class="card" style="flex:1;min-width:300px;">
        <h3>Rendimiento Técnicos</h3>
        <canvas id="graficoTecnicos" style="width:100%;height:200px;"></canvas>
      </div>
      <div class="card" style="flex:1;min-width:300px;">
        <h3>Ingresos Últimos 7 Días</h3>
        <canvas id="graficoIngresosSemana" style="width:100%;height:200px;"></canvas>
      </div>
    </div>
  `;

  await cargarKPIs();
  await cargarGraficos();
}

/* ===========================
FUNCIONES KPI
=========================== */
async function cargarKPIs() {
  const ordenesSnap = await getDocs(collection(db, "ordenes"));
  const clientesSnap = await getDocs(collection(db, "clientes"));

  const hoy = new Date().toDateString();
  let ordenesHoy = 0, ingresosHoy = 0, gananciaHoy = 0, clientesActivos = 0, clientesNuevos = 0, ordenesPendientes = 0;

  const clientesHoySet = new Set();

  ordenesSnap.forEach(doc => {
    const o = doc.data();
    const fecha = o.fecha.toDate().toDateString();
    if(fecha === hoy) {
      ordenesHoy++;
      ingresosHoy += Number(o.total || 0);
      gananciaHoy += Number(o.total || 0) - Number(o.costoTotal || 0);
    }
    if(o.estado !== "Entregado") ordenesPendientes++;
    clientesHoySet.add(o.clienteId);
  });

  clientesSnap.forEach(doc => {
    const c = doc.data();
    if(c.lastVisit) {
      const last = c.lastVisit.toDate().toDateString();
      if(last === hoy) clientesActivos++;
      const created = c.createdAt?.toDate().toDateString();
      if(created === hoy) clientesNuevos++;
    }
  });

  document.getElementById("ordenesHoy").innerText = ordenesHoy;
  document.getElementById("ingresosHoy").innerText = ingresosHoy.toLocaleString();
  document.getElementById("gananciaHoy").innerText = gananciaHoy.toLocaleString();
  document.getElementById("clientesActivos").innerText = clientesActivos;
  document.getElementById("clientesNuevos").innerText = clientesNuevos;
  document.getElementById("ordenesPendientes").innerText = ordenesPendientes;
}

/* ===========================
FUNCIONES GRÁFICOS
=========================== */
async function cargarGraficos() {
  if(!window.Chart) {
    console.warn("Chart.js no cargado, gráficos no disponibles");
    return;
  }

  // =========================
  // Estado de Órdenes
  // =========================
  const ordenesSnap = await getDocs(collection(db, "ordenes"));
  const estados = { "Recepción":0, "Reparación":0, "Entregado":0 };
  ordenesSnap.forEach(doc => {
    const o = doc.data();
    estados[o.estado] = (estados[o.estado] || 0) + 1;
  });

  const ctx1 = document.getElementById("graficoEstadoOrdenes").getContext("2d");
  new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: Object.keys(estados),
      datasets:[{
        data: Object.values(estados),
        backgroundColor:["#6366f1","#16a34a","#facc15"]
      }]
    }
  });

  // =========================
  // Rendimiento Técnicos
  // =========================
  const tecnicos = {};
  ordenesSnap.forEach(doc => {
    const o = doc.data();
    if(o.tecnico) tecnicos[o.tecnico] = (tecnicos[o.tecnico] || 0) + 1;
  });

  const ctx2 = document.getElementById("graficoTecnicos").getContext("2d");
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: Object.keys(tecnicos),
      datasets:[{
        label:"Órdenes completadas",
        data:Object.values(tecnicos),
        backgroundColor:"#6366f1"
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });

  // =========================
  // Ingresos Últimos 7 Días
  // =========================
  const ingresosDia = {};
  const today = new Date();
  for(let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(today.getDate()-i);
    ingresosDia[d.toDateString()] = 0;
  }

  ordenesSnap.forEach(doc => {
    const o = doc.data();
    const fecha = o.fecha.toDate().toDateString();
    if(fecha in ingresosDia) ingresosDia[fecha] += Number(o.total || 0);
  });

  const ctx3 = document.getElementById("graficoIngresosSemana").getContext("2d");
  new Chart(ctx3, {
    type:'line',
    data:{
      labels:Object.keys(ingresosDia),
      datasets:[{
        label:'Ingresos',
        data:Object.values(ingresosDia),
        fill:true,
        backgroundColor:'rgba(99,102,241,0.2)',
        borderColor:'#6366f1'
      }]
    },
    options:{responsive:true,plugins:{legend:{display:false}}}
  });
}