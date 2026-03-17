/**
 * DASHBOARD FINAL PRO
 * TallerPRO360
 */
import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "/js/core/firebase-config.js";

export default async function dashboard(container, state) {
  container.innerHTML = `<h1>📊 Dashboard Gerencial</h1>
    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;"></div>
    <div style="margin-top:20px;"><canvas id="graficaIngresos"></canvas></div>
    <div id="iaPanel" style="margin-top:20px;"></div>
  `;

  try {
    const q = query(collection(db, "ordenes"), where("empresaId", "==", state.empresaId));
    const snapshot = await getDocs(q);

    let ingresos = 0, costos = 0, ordenes = 0, ingresosPorDia = {};
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const total = Number(data.total) || 0;
      const costo = Number(data.costoTotal) || 0;
      ingresos += total; costos += costo; ordenes++;
      const fecha = data.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;
    });
    const utilidad = ingresos - costos;

    const kpis = document.getElementById("kpis");
    kpis.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos)}
      ${crearKPI("📉 Costos", costos)}
      ${crearKPI("📈 Utilidad", utilidad)}
      ${crearKPI("🧾 Órdenes", ordenes)}
    `;

    renderGrafica(ingresosPorDia);

  } catch (error) {
    console.error("Error dashboard", error);
    container.innerHTML = `<h2 style="color:red">Error cargando dashboard</h2><p>${error.message}</p>`;
  }
}

function crearKPI(titulo, valor){
  return `<div style="background:#111827;padding:20px;border-radius:12px;text-align:center;box-shadow:0 0 10px rgba(0,255,153,0.4);">
    <h3>${titulo}</h3>
    <p style="font-size:22px;">$${formatear(valor)}</p>
  </div>`;
}

function renderGrafica(data){
  const ctx = document.getElementById("graficaIngresos");
  if(!ctx || typeof Chart==="undefined") return;
  new Chart(ctx,{ type:"line", data:{ labels:Object.keys(data), datasets:[{ label:"Ingresos por día", data:Object.values(data), borderWidth:2 }] } });
}

function formatear(valor){
  return new Intl.NumberFormat("es-CO").format(valor||0);
}