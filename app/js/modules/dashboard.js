/**
 * dashboard.js
 * Dashboard PRO360 adaptado a estructura real de órdenes
 * KPIs, IA, Gráficos, Alertas, Voz
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Usar db global definido en firebase-config.js
const db = window.db;

import { analizarNegocio, hablarResumen } from "../ai/aiAssistant.js";

export default async function dashboard(container, state) {
  container.innerHTML = `
    <h1 style="text-align:center; font-size:32px; color:#00ffcc;">📊 Dashboard PRO360</h1>
    <div id="kpis" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-top:20px;"></div>
    <div style="margin-top:30px;"><canvas id="graficaIngresos" style="background:#111827; border-radius:12px; padding:10px;"></canvas></div>
    <div id="iaPanel" style="margin-top:30px;"></div>
  `;

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red">❌ Error: empresa no definida</h2>`;
    return;
  }

  try {
    const q = query(collection(db, `empresas/${state.empresaId}/ordenes`));
    const snapshot = await getDocs(q);

    let ingresos = 0, costos = 0, ordenes = 0, ingresosPorDia = {};

    snapshot.forEach(doc => {
      const d = doc.data() || {};

      // Total de la orden = valorTrabajo
      const totalOrden = Number(d.valorTrabajo || 0);

      // Costo = suma de cada item en costoEstimado
      const costo = (d.costoEstimado || []).reduce((sum, item) => sum + (item.total || 0), 0);

      ingresos += totalOrden;
      costos += costo;
      ordenes++;

      const fecha = d.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + totalOrden;
    });

    const utilidad = ingresos - costos;

    // Render KPIs
    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#00ff99", "🤑")}
      ${crearKPI("📉 Costos", costos, "#ff0044", "💸")}
      ${crearKPI("📈 Utilidad", utilidad, "#00ffff", "📊")}
      ${crearKPI("🧾 Órdenes", ordenes, "#ffcc00", "📝")}
    `;

    // Render gráfico ingresos por día
    renderGrafica(ingresosPorDia);

    // IA Panel (alertas y recomendaciones)
    const iaData = {
      resumen: {
        ingresos: ingresos,
        costos: costos,
        utilidad: utilidad,
        margen: ingresos ? ((utilidad / ingresos) * 100).toFixed(2) : 0,
        ticketPromedio: ordenes ? (ingresos / ordenes).toFixed(2) : 0
      },
      alertas: snapshot.flatMap(doc => JSON.parse(doc.data().alertasIA || '[]')),
      recomendaciones: snapshot.flatMap(doc => JSON.parse(doc.data().diagnosticoIA?.recomendaciones || '[]'))
    };

    renderIA(iaData);

  } catch(e) {
    console.error(e);
    container.innerHTML = `<h2 style="color:red">❌ Error cargando dashboard</h2><pre>${e.message}</pre>`;
  }
}

// ------------------ FUNCIONES ------------------

function crearKPI(titulo, valor, color="#00ffcc", icon="📊") {
  return `
    <div style="background:#111827; border-left:6px solid ${color}; border-radius:12px; padding:20px; text-align:center; box-shadow:0 0 15px ${color}50;">
      <h3 style="font-size:20px;">${icon} ${titulo}</h3>
      <p style="font-size:28px; font-weight:bold; margin-top:10px; color:${color};">$${formatear(valor)}</p>
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
      datasets: [{
        label: "Ingresos por día",
        data: Object.values(data),
        borderColor:'#00ffcc',
        backgroundColor:'rgba(0,255,204,0.2)',
        borderWidth:3,
        tension:0.4,
        pointBackgroundColor:'#00ff99',
        pointRadius:6
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{ labels:{ color:"#00ffcc" }},
        tooltip:{ mode:'index', intersect:false }
      },
      scales:{
        x:{ ticks:{ color:"#00ffcc" }, grid:{ color:"#111" }},
        y:{ ticks:{ color:"#00ffcc" }, grid:{ color:"#111" }}
      }
    }
  });
}

function renderIA(data) {
  const panel = document.getElementById("iaPanel");
  panel.innerHTML = `
    <div style="background:#0f172a; padding:25px; border-radius:12px; box-shadow:0 0 20px #00ff99;">
      <h2 style="color:#00ffcc;">🧠 IA Gerente</h2>
      <p>💰 Ingresos: $${formatear(data.resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(data.resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(data.resumen.utilidad)}</p>
      <p>📊 Margen: ${data.resumen.margen}%</p>
      <p>🎯 Ticket Promedio: $${formatear(data.resumen.ticketPromedio)}</p>
      <h3 style="color:#ffcc00;">⚠️ Alertas</h3>
      ${data.alertas.map(a=>`<p style="color:#ff4444;">${a}</p>`).join("")}
      <h3 style="color:#00ffff;">🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r=>`<p style="color:#00ffcc;">${r}</p>`).join("")}
      <button id="vozGerente" style="margin-top:15px; padding:12px; background:#00ff99; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🎤 Escuchar IA</button>
    </div>
  `;

  document.getElementById("vozGerente").onclick = () => hablarResumen(data);
}

function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}