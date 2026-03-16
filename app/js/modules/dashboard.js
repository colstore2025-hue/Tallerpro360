/*
================================================
DASHBOARD.JS - Versión Final Avanzada
Dashboard Gerencial ERP - TallerPRO360
Métricas completas de órdenes, clientes, técnicos e ingresos
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container, userId) {
  console.log("📊 Cargando dashboard gerencial");

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px">📊 Dashboard Gerencial - TallerPRO360</h1>
<p>Bienvenido al ERP - Analiza y toma decisiones rápidas</p>

<div style="margin-top:30px; display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px;">
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Órdenes del día: <span id="ordenesDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Ingresos del día: $<span id="ingresosDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Ganancia Neta del Día: $<span id="gananciaDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Clientes Activos: <span id="clientesActivos">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Técnicos Activos: <span id="tecnicosActivos">0</span>
  </div>
</div>

<div style="margin-top:30px;">
  <h3 style="color:white;">Órdenes Recientes</h3>
  <div id="listaOrdenesRecientes" style="background:#1e293b;padding:10px;border-radius:6px;color:white;max-height:300px;overflow-y:auto;">
    Cargando órdenes...
  </div>
</div>

<div style="margin-top:30px;">
  <h3 style="color:white;">Top Técnicos (Rendimiento)</h3>
  <div id="topTecnicos" style="background:#1e293b;padding:10px;border-radius:6px;color:white;max-height:200px;overflow-y:auto;">
    Cargando datos...
  </div>
</div>

<div style="margin-top:30px;">
  <h3 style="color:white;">Alertas y Recomendaciones IA</h3>
  <div id="alertasDashboard" style="background:#111827;padding:15px;border-radius:6px;color:white;max-height:200px;overflow-y:auto;">
    Esperando análisis IA...
  </div>
</div>
`;

  await cargarMetricas();
  await cargarOrdenesRecientes();
  await cargarTopTecnicos();
  await generarAlertasIA();
}

/* ===========================
FUNCIONES PRINCIPALES
=========================== */

async function cargarMetricas() {
  const ordenesDiaElem = document.getElementById("ordenesDia");
  const ingresosDiaElem = document.getElementById("ingresosDia");
  const gananciaDiaElem = document.getElementById("gananciaDia");
  const clientesActivosElem = document.getElementById("clientesActivos");
  const tecnicosActivosElem = document.getElementById("tecnicosActivos");

  const hoy = new Date().toDateString();
  let ordenesDia = 0, ingresosDia = 0, gananciaDia = 0;
  let clientesSet = new Set(), tecnicosSet = new Set();

  try {
    const ordenSnap = await getDocs(collection(db, "ordenes"));
    ordenSnap.forEach(docSnap => {
      const o = docSnap.data();
      const fecha = o.fecha.toDate().toDateString();
      if (fecha === hoy) {
        ordenesDia++;
        ingresosDia += Number(o.total || 0);
        gananciaDia += Number(o.total || 0) - Number(o.costoTotal || 0);
      }
      if (o.clientePhone) clientesSet.add(o.clientePhone);
      if (o.tecnicoId) tecnicosSet.add(o.tecnicoId);
    });

    ordenesDiaElem.innerText = ordenesDia;
    ingresosDiaElem.innerText = ingresosDia.toLocaleString();
    gananciaDiaElem.innerText = gananciaDia.toLocaleString();
    clientesActivosElem.innerText = clientesSet.size;
    tecnicosActivosElem.innerText = tecnicosSet.size;

  } catch (e) {
    console.error("Error cargando métricas:", e);
  }
}

async function cargarOrdenesRecientes() {
  const lista = document.getElementById("listaOrdenesRecientes");
  try {
    const q = query(collection(db, "ordenes"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      lista.innerHTML = "No hay órdenes registradas.";
      return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;"><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Fecha</th></tr>`;

    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      html += `<tr>
        <td>${o.clientePhone || "-"}</td>
        <td>${o.vehiculo || "-"}</td>
        <td>${o.estado || "Recepción"}</td>
        <td>${o.fecha.toDate().toLocaleString()}</td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;
  } catch (e) {
    console.error("Error cargando órdenes recientes:", e);
    lista.innerHTML = "❌ Error cargando órdenes";
  }
}

async function cargarTopTecnicos() {
  const contenedor = document.getElementById("topTecnicos");
  try {
    const ordenSnap = await getDocs(collection(db, "ordenes"));
    const tecnicoMap = {};

    ordenSnap.forEach(docSnap => {
      const o = docSnap.data();
      if (o.tecnicoId) {
        if (!tecnicoMap[o.tecnicoId]) tecnicoMap[o.tecnicoId] = 0;
        tecnicoMap[o.tecnicoId]++;
      }
    });

    const top = Object.entries(tecnicoMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!top.length) {
      contenedor.innerHTML = "No hay técnicos activos";
      return;
    }

    let html = "<ol>";
    top.forEach(([tecId, count]) => {
      html += `<li>Técnico ID ${tecId}: ${count} órdenes completadas</li>`;
    });
    html += "</ol>";
    contenedor.innerHTML = html;
  } catch (e) {
    console.error("Error cargando top técnicos:", e);
    contenedor.innerHTML = "❌ Error cargando top técnicos";
  }
}

let alertasCache = "";

async function generarAlertasIA() {
  const contenedor = document.getElementById("alertasDashboard");
  if (!window.SuperAI) {
    contenedor.innerHTML = "<p>SuperAI no disponible</p>";
    return;
  }

  try {
    // Simulación: analizar métricas y generar alertas
    const ordenSnap = await getDocs(collection(db, "ordenes"));
    const totalOrdenes = ordenSnap.size;
    const alertas = [];

    if (totalOrdenes === 0) alertas.push("No se han registrado órdenes hoy");
    else if (totalOrdenes > 50) alertas.push("Gran volumen de órdenes: verificar recursos técnicos");

    alertasCache = alertas.join(". ");
    contenedor.innerHTML = alertas.map(a => `<p>⚠️ ${a}</p>`).join("");
  } catch (e) {
    console.error("Error generando alertas IA:", e);
    contenedor.innerHTML = "<p>❌ Error generando alertas IA</p>";
  }
}

/* ===========================
FUNCIONES DE VOZ
=========================== */

function hablar(texto) {
  if (!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}

export function leerAlertasVoz() {
  if (!alertasCache) hablar("No hay alertas generadas aún");
  else hablar(alertasCache);
}