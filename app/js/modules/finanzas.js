/**
 * finanzas.js
 * Finanzas Inteligentes + Dashboard + IA Predictiva
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { analizarNegocio } from "../ai/aiManager.js";
import { renderSugerencias, generarSugerencias } from "../ai/aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

export default async function finanzasModule(container, state) {

  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">💰 Finanzas PRO360</h1>

    <div id="resumen" style="display:flex; flex-wrap:wrap; gap:20px; margin-top:20px;"></div>
    <canvas id="graficaFlujo" style="margin-top:30px; background:#111827; border-radius:12px; padding:15px;"></canvas>
    <div id="advisorFinanzas" style="margin-top:20px;"></div>
  `;

  const resumenDiv = document.getElementById("resumen");

  try {
    // 🔁 Consultar órdenes e ingresos
    const ordenesSnap = await getDocs(
      query(
        collection(window.db, "ordenes"),
        where("empresaId", "==", state.empresaId),
        orderBy("creadoEn", "asc")
      )
    );

    // 🔁 Consultar gastos contables
    const gastosSnap = await getDocs(
      query(
        collection(window.db, "contabilidad"),
        where("empresaId", "==", state.empresaId),
        orderBy("fecha", "asc")
      )
    );

    let ingresos = 0, costos = 0, utilidad = 0;
    let flujoPorDia = {};

    ordenesSnap.forEach(doc => {
      const o = doc.data();
      const total = Number(o.total || 0);
      const costo = Number(o.costoTotal || 0);
      ingresos += total;
      costos += costo;
      utilidad += total - costo;

      const fecha = o.creadoEn?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
      flujoPorDia[fecha] = (flujoPorDia[fecha] || 0) + (total - costo);
    });

    gastosSnap.forEach(doc => {
      const g = doc.data();
      if(g.tipo === "gasto"){
        costos += Number(g.monto || 0);
        utilidad -= Number(g.monto || 0);

        const fecha = g.fecha?.toDate?.()?.toISOString()?.split("T")[0] || "sin_fecha";
        flujoPorDia[fecha] = (flujoPorDia[fecha] || 0) - Number(g.monto || 0);
      }
    });

    // ==========================
    // 🎯 KPI FINANCIEROS
    // ==========================
    resumenDiv.innerHTML = `
      ${crearKPI("💰 Ingresos", ingresos, "#00ff99")}
      ${crearKPI("📉 Costos", costos, "#ff0044")}
      ${crearKPI("📈 Utilidad", utilidad, "#00ffff")}
    `;

    // ==========================
    // 📈 GRÁFICA FLUJO DE CAJA
    // ==========================
    renderGrafica(flujoPorDia);

    // ==========================
    // 🧠 PANEL IA FINANZAS
    // ==========================
    const iaData = await analizarNegocio(state);
    if(iaData){
      const sugerencias = await generarSugerencias({ finanzas: iaData });
      renderSugerencias("advisorFinanzas", sugerencias);
      hablar("💡 Recomendaciones financieras generadas por IA");
    }

  } catch(e){
    console.error("❌ Error cargando finanzas", e);
    container.innerHTML = `<h2 style="color:red">Error cargando finanzas</h2><p>${e.message}</p>`;
  }

  // ==========================
  // FUNCIONES AUXILIARES
  // ==========================
  function crearKPI(titulo, valor, color="#0ff"){
    return `
      <div style="
        background:#111827;
        border-left:6px solid ${color};
        border-radius:12px;
        padding:20px;
        text-align:center;
        box-shadow:0 0 15px ${color}50;
      ">
        <h3 style="font-size:20px;">${titulo}</h3>
        <p style="font-size:28px; font-weight:bold; color:${color};">$${formatear(valor)}</p>
      </div>
    `;
  }

  function renderGrafica(data){
    const ctx = document.getElementById("graficaFlujo");
    if(!ctx || typeof Chart === "undefined") return;

    const labels = Object.keys(data);
    const valores = Object.values(data);

    new Chart(ctx, {
      type:'line',
      data:{
        labels,
        datasets:[{
          label:"Flujo de caja",
          data: valores,
          borderColor:"#00ffcc",
          backgroundColor:"rgba(0,255,204,0.2)",
          borderWidth:3,
          tension:0.4,
          pointBackgroundColor:"#00ff99",
          pointRadius:6
        }]
      },
      options:{
        responsive:true,
        plugins:{
          legend:{ labels:{ color:"#00ffcc", font:{ size:14 } } },
          tooltip:{ mode:'index', intersect:false }
        },
        scales:{
          x:{ ticks:{ color:"#00ffcc" }, grid:{ color:"#111" } },
          y:{ ticks:{ color:"#00ffcc" }, grid:{ color:"#111" } }
        }
      }
    });
  }

  function formatear(valor){
    return new Intl.NumberFormat("es-CO").format(valor||0);
  }
}