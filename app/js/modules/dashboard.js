/**
 * dashboard.js
 * Panel principal del ERP con módulo de ayuda interactivo
 * TallerPRO360
 */

import { generarManualPDF } from "../system/manual.js"; // módulo de PDF
import { clientes } from "../clientes/clientes.js"; // opcional para datos reales
import { ordenes } from "../ordenes/ordenes.js"; // opcional para datos de órdenes

export async function dashboard(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">
🚗 Dashboard TallerPRO360
</h1>

<!-- Botón Manual -->
<button id="btnManual"
style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;margin-bottom:20px;">
📄 Descargar Manual de Usuario
</button>

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

<div class="card">
<h2>🤖 Módulo de Ayuda</h2>
<p>Escribe tu consulta y presiona Enter:</p>
<input id="inputPregunta" placeholder="Ej: Cómo agregar un cliente..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<div id="respuestasAyuda" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
</div>
`;

  // ===========================
  // Cargar datos simulados
  // ===========================
  loadStats();
  loadOrders();

  // ===========================
  // Botón manual PDF
  // ===========================
  document.getElementById("btnManual").onclick = () => {
    generarManualPDF();
  };

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

// ===========================
// Simulación de estadísticas
// ===========================
function loadStats(){
  document.getElementById("ordenesActivas").innerText = "5";
  document.getElementById("clientesTotal").innerText = "28";
  document.getElementById("ingresosHoy").innerText = "$1,250";
  document.getElementById("vehiculosTaller").innerText = "3";
}

// ===========================
// Órdenes recientes
// ===========================
function loadOrders(){
  const container = document.getElementById("ordenesRecientes");
  container.innerHTML = `
  <table style="width:100%;border-collapse:collapse;">
    <tr style="border-bottom:1px solid #1e293b;">
      <th align="left">Cliente</th>
      <th align="left">Vehículo</th>
      <th align="left">Estado</th>
    </tr>
    <tr>
      <td>Carlos Pérez</td>
      <td>Toyota Corolla</td>
      <td>Diagnóstico</td>
    </tr>
    <tr>
      <td>Ana Rodríguez</td>
      <td>Chevrolet Spark</td>
      <td>Reparación</td>
    </tr>
    <tr>
      <td>Luis Gómez</td>
      <td>Nissan Frontier</td>
      <td>Entrega hoy</td>
    </tr>
  </table>
  `;
}

// ===========================
// Respuestas FAQ simuladas
// ===========================
function generarRespuestaFAQ(pregunta){
  pregunta = pregunta.toLowerCase();
  if(pregunta.includes("cliente")) return "Para agregar un cliente, ve al módulo Clientes y presiona 'Guardar Cliente'.";
  if(pregunta.includes("orden")) return "Para crear una orden, completa los datos y agrega productos, luego presiona 'Guardar Orden'.";
  if(pregunta.includes("inventario")) return "Puedes agregar nuevos productos en Inventario, definiendo costo, margen y stock inicial.";
  if(pregunta.includes("factura")) return "Cada orden permite generar una factura PDF automáticamente al guardarla.";
  return "Lo sentimos, aún no tenemos información para esa consulta. Intenta otra pregunta.";
}