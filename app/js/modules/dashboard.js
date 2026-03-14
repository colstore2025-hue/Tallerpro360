/**
 * dashboard.js
 * Dashboard funcional del TallerPRO360 ERP
 */

import { clientes } from "./clientes/clientes.js";
import { ordenes } from "./ordenes/ordenes.js";
import { configuracion } from "./configuracion.js"; // módulo de configuración
import { db } from "../core/firebase-config.js";

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">🚗 Dashboard TallerPRO360</h1>

<div style="margin-bottom:20px;">
<button id="btnConfiguracion" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">⚙ Configuración y Ayuda</button>
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
<div id="ordenesRecientes">Cargando órdenes...</div>
</div>
`;

  // ===========================
  // Botón abrir módulo configuración
  // ===========================
  document.getElementById("btnConfiguracion").onclick = () => {
    configuracion(container);
  };

  // ===========================
  // Cargar estadísticas reales
  // ===========================
  await cargarEstadisticas();
  await cargarOrdenesRecientes();
}


/* ===========================
CARGAR ESTADÍSTICAS
=========================== */
async function cargarEstadisticas() {
  try {
    // Órdenes activas
    const ordenesSnapshot = await getDocs(collection(db, "ordenes"));
    document.getElementById("ordenesActivas").innerText = ordenesSnapshot.size;

    // Clientes
    const clientesSnapshot = await getDocs(collection(db, "clientes"));
    document.getElementById("clientesTotal").innerText = clientesSnapshot.size;

    // Vehículos en taller (órdenes no entregadas)
    const q = query(collection(db, "ordenes"), where("estado", "==", "en_taller"));
    const vehiculosSnapshot = await getDocs(q);
    document.getElementById("vehiculosTaller").innerText = vehiculosSnapshot.size;

    // Ingresos hoy
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let ingresosHoy = 0;
    ordenesSnapshot.forEach(doc => {
      const o = doc.data();
      const fechaOrden = o.fecha?.toDate ? o.fecha.toDate() : new Date(o.fecha);
      if(fechaOrden >= inicioDia) ingresosHoy += o.total || 0;
    });
    document.getElementById("ingresosHoy").innerText = `$${ingresosHoy.toLocaleString()}`;

  } catch (e) {
    console.error("Error cargando estadísticas:", e);
    document.getElementById("ordenesActivas").innerText = "0";
    document.getElementById("clientesTotal").innerText = "0";
    document.getElementById("vehiculosTaller").innerText = "0";
    document.getElementById("ingresosHoy").innerText = "$0";
  }
}

/* ===========================
ORDENES RECIENTES
=========================== */
async function cargarOrdenesRecientes() {
  const container = document.getElementById("ordenesRecientes");
  try {
    const ordenesSnapshot = await getDocs(collection(db, "ordenes"));
    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;">
        <th align="left">Cliente</th>
        <th align="left">Vehículo</th>
        <th align="left">Estado</th>
      </tr>`;

    ordenesSnapshot.forEach(doc => {
      const o = doc.data();
      html += `<tr>
        <td>${o.cliente || "-"}</td>
        <td>${o.vehiculo || "-"}</td>
        <td>${o.estado || "Pendiente"}</td>
      </tr>`;
    });

    html += "</table>";
    container.innerHTML = html;

  } catch (e) {
    console.error("Error cargando órdenes recientes:", e);
    container.innerHTML = "Error cargando órdenes";
  }
}