/**
 * dashboard.js
 * 🔥 PRO360 ULTRA V2 · Neon Dashboard con KPIs y charts claros
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;
let charts = {};
let refreshInterval = null;

export default async function dashboard(container, state) {
  renderBaseUI(container);

  if (!state?.empresaId) return renderError("❌ Empresa no definida");

  const cacheKey = `dashboard_ultra_v2_${state.empresaId}`;
  const cache = loadCache(cacheKey);

  if (cache) renderAll(cache, true);

  try {
    const data = await fetchAllData(state.empresaId);
    saveCache(cacheKey, data);
    renderAll(data, false);

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
      const fresh = await fetchAllData(state.empresaId);
      saveCache(cacheKey, fresh);
      renderAll(fresh, false);
    }, 120000);

  } catch (e) {
    console.error("🔥 Error backend:", e);
    if (!cache) renderError("⚠️ Sin conexión y sin datos");
  }
}

/* =========================
UI BASE ULTRA NEON
========================= */
function renderBaseUI(container) {
  container.innerHTML = `
    <div style="padding:20px;background:#0a0f1a;color:#ffffff;font-family:Segoe UI, sans-serif;">
      <h1 style="font-size:38px;font-weight:900;color:#00ffff;margin-bottom:20px;text-shadow:0 0 15px #00ffff;">
        🧠 DASHBOARD PRO360 ULTRA
      </h1>
      <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:18px;"></div>

      <div style="margin-top:30px; background:#0f172a; padding:20px; border-radius:14px; box-shadow:0 0 35px #00ffff33;">
        <canvas id="lineChart"></canvas>
      </div>

      <div style="margin-top:25px; display:flex; gap:20px; flex-wrap:wrap;">
        <div style="flex:1; min-width:300px;">
          <canvas id="barChart"></canvas>
        </div>
        <div style="flex:1; min-width:300px;">
          <canvas id="radarChart"></canvas>
        </div>
      </div>

      <div id="iaPanel" style="margin-top:30px;"></div>
    </div>
  `;
}

/* =========================
FETCH DE DATOS
========================= */
async function fetchAllData(empresaId) {
  const data = {
    ingresos:0, costos:0, ordenes:0, clientes:0, stockTotal:0,
    ingresosPorDia:{}, ventasPorCliente:{}, inventario:{}, alertas:[], decisions:[]
  };

  const snapOrd = await getDocs(query(collection(db, `empresas/${empresaId}/ordenes`)));
  snapOrd.forEach(doc => {
    const d = doc.data();
    const total = Number(d.valorTrabajo||0);
    const costo = Number(d.costoTotal||0);
    data.ingresos += total;
    data.costos += costo;
    data.ordenes++;
    const fecha = d.creadoEn?.toDate?.().toISOString().split("T")[0]||"NA";
    data.ingresosPorDia[fecha] = (data.ingresosPorDia[fecha]||0)+total;
    if(total<costo) data.alertas.push({msg:`⚠️ Orden con pérdida: $${total-costo}`, nivel:"alto"});
  });

  const snapCli = await getDocs(query(collection(db, `empresas/${empresaId}/clientes`)));
  data.clientes = snapCli.size;
  snapCli.forEach(doc => {
    const d = doc.data();
    const nombre = d.nombre||"Anon";
    data.ventasPorCliente[nombre] = (data.ventasPorCliente[nombre]||0) + Number(d.totalCompras||0);
  });

  const snapInv = await getDocs(query(collection(db, `empresas/${empresaId}/inventario`)));
  snapInv.forEach(doc => {
    const d = doc.data();
    const cantidad = Number(d.cantidad||0);
    data.stockTotal += cantidad;
    data.inventario[d.nombre] = cantidad;
    if(cantidad<5) data.alertas.push({msg:`⚠️ Stock bajo: ${d.nombre}`, nivel:"medio"});
  });

  return data;
}

/* =========================
RENDER GENERAL
========================= */
async function renderAll(data, fromCache){
  const utilidad = data.ingresos - data.costos;
  const margen = data.ingresos ? (utilidad/data.ingresos)*100 : 0;
  const ticket = data.ordenes ? data.ingresos/data.ordenes : 0;

  data.decisions = generarDecisiones({margen, ticket}, data.alertas, data.clientes, data.stockTotal);

  renderKPIs(data, utilidad, margen, ticket, fromCache);
  await renderCharts(data);
  renderIA(data);
}

/* =========================
KPIS NEON + ANIMADOS
========================= */
function renderKPIs(d, utilidad, margen, ticket, cache){
  const el = document.getElementById("kpis");
  el.innerHTML = `
    ${cache?'<div style="color:#facc15;margin-bottom:10px;">⚡ Datos desde cache</div>':''}
    ${kpiCard("Ingresos",$d(d.ingresos),"#00ffff")}
    ${kpiCard("Costos",$d(d.costos),"#ff4d4d")}
    ${kpiCard("Utilidad",$d(utilidad),"#22c55e")}
    ${kpiCard("Margen",margen.toFixed(2)+"%","#facc15")}
    ${kpiCard("Órdenes",d.ordenes,"#00ffff")}
    ${kpiCard("Ticket Prom.","$"+$d(ticket),"#00ffff")}
    ${kpiCard("Clientes",d.clientes,"#22c55e")}
    ${kpiCard("Stock Total",d.stockTotal,"#facc15")}
  `;

  el.querySelectorAll("h2").forEach(h=>{
    const end = parseInt(h.innerText.replace(/\D/g,''))||0;
    h.innerText = "0";
    animateCounter(h,end);
  });
}

function kpiCard(title,value,color="#ffffff"){
  return `
    <div style="
      background:#0f172a;
      padding:18px;
      border-radius:12px;
      box-shadow:0 5px 25px ${color}44;
      border:1px solid #1e293b;
      transition:0.35s;
      cursor:pointer;
    " onmouseenter="this.style.transform='translateY(-5px)';this.style.boxShadow='0 15px 35px ${color}88';"
      onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 25px ${color}44';">
      <p style="color:#ffffff;font-size:13px;">${title}</p>
      <h2 style="color:${color};font-size:22px;margin-top:5px;">${typeof value==="number"?"$"+$d(value):value}</h2>
    </div>
  `;
}

function animateCounter(el, end){
  let start = 0;
  const duration = 1200;
  const stepTime = Math.abs(Math.floor(duration/end))||10;
  const timer = setInterval(()=>{
    start += Math.ceil(end/30);
    if(start>=end){ start=end; clearInterval(timer); }
    el.innerText = "$"+$d(start);
  },stepTime);
}

/* =========================
CHARTS NEON
========================= */
async function renderCharts(d){
  const lineCtx = document.getElementById("lineChart");
  const barCtx = document.getElementById("barChart");
  const radarCtx = document.getElementById("radarChart");

  let ChartLib;
  try { ChartLib = (await import("https://cdn.jsdelivr.net/npm/chart.js/auto/+esm")).default; }
  catch{return fallbackChart(d);}

  if(charts.line) charts.line.destroy();
  charts.line = new ChartLib(lineCtx,{
    type:"line",
    data:{
      labels:Object.keys(d.ingresosPorDia),
      datasets:[{
        label:"Ingresos",
        data:Object.values(d.ingresosPorDia),
        borderColor:"#00ffff",
        backgroundColor:"#00ffff33",
        fill:true,
        tension:0.3,
        borderWidth:3,
        pointHoverRadius:8,
        pointBackgroundColor:"#facc15"
      }]
    },
    options:{
      responsive:true,
      interaction:{mode:'nearest',intersect:false},
      plugins:{legend:{labels:{color:"#ffffff"}}},
      scales:{x:{ticks:{color:"#ffffff"}},y:{ticks:{color:"#ffffff"}}},
      animation:{duration:1500}
    }
  });

  if(charts.bar) charts.bar.destroy();
  charts.bar = new ChartLib(barCtx,{
    type:"bar",
    data:{
      labels:Object.keys(d.ventasPorCliente),
      datasets:[{
        label:"Ventas",
        data:Object.values(d.ventasPorCliente),
        backgroundColor:"#00ffff88"
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}, tooltip:{enabled:true, mode:'index'}},
      scales:{x:{ticks:{color:"#ffffff"}},y:{ticks:{color:"#ffffff"}}},
      animation:{duration:1200}
    }
  });

  if(charts.radar) charts.radar.destroy();
  charts.radar = new ChartLib(radarCtx,{
    type:"radar",
    data:{
      labels:["Ingresos","Costos","Utilidad","Clientes","Órdenes","Stock"],
      datasets:[{
        label:"KPIs",
        data:[d.ingresos,d.costos,d.ingresos-d.costos,d.clientes,d.ordenes,d.stockTotal],
        backgroundColor:"#00ffff33",
        borderColor:"#00ffff",
        borderWidth:2
      }]
    },
    options:{
      responsive:true,
      scales:{r:{angleLines:{color:'#00ffff55'},grid:{color:'#00ffff33'}, pointLabels:{color:'#ffffff'}}},
      plugins:{legend:{labels:{color:'#ffffff'}}},
      animation:{duration:1200}
    }
  });
}

/* =========================
CEO AUTÓNOMO ULTRA
========================= */
function renderIA(d){
  const el = document.getElementById("iaPanel");

  const decisionesHTML = d.decisions.map(x=>`
    <div style="
      background:#020617;
      padding:14px;
      border-radius:10px;
      margin-top:8px;
      box-shadow:0 0 20px #00ffff33;
      transition:0.3s;
    ">
      ⚡ <strong>${x.accion}</strong> (${x.impacto})
    </div>
  `).join("");

  const alertasHTML = d.alertas.map(a=>{
    const color = a.nivel==="alto"?"#ff4d4d":"#facc15";
    return `<div style="color:${color};margin-top:4px;">${a.msg}</div>`;
  }).join("");

  el.innerHTML = `
    <div style="background:#0f172a;padding:22px;border-radius:14px;border:1px solid #1e293b;">
      <h2 style="color:#00ffff;text-shadow:0 0 12px #00ffff;">👑 CEO AUTÓNOMO ULTRA</h2>
      <p>Margen: <strong>${d.ingresos?(((d.ingresos-d.costos)/d.ingresos)*100).toFixed(2)+"%" : 0}</strong></p>
      <h3 style="color:#ff4d4d;">⚠️ Alertas</h3>
      ${alertasHTML || "Sin alertas"}
      <h3 style="color:#00ffff;margin-top:12px;">🧠 Decisiones recomendadas</h3>
      ${decisionesHTML||"Sin decisiones"}
    </div>
  `;
}

/* =========================
DECISIONES INTELIGENTES ULTRA
========================= */
function generarDecisiones(kpis, alertas, clientes, stock){
  const dec = [];
  if(kpis.margen<25) dec.push({accion:"Subir precios",impacto:"alto"});
  if(alertas.length) dec.push({accion:"Revisar pérdidas / stock",impacto:"alto"});
  if(kpis.ticket<70000) dec.push({accion:"Crear combos y promociones",impacto:"medio"});
  if(clientes<5) dec.push({accion:"Campaña captación clientes",impacto:"medio"});
  if(stock<50) dec.push({accion:"Reabastecer inventario crítico",impacto:"alto"});
  return dec;
}

/* =========================
UTILS ULTRA
========================= */
function fallbackChart(d){alert("⚠️ Chart.js no disponible, mostrando datos simplificados");}
function saveCache(k,d){try{localStorage.setItem(k,JSON.stringify(d))}catch{}}
function loadCache(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function $d(v){return new Intl.NumberFormat("es-CO").format(v||0)}
function renderError(msg){document.getElementById("kpis").innerHTML=msg}