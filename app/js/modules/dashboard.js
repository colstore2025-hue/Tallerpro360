/**
 * dashboard.js
 * Panel principal del ERP - TallerPRO360
 * Versión funcional y elegante
 */

import { clientes } from "./clientes/clientes.js";
import { ordenes } from "./ordenes/ordenes.js";
import { inventario } from "./inventario/inventario.js";
import { configuracion } from "./configuracion/configuracion.js";
import { generarManualPDF } from "../manual/manual.js";
import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">🚗 TallerPRO360 - Dashboard</h1>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
  <button id="btnManual" class="btn-primary">📄 Manual Usuario</button>
  <button id="btnConfiguracion" class="btn-primary">⚙ Configuración Taller</button>
  <button id="btnClientes" class="btn-primary">👥 Clientes</button>
  <button id="btnOrdenes" class="btn-primary">🛠 Órdenes</button>
  <button id="btnInventario" class="btn-primary">📦 Inventario</button>
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:25px;">
  <div class="card">
    <h3>Órdenes activas</h3>
    <p id="ordenesActivas" style="font-size:28px;">0</p>
  </div>
  <div class="card">
    <h3>Clientes</h3>
    <p id="clientesTotal" style="font-size:28px;">0</p>
  </div>
  <div class="card">
    <h3>Ingresos hoy</h3>
    <p id="ingresosHoy" style="font-size:28px;">$0</p>
  </div>
  <div class="card">
    <h3>Vehículos en taller</h3>
    <p id="vehiculosTaller" style="font-size:28px;">0</p>
  </div>
</div>

<div class="card">
  <h2>📋 Órdenes recientes</h2>
  <div id="ordenesRecientes">Cargando...</div>
</div>

<div class="card">
  <h2>🤖 Ayuda rápida</h2>
  <input id="inputPregunta" placeholder="Escribe tu consulta..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <div id="respuestasAyuda" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
</div>
`;

  // ===========================
  // Botones de navegación
  // ===========================
  document.getElementById("btnManual").onclick = () => generarManualPDF();
  document.getElementById("btnConfiguracion").onclick = () => configuracion(container);
  document.getElementById("btnClientes").onclick = () => clientes(container);
  document.getElementById("btnOrdenes").onclick = () => ordenes(container);
  document.getElementById("btnInventario").onclick = () => inventario(container);

  // ===========================
  // Cargar estadísticas reales
  // ===========================
  await loadStats();
  await loadOrders();

  // ===========================
  // Módulo de ayuda interactivo
  // ===========================
  const inputPregunta = document.getElementById("inputPregunta");
  const respuestasContainer = document.getElementById("respuestasAyuda");

  inputPregunta.addEventListener("keypress", function(e) {
    if(e.key === "Enter") {
      const pregunta = inputPregunta.value.trim();
      if(!pregunta) return;
      const respuesta = generarRespuestaFAQ(pregunta);
      const div = document.createElement("div");
      div.style.marginBottom = "8px";
      div.innerHTML = `<b>Pregunta:</b> ${pregunta}<br><b>Respuesta:</b> ${respuesta}`;
      respuestasContainer.prepend(div);
      inputPregunta.value = "";
    }
  });
}

/* ===========================
FUNCIONES DE DATOS
=========================== */

async function loadStats() {
  try {
    const clientesSnap = await getDocs(collection(db,"clientes"));
    const ordenesSnap = await getDocs(collection(db,"ordenes"));
    
    const ingresosHoy = ordenesSnap.docs.reduce((acc,doc)=>{
      const data = doc.data();
      const hoy = new Date().toDateString();
      return data.fecha.toDate().toDateString() === hoy ? acc + (data.total || 0) : acc;
    },0);

    document.getElementById("ordenesActivas").innerText = ordenesSnap.docs.length;
    document.getElementById("clientesTotal").innerText = clientesSnap.docs.length;
    document.getElementById("ingresosHoy").innerText = `$${ingresosHoy}`;
    document.getElementById("vehiculosTaller").innerText = ordenesSnap.docs.length; // simplificado
  } catch(e) {
    console.error("Error cargando estadísticas:", e);
  }
}

async function loadOrders() {
  try {
    const q = query(collection(db,"ordenes"), orderBy("fecha","desc"), limit(5));
    const querySnapshot = await getDocs(q);

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;"><th>Cliente</th><th>Vehículo</th><th>Estado</th></tr>`;

    querySnapshot.forEach(doc => {
      const o = doc.data();
      html += `<tr>
        <td>${o.cliente || "-"}</td>
        <td>${o.vehiculo || "-"}</td>
        <td>${o.estado || "En proceso"}</td>
      </tr>`;
    });

    html += "</table>";
    document.getElementById("ordenesRecientes").innerHTML = html;
  } catch(e) {
    console.error("Error cargando órdenes:", e);
    document.getElementById("ordenesRecientes").innerText = "Error cargando órdenes";
  }
}

/* ===========================
RESPUESTAS FAQ SIMULADAS
=========================== */
function generarRespuestaFAQ(pregunta) {
  pregunta = pregunta.toLowerCase();
  if(pregunta.includes("cliente")) return "Para agregar un cliente, ve al módulo Clientes y presiona 'Guardar Cliente'.";
  if(pregunta.includes("orden")) return "Para crear una orden, completa los datos, agrega productos y presiona 'Guardar Orden'.";
  if(pregunta.includes("inventario")) return "Agrega nuevos productos en Inventario, definiendo costo, margen y stock inicial.";
  if(pregunta.includes("factura")) return "Cada orden genera automáticamente una factura PDF al guardarla.";
  return "Lo sentimos, aún no tenemos información para esa consulta. Intenta otra pregunta.";
}