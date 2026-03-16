/*
===========================================
DASHBOARD.JS - Dashboard Gerencial Avanzado
TallerPRO360 - Última Generación
===========================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container, userId) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px">📊 Dashboard Gerencial - TallerPRO360</h1>
    <p>Bienvenido al ERP, Gerente</p>

    <div style="display:flex;flex-wrap:wrap;gap:15px;margin-top:20px;">

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Órdenes Hoy</h3>
        <span id="ordenesDia" style="font-size:22px">0</span>
      </div>

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Ingresos Hoy</h3>
        $<span id="ingresosDia" style="font-size:22px">0</span>
      </div>

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Clientes Activos</h3>
        <span id="clientesActivos" style="font-size:22px">0</span>
      </div>

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Técnicos Activos</h3>
        <span id="tecnicosActivos" style="font-size:22px">0</span>
      </div>

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Órdenes Pendientes</h3>
        <span id="ordenesPendientes" style="font-size:22px">0</span>
      </div>

      <div style="flex:1;min-width:200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Stock Bajo</h3>
        <span id="stockBajo" style="font-size:22px">0</span>
      </div>

    </div>

    <div style="margin-top:30px;">
      <h2>Órdenes por Técnico</h2>
      <div id="ordenesTecnicos" style="display:flex;gap:10px;flex-wrap:wrap;"></div>
    </div>

    <div style="margin-top:30px;">
      <h2>Alertas y Recomendaciones IA</h2>
      <div id="alertasIA" style="background:#111827;color:white;padding:15px;border-radius:8px;min-height:80px;">Cargando alertas...</div>
    </div>
  `;

  await actualizarDashboard();
}

async function actualizarDashboard() {
  const hoy = new Date();
  const hoyStr = hoy.toDateString();

  // Órdenes del día e ingresos
  const ordenSnap = await getDocs(collection(db, "ordenes"));
  let ordenesDia = 0;
  let ingresosDia = 0;
  let ordenesPendientes = 0;
  let tecnicoMap = {};

  ordenSnap.forEach(docSnap => {
    const o = docSnap.data();
    const fecha = o.fecha.toDate();
    if(fecha.toDateString() === hoyStr) {
      ordenesDia++;
      ingresosDia += Number(o.total) || 0;
    }
    if(o.estado !== "Finalizado") ordenesPendientes++;

    if(o.tecnico) {
      tecnicoMap[o.tecnico] = (tecnicoMap[o.tecnico] || 0) + 1;
    }
  });

  document.getElementById("ordenesDia").innerText = ordenesDia;
  document.getElementById("ingresosDia").innerText = ingresosDia.toLocaleString();
  document.getElementById("ordenesPendientes").innerText = ordenesPendientes;

  // Clientes activos
  const clientesSnap = await getDocs(collection(db, "clientes"));
  document.getElementById("clientesActivos").innerText = clientesSnap.size;

  // Técnicos activos
  const tecnicosSet = new Set();
  ordenSnap.forEach(docSnap => {
    const o = docSnap.data();
    if(o.tecnico) tecnicosSet.add(o.tecnico);
  });
  document.getElementById("tecnicosActivos").innerText = tecnicosSet.size;

  // Stock bajo
  const inventarioSnap = await getDocs(collection(db, "inventario"));
  let stockBajo = 0;
  inventarioSnap.forEach(docSnap => {
    const item = docSnap.data();
    if(item.stock <= 5) stockBajo++;
  });
  document.getElementById("stockBajo").innerText = stockBajo;

  // Órdenes por técnico
  const ordenesTecnicosDiv = document.getElementById("ordenesTecnicos");
  ordenesTecnicosDiv.innerHTML = "";
  for(const [tec, count] of Object.entries(tecnicoMap)) {
    const div = document.createElement("div");
    div.style.background = "#0f172a";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.borderRadius = "6px";
    div.style.minWidth = "120px";
    div.style.textAlign = "center";
    div.innerHTML = `<b>${tec}</b><br>${count} órdenes`;
    ordenesTecnicosDiv.appendChild(div);
  }

  // Alertas IA (simulación, se puede reemplazar con SuperAI real)
  let alertas = [];
  if(ordenesPendientes > 10) alertas.push(`⚠️ Hay ${ordenesPendientes} órdenes pendientes. Prioriza su atención.`);
  if(stockBajo > 0) alertas.push(`⚠️ Hay ${stockBajo} artículos con stock bajo.`);
  if(ingresosDia < 100000) alertas.push(`⚠️ Ingresos del día ($${ingresosDia.toLocaleString()}) menores a lo esperado.`);

  document.getElementById("alertasIA").innerHTML = alertas.length ? alertas.map(a => `<p>${a}</p>`).join("") : "<p>✅ Todo en rango óptimo</p>";
  hablarAlertas(alertas.join(". "));
}

function hablarAlertas(texto) {
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}