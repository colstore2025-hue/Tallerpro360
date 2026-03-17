/**
 * DASHBOARD FINAL PRO360
 * TallerPRO360 - Última generación
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

// EventBus global para actualizar dashboard en tiempo real
window.EventBus = window.EventBus || {
  events: {},
  emit(event, data) { (this.events[event]||[]).forEach(cb => cb(data)); },
  on(event, cb) { if(!this.events[event]) this.events[event]=[]; this.events[event].push(cb); }
};

export default async function dashboard(container, state) {

  if(!state?.empresaId){
    container.innerHTML = `<h2 style="color:red">❌ Error: empresa no definida</h2>`;
    return;
  }

  container.innerHTML = `
    <h1 style="color:#00ffcc;font-size:28px;text-shadow:0 0 10px #0ff">📊 Dashboard PRO360</h1>
    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:15px; margin-top:20px;"></div>
    <div style="margin-top:30px;">
      <canvas id="graficaIngresos" style="background:#111;border-radius:12px;padding:10px;"></canvas>
    </div>
    <div id="iaPanel" style="margin-top:30px;"></div>
  `;

  async function recargarDashboard() {
    try{
      const q = query(collection(db, "ordenes"), where("empresaId","==",state.empresaId));
      const snapshot = await getDocs(q);

      let ingresos=0, costos=0, ordenes=0, ingresosPorDia={};

      snapshot.forEach(doc=>{
        const data = doc.data()||{};
        const total = Number(data.total)||0;
        const costo = Number(data.costoTotal)||0;
        ingresos += total;
        costos += costo;
        ordenes++;
        const fecha = data.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
        ingresosPorDia[fecha] = (ingresosPorDia[fecha]||0)+total;
      });

      const utilidad = ingresos-costos;

      // ======================
      // KPIs
      // ======================
      const kpis = document.getElementById("kpis");
      kpis.innerHTML = `
        ${crearKPI("💰 Ingresos", ingresos, "🟢")}
        ${crearKPI("📉 Costos", costos, "🔴")}
        ${crearKPI("📈 Utilidad", utilidad, "🟡")}
        ${crearKPI("🧾 Órdenes", ordenes, "🟣")}
      `;

      // ======================
      // Gráfica ingresos
      // ======================
      renderGrafica(ingresosPorDia);

      // ======================
      // Panel IA
      // ======================
      const iaData = await analizarNegocio(state);
      renderIA(iaData);

    } catch(e){
      console.error("Error dashboard recarga:",e);
      container.innerHTML = `<h2 style="color:red">❌ Error cargando dashboard</h2><p>${e.message}</p>`;
    }
  }

  // Escucha eventos de módulos
  ["ordenes:created","clientes:updated","inventario:updated","finanzas:updated"].forEach(event=>{
    window.EventBus.on(event, recargarDashboard);
  });

  // Carga inicial
  await recargarDashboard();
}

/* ===============================
🎯 KPI CARD NEÓN
=============================== */
function crearKPI(titulo, valor, color="🟢"){
  const bgColor = {
    "🟢":"#00ff99",
    "🔴":"#ff4d4d",
    "🟡":"#ffff66",
    "🟣":"#cc99ff"
  }[color]||"#00ffcc";

  return `
    <div style="
      background:#111827;
      padding:20px;
      border-radius:12px;
      text-align:center;
      box-shadow:0 0 15px ${bgColor};
      transition:0.3s;
    ">
      <h3 style="margin-bottom:10px;font-size:18px;">${titulo}</h3>
      <p style="font-size:24px;font-weight:bold;color:${bgColor};">$${formatear(valor)}</p>
    </div>
  `;
}

/* ===============================
📈 GRAFICA NEÓN
=============================== */
function renderGrafica(data){
  const ctx = document.getElementById("graficaIngresos");
  if(!ctx || typeof Chart==="undefined") return;

  const labels = Object.keys(data);
  const valores = Object.values(data);

  new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"Ingresos diarios",
        data:valores,
        borderColor:"#00ffcc",
        backgroundColor:"rgba(0,255,204,0.1)",
        borderWidth:2,
        tension:0.4,
        pointRadius:5,
        pointBackgroundColor:"#00ffcc"
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{labels:{color:"#00ffcc"}},
        tooltip:{mode:"index", intersect:false}
      },
      scales:{
        x:{ticks:{color:"#00ffcc"}, grid:{color:"rgba(0,255,204,0.1)"}},
        y:{ticks:{color:"#00ffcc"}, grid:{color:"rgba(0,255,204,0.1)"}}
      }
    }
  });
}

/* ===============================
🧠 PANEL IA
=============================== */
function renderIA(data){
  const panel = document.getElementById("iaPanel");
  if(!data) return;

  panel.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 20px #00ff99;
      color:#00ffcc;
    ">
      <h2 style="font-size:20px;margin-bottom:10px;">🧠 IA Gerente</h2>
      <p>💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p>📊 Margen: ${data.resumen.margen}%</p>
      <p>🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>
      <h3>⚠️ Alertas</h3>
      ${data.alertas.map(a=>`<p>${a}</p>`).join("")}
      <h3>🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r=>`<p>${r}</p>`).join("")}
      <button id="vozGerente" style="
        margin-top:15px;
        padding:10px;
        background:#00ff99;
        border:none;
        border-radius:8px;
        cursor:pointer;
        font-weight:bold;
      ">🎤 Escuchar IA</button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = ()=>hablarResumen(data);
}

/* ===============================
💰 FORMATEAR DINERO
=============================== */
function formatear(valor){
  return new Intl.NumberFormat("es-CO").format(valor||0);
}