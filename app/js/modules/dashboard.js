/*
================================================
dashboard.js - Dashboard Gerencial Última Generación
ERP + CRM + IA - TallerPRO360
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container) {
  container.innerHTML = `
    <h1 style="font-size:32px;margin-bottom:20px;color:#00ff99;text-shadow: 0 0 8px #00ff99;">📊 Dashboard Gerencial - TallerPRO360</h1>
    <p style="color:#fff;">Bienvenido al ERP + IA + CRM del Taller</p>

    <div id="kpiContainer" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-top:30px;"></div>

    <div id="graficoContainer" style="margin-top:30px;"></div>

    <div class="card" style="margin-top:30px;background:#111827;padding:20px;border-radius:12px;color:#00ff99;">
      <h3 style="color:#00ffe0;">⚠️ Alertas y Recomendaciones IA</h3>
      <div id="alertasIA">Cargando alertas...</div>
    </div>
  `;

  await cargarKPIs();
  await cargarGraficos();
  await generarAlertas();
}

// ========================
// FUNCIONES KPI
// ========================
async function cargarKPIs() {
  const kpiContainer = document.getElementById("kpiContainer");
  kpiContainer.innerHTML = `
    <div class="kpiCard" id="ordenesHoy" style="background:#0f172a;padding:20px;border-radius:10px;color:#39ff14;text-align:center;">Órdenes Hoy<br><span style="font-size:24px">0</span></div>
    <div class="kpiCard" id="ingresosHoy" style="background:#0f172a;padding:20px;border-radius:10px;color:#14f0ff;text-align:center;">Ingresos Hoy<br><span style="font-size:24px">$0</span></div>
    <div class="kpiCard" id="clientesActivos" style="background:#0f172a;padding:20px;border-radius:10px;color:#ff14d1;text-align:center;">Clientes Activos<br><span style="font-size:24px">0</span></div>
    <div class="kpiCard" id="tecnicosActivos" style="background:#0f172a;padding:20px;border-radius:10px;color:#ffdd14;text-align:center;">Técnicos Activos<br><span style="font-size:24px">0</span></div>
    <div class="kpiCard" id="ordenesPendientes" style="background:#0f172a;padding:20px;border-radius:10px;color:#ff1414;text-align:center;">Órdenes Pendientes<br><span style="font-size:24px">0</span></div>
    <div class="kpiCard" id="stockBajo" style="background:#0f172a;padding:20px;border-radius:10px;color:#ff7f00;text-align:center;">Stock Bajo<br><span style="font-size:24px">0</span></div>
  `;

  // Cargar datos reales desde Firestore
  const ordenesSnap = await getDocs(collection(db,"ordenes"));
  const inventarioSnap = await getDocs(collection(db,"inventario"));
  const usuariosSnap = await getDocs(collection(db,"usuarios"));

  let ordenesHoy = 0;
  let ingresosHoy = 0;
  let ordenesPendientes = 0;
  const hoy = new Date().toISOString().slice(0,10);

  ordenesSnap.forEach(doc => {
    const o = doc.data();
    if(o.fecha?.toDate()?.toISOString().slice(0,10) === hoy) {
      ordenesHoy++;
      ingresosHoy += Number(o.total) || 0;
    }
    if(o.estado === "pendiente") ordenesPendientes++;
  });

  let stockBajo = 0;
  inventarioSnap.forEach(doc => {
    const i = doc.data();
    if(Number(i.stock) <= Number(i.stockMin || 5)) stockBajo++;
  });

  let clientesActivos = 0;
  let tecnicosActivos = 0;
  usuariosSnap.forEach(doc => {
    const u = doc.data();
    if(u.rol === "cliente") clientesActivos++;
    if(u.rol === "tecnico" && u.activo) tecnicosActivos++;
  });

  document.getElementById("ordenesHoy").querySelector("span").innerText = ordenesHoy;
  document.getElementById("ingresosHoy").querySelector("span").innerText = `$${ingresosHoy.toLocaleString()}`;
  document.getElementById("clientesActivos").querySelector("span").innerText = clientesActivos;
  document.getElementById("tecnicosActivos").querySelector("span").innerText = tecnicosActivos;
  document.getElementById("ordenesPendientes").querySelector("span").innerText = ordenesPendientes;
  document.getElementById("stockBajo").querySelector("span").innerText = stockBajo;
}

// ========================
// FUNCIONES GRÁFICOS
// ========================
async function cargarGraficos() {
  const cont = document.getElementById("graficoContainer");
  cont.innerHTML = `
    <h3 style="color:#00ff99;margin-bottom:10px;">📈 Órdenes por Técnico (Últimos 30 días)</h3>
    <canvas id="graficoTecnicos" width="400" height="200"></canvas>
    <h3 style="color:#00ff99;margin-top:30px;">💰 Ingresos Mensuales</h3>
    <canvas id="graficoIngresos" width="400" height="200"></canvas>
  `;

  // Importar Chart.js dinámicamente
  if(!window.Chart) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => dibujarGraficos();
    document.body.appendChild(script);
  } else dibujarGraficos();
}

async function dibujarGraficos() {
  // Datos de ejemplo, reemplazar con Firestore
  const usuariosSnap = await getDocs(collection(db,"usuarios"));
  const ordenesSnap = await getDocs(collection(db,"ordenes"));

  const tecnicoMap = {};
  const ingresosMap = {};

  const hoy = new Date();
  for(let i=29;i>=0;i--){
    const d = new Date();
    d.setDate(hoy.getDate()-i);
    const key = d.toISOString().slice(0,10);
    ingresosMap[key] = 0;
  }

  ordenesSnap.forEach(doc=>{
    const o = doc.data();
    const fechaKey = o.fecha?.toDate()?.toISOString().slice(0,10);
    if(fechaKey) ingresosMap[fechaKey] = (ingresosMap[fechaKey]||0) + Number(o.total||0);
    if(o.tecnico) tecnicoMap[o.tecnico] = (tecnicoMap[o.tecnico]||0) + 1;
  });

  const ctx1 = document.getElementById("graficoTecnicos").getContext("2d");
  new Chart(ctx1,{
    type:"bar",
    data:{
      labels: Object.keys(tecnicoMap),
      datasets:[{
        label:"Órdenes",
        data:Object.values(tecnicoMap),
        backgroundColor:"#00ff99"
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false}
      },
      scales:{
        y:{beginAtZero:true}
      }
    }
  });

  const ctx2 = document.getElementById("graficoIngresos").getContext("2d");
  new Chart(ctx2,{
    type:"line",
    data:{
      labels:Object.keys(ingresosMap),
      datasets:[{
        label:"Ingresos",
        data:Object.values(ingresosMap),
        borderColor:"#14f0ff",
        backgroundColor:"rgba(20,240,255,0.2)",
        tension:0.3,
        fill:true
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true}}
    }
  });
}

// ========================
// ALERTAS IA
// ========================
async function generarAlertas() {
  const alertContainer = document.getElementById("alertasIA");
  if(!window.SuperAI){
    alertContainer.innerHTML = "<p>SuperAI no disponible</p>";
    return;
  }

  try{
    const usuariosSnap = await getDocs(collection(db,"usuarios"));
    const clientesSnap = await getDocs(collection(db,"clientes"));
    const ordenesSnap = await getDocs(collection(db,"ordenes"));
    const inventarioSnap = await getDocs(collection(db,"inventario"));

    // Construir métricas simples para IA
    const resultados = {
      ordenesHoy: ordenesSnap.docs.filter(o=>o.data().estado==="pendiente").length,
      stockBajo: inventarioSnap.docs.filter(i=>Number(i.data().stock)<=5).length,
      clientesActivos: clientesSnap.size,
      tecnicosActivos: usuariosSnap.docs.filter(u=>u.data().rol==="tecnico" && u.data().activo).length
    };

    const alertas = await window.SuperAI.analyzeFinance(resultados);
    alertContainer.innerHTML = alertas.map(a=>`<p>⚠️ ${a}</p>`).join("");
  } catch(e){
    console.error("Error IA alertas:",e);
    alertContainer.innerHTML = "<p>❌ Error generando alertas</p>";
  }
}