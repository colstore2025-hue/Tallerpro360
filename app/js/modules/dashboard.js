/*
================================================
DASHBOARD.JS - Versión Última Generación
Dashboard Gerencial Interactivo - TALLERPRO360
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

export async function dashboard(container, userId) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">📊 Dashboard Gerencial - TallerPRO360</h1>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:30px;">
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Órdenes Hoy</h3>
        <p id="ordenesDia" style="font-size:24px;">0</p>
      </div>
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Ingresos Hoy</h3>
        <p id="ingresosDia" style="font-size:24px;">$0</p>
      </div>
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Ganancia Neta</h3>
        <p id="gananciaDia" style="font-size:24px;">$0</p>
      </div>
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Clientes Activos</h3>
        <p id="clientesActivos" style="font-size:24px;">0</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Órdenes por Estado</h3>
        <canvas id="ordenesEstadoChart"></canvas>
      </div>
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Rendimiento Técnicos</h3>
        <canvas id="rendimientoTecnicosChart"></canvas>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;">
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Ingresos Últimos 7 Días</h3>
        <canvas id="ingresos7DiasChart"></canvas>
      </div>
      <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
        <h3>Alertas Financieras IA</h3>
        <div id="alertasIA">Cargando...</div>
        <button id="leerAlertas" style="margin-top:10px;padding:8px 15px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🔊 Leer alertas</button>
      </div>
    </div>
  `;

  let alertasCache = "";

  document.getElementById("leerAlertas").onclick = () => {
    if (!alertasCache) hablar("No hay alertas generadas aún");
    else hablar(alertasCache);
  };

  await actualizarKPIs();

  async function actualizarKPIs() {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    let ordenesDia = 0, ingresosDia = 0, gananciaDia = 0, clientesSet = new Set();
    const estadoMap = {};
    const tecnicoMap = {};
    const ingresos7Dias = {};

    const ordSnap = await getDocs(collection(db, "ordenes"));
    ordSnap.forEach(docSnap => {
      const o = docSnap.data();
      const fecha = o.fecha.toDate();

      // Órdenes y clientes
      if (fecha >= inicioDia && fecha <= finDia) {
        ordenesDia++;
        ingresosDia += Number(o.total) || 0;
        gananciaDia += (Number(o.total) - Number(o.costoTotal)) || 0;
      }
      if (o.clienteId) clientesSet.add(o.clienteId);

      // Órdenes por estado
      estadoMap[o.estado] = (estadoMap[o.estado] || 0) + 1;

      // Rendimiento técnicos
      if (o.tecnico) tecnicoMap[o.tecnico] = (tecnicoMap[o.tecnico] || 0) + 1;

      // Ingresos últimos 7 días
      const fechaStr = fecha.toISOString().split('T')[0];
      const diffDays = (inicioDia - fecha)/ (1000*60*60*24);
      if (diffDays <= 7) ingresos7Dias[fechaStr] = (ingresos7Dias[fechaStr] || 0) + Number(o.total || 0);
    });

    document.getElementById("ordenesDia").innerText = ordenesDia;
    document.getElementById("ingresosDia").innerText = `$${ingresosDia.toLocaleString()}`;
    document.getElementById("gananciaDia").innerText = `$${gananciaDia.toLocaleString()}`;
    document.getElementById("clientesActivos").innerText = clientesSet.size;

    // Graficos
    renderChart("ordenesEstadoChart", Object.keys(estadoMap), Object.values(estadoMap), "pie", "Estado Órdenes");
    renderChart("rendimientoTecnicosChart", Object.keys(tecnicoMap), Object.values(tecnicoMap), "bar", "Técnicos");
    renderChart("ingresos7DiasChart", Object.keys(ingresos7Dias), Object.values(ingresos7Dias), "line", "Ingresos");

    // Alertas IA
    alertasCache = await generarAlertasIA({ ordenesDia, ingresosDia, gananciaDia });
    document.getElementById("alertasIA").innerHTML = `<p>${alertasCache}</p>`;
  }

  function renderChart(canvasId, labels, data, type, title) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: type,
      data: { labels, datasets: [{ label: title, data, backgroundColor: generateColors(labels.length) }] },
      options: { responsive:true, plugins:{ legend:{ position:"bottom" } } }
    });
  }

  function generateColors(n) {
    const colors = [];
    for (let i=0;i<n;i++) colors.push(`hsl(${i*360/n},70%,50%)`);
    return colors;
  }

  async function generarAlertasIA(kpis) {
    if (!window.SuperAI) return "SuperAI no disponible";
    try {
      const alertas = await window.SuperAI.analyzeFinance(kpis);
      return alertas.join(". ");
    } catch(e) {
      console.error("Error alertas IA:", e);
      return "Error generando alertas";
    }
  }

  function hablar(texto) {
    if (!texto) return;
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = "es-ES";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    window.speechSynthesis.speak(speech);
  }
}