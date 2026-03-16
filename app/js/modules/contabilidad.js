/*
================================================
CONTABILIDAD.JS - Versión Final Avanzada
Módulo contable con IA y alertas inteligentes
Ubicación: /app/js/modules/contabilidad.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function contabilidad(container) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💼 Contabilidad Avanzada - Taller</h1>

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
      <button id="vozAlertas" style="margin-top:10px;padding:8px 15px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🔊 Leer alertas</button>
    </div>
  `;

  document.getElementById("btnGenerar").onclick = generarReporte;
  document.getElementById("vozAlertas").onclick = leerAlertasVoz;

  await generarReporte();
}

async function generarReporte() {
  const inicioInput = document.getElementById("fechaInicio").value;
  const finInput = document.getElementById("fechaFin").value;

  const inicio = inicioInput ? new Date(inicioInput + "-01") : new Date(new Date().getFullYear(),0,1);
  const fin = finInput ? new Date(finInput + "-01") : new Date();

  const balance = await calcularBalance(inicio, fin);
  document.getElementById("balanceGeneral").innerHTML = `
    <p>Activos: $${balance.activos.toLocaleString()}</p>
    <p>Pasivos: $${balance.pasivos.toLocaleString()}</p>
    <p>Patrimonio: $${balance.patrimonio.toLocaleString()}</p>
  `;
  hablar(`Balance general actualizado. Activos: ${balance.activos}, Pasivos: ${balance.pasivos}, Patrimonio: ${balance.patrimonio}`);

  const resultados = await calcularEstadoResultados(inicio, fin);
  document.getElementById("estadoResultados").innerHTML = `
    <p>Ingresos: $${resultados.ingresos.toLocaleString()}</p>
    <p>Costos: $${resultados.costos.toLocaleString()}</p>
    <p>Gastos: $${resultados.gastos.toLocaleString()}</p>
    <p>Ganancia Neta: $${resultados.gananciaNeta.toLocaleString()}</p>
  `;

  const alertasHtml = await generarAlertasIA(resultados);
  document.getElementById("alertasIA").innerHTML = alertasHtml;
}

async function calcularBalance(inicio, fin){
  let activos = 0, pasivos = 0, patrimonio = 0;

  const invSnap = await getDocs(collection(db,"inventario"));
  invSnap.forEach(docSnap=>{
    const p = docSnap.data();
    activos += (Number(p.precio) * Number(p.stock)) || 0;
  });

  const ordSnap = await getDocs(collection(db,"ordenes"));
  ordSnap.forEach(docSnap=>{
    const o = docSnap.data();
    const fecha = o.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      activos += Number(o.total) || 0;
    }
  });

  const gastosSnap = await getDocs(collection(db,"gastos"));
  gastosSnap.forEach(docSnap=>{
    const g = docSnap.data();
    const fecha = g.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      pasivos += Number(g.monto) || 0;
    }
  });

  patrimonio = activos - pasivos;
  return {activos,pasivos,patrimonio};
}

async function calcularEstadoResultados(inicio, fin){
  let ingresos = 0, costos = 0, gastos = 0;

  const ordSnap = await getDocs(collection(db,"ordenes"));
  ordSnap.forEach(docSnap=>{
    const o = docSnap.data();
    const fecha = o.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      ingresos += Number(o.total) || 0;
      costos += Number(o.costoTotal) || 0;
    }
  });

  const gastosSnap = await getDocs(collection(db,"gastos"));
  gastosSnap.forEach(docSnap=>{
    const g = docSnap.data();
    const fecha = g.fecha.toDate();
    if(fecha >= inicio && fecha <= fin){
      gastos += Number(g.monto) || 0;
    }
  });

  const gananciaNeta = ingresos - costos - gastos;
  return {ingresos,costos,gastos,gananciaNeta};
}

let alertasCache = "";

async function generarAlertasIA(resultados){
  if(!window.SuperAI){
    alertasCache = "SuperAI no disponible";
    return "<p>SuperAI no disponible</p>";
  }

  try{
    const alertas = await window.SuperAI.analyzeFinance(resultados);
    alertasCache = alertas.join(". ");
    return alertas.map(a=>`<p>⚠️ ${a}</p>`).join("");
  }catch(e){
    console.error("Error IA alertas:",e);
    alertasCache = "Error generando alertas";
    return "<p>❌ Error generando alertas</p>";
  }
}

function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}

function leerAlertasVoz(){
  if(!alertasCache){
    hablar("No hay alertas generadas aún");
  } else {
    hablar(alertasCache);
  }
}