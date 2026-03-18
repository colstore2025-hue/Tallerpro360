/**
 * dashboard.js
 * Dashboard PRO360 · Tesla UI, ERP+IA+CRM
 * KPIs, IA, Gráficos, Alertas, Voz
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const db = window.db; // Firestore global

import { analizarNegocio, hablarResumen } from "../ai/aiAssistant.js";

export default async function dashboard(container, state) {

  container.innerHTML = `
    <h1 style="text-align:center; font-size:36px; color:#00ffcc; font-weight:900; margin-bottom:20px;">📊 Dashboard PRO360</h1>
    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:25px; margin-bottom:40px;"></div>
    <div style="margin-bottom:40px;"><canvas id="graficaIngresos" style="background:#111827; border-radius:16px; padding:15px;"></canvas></div>
    <div id="iaPanel"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red; text-align:center;">❌ Error: empresa no definida</h2>`;
    return;
  }

  try {
    const q = query(collection(db, `empresas/${state.empresaId}/ordenes`));
    const snapshot = await getDocs(q);

    let ingresos = 0, costos = 0, ordenes = 0, ingresosPorDia = {};

    snapshot.forEach(doc => {
      const d = doc.data() || {};

      const totalOrden = Number(d.valorTrabajo || 0);
      const costo = (d.costoEstimado || []).reduce((sum, item) => sum + (item.total || 0), 0);

      ingresos += totalOrden;
      costos += costo;
      ordenes++;

      const fecha = d.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + totalOrden;
    });

    const utilidad = ingresos - costos;

    // ---------------- RENDER KPIS ----------------
    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#00ff99", "🤑")}
      ${crearKPI("📉 Costos", costos, "#ff0044", "💸")}
      ${crearKPI("📈 Utilidad", utilidad, "#00ffff", "📊")}
      ${crearKPI("🧾 Órdenes", ordenes, "#ffcc00", "📝")}
    `;

    renderGrafica(ingresosPorDia);

    // ---------------- PANEL IA ----------------
    const iaData = {
      resumen: {
        ingresos,
        costos,
        utilidad,
        margen: ingresos ? ((utilidad / ingresos) * 100).toFixed(2) : 0,
        ticketPromedio: ordenes ? (ingresos / ordenes).toFixed(2) : 0
      },
      alertas: snapshot.flatMap(doc => JSON.parse(doc.data().alertasIA || '[]')),
      recomendaciones: snapshot.flatMap(doc => JSON.parse(doc.data().diagnosticoIA?.recomendaciones || '[]'))
    };

    renderIA(iaData);

  } catch(e) {
    console.error(e);
    container.innerHTML = `<h2 style="color:red; text-align:center;">❌ Error cargando dashboard</h2><pre>${e.message}</pre>`;
  }
}

// ---------------- FUNCIONES ----------------

function crearKPI(titulo, valor, color="#00ffcc", icon="📊") {
  return `
    <div style="background:#111827; border-left:8px solid ${color}; border-radius:16px; padding:25px; text-align:center; box-shadow:0 0 25px ${color}50; transition:0.3s; cursor:pointer;">
      <h3 style="font-size:22px; font-weight:700;">${icon} ${titulo}</h3>
      <p style="font-size:32px; font-weight:900; margin-top:12px; color:${color};">$${formatear(valor)}</p>
    </div>
  `;
}

function renderGrafica(data) {
  const ctx = document.getElementById("graficaIngresos");
  if (!ctx || typeof Chart === "undefined") return;

  new Chart(ctx, {
    type:'line',
    data:{
      labels: Object.keys(data),
      datasets:[{
        label:"Ingresos por día",
        data: Object.values(data),
        borderColor:'#00ffcc',
        backgroundColor:'rgba(0,255,204,0.15)',
        borderWidth:4,
        tension:0.4,
        pointBackgroundColor:'#00ff99',
        pointRadius:7
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{ labels:{ color:"#00ffcc", font:{ size:16 } }},
        tooltip:{ mode:'index', intersect:false }
      },
      scales:{
        x:{ ticks:{ color:"#00ffcc", font:{ size:14 } }, grid:{ color:"#111" }},
        y:{ ticks:{ color:"#00ffcc", font:{ size:14 } }, grid:{ color:"#111" }}
      }
    }
  });
}

function renderIA(data) {
  const panel = document.getElementById("iaPanel");
  panel.innerHTML = `
    <div style="background:#0f172a; padding:30px; border-radius:16px; box-shadow:0 0 30px #00ff99;">
      <h2 style="color:#00ffcc; font-size:26px; font-weight:900;">🧠 IA Gerente</h2>
      <p style="font-size:18px;">💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p style="font-size:18px;">📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p style="font-size:18px;">📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p style="font-size:18px;">📊 Margen: ${data.resumen.margen}%</p>
      <p style="font-size:18px;">🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>

      <h3 style="color:#ff4444; font-size:20px; margin-top:20px;">⚠️ Alertas</h3>
      ${data.alertas.map(a=>`<p style="color:#ff4444; font-weight:700;">${a}</p>`).join("")}

      <h3 style="color:#00ffcc; font-size:20px; margin-top:20px;">🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r=>`<p style="color:#00ff99; font-weight:700;">${r}</p>`).join("")}

      <button id="vozGerente" style="margin-top:20px; padding:14px; background:#00ff99; border:none; border-radius:10px; font-weight:900; font-size:16px; cursor:pointer;">🎤 Escuchar IA</button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = () => hablarResumen(data);
}

function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}