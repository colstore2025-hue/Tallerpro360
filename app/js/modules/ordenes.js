/*
================================================
ORDENES.JS - Versión Final
Gestión avanzada de órdenes con dictado y voz de IA
Ubicación: /app/js/modules/ordenes.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import CustomerManager from "./customerManager.js";
import { aiassistant } from "./aiAssistant.js";
import { iniciarAsistenteWorkshop, dictarInput, hablar } from "../voice/voiceAssistantWorkshop.js";
import { actualizarStock } from "./inventario.js";

export async function ordenes(container) {
  const customerManager = new CustomerManager();

  // Inicializar asistente de voz global
  iniciarAsistenteWorkshop();

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">🛠 Órdenes Avanzadas</h1>

<div class="card">
  <h3>Registrar Nueva Orden</h3>
  <input id="clienteOrden" placeholder="Teléfono Cliente" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="vehiculoOrden" placeholder="Vehículo" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="placaOrden" placeholder="Placa" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <textarea id="descripcionOrden" placeholder="Descripción del servicio" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;"></textarea>
  <button id="vozOrden" style="margin-top:10px;padding:10px 20px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🎙 Dictar Orden por Voz</button>
  <button id="guardarOrden" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Orden</button>
</div>

<div class="card">
  <h3>Buscar Órdenes</h3>
  <input id="buscarOrden" placeholder="Buscar por cliente, placa o vehículo..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
</div>

<div class="card">
  <h3>Órdenes Recientes</h3>
  <div id="listaOrdenes">Cargando órdenes...</div>
</div>

<div class="card">
  <h3>Asistente IA</h3>
  <input id="inputAI" placeholder="Consulta sobre órdenes, diagnósticos o reparaciones..." style="width:100%;padding:10px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <div id="respuestasAI" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
</div>
`;

  // ===========================
  // Eventos
  // ===========================
  document.getElementById("guardarOrden").onclick = async () => await guardarOrden(customerManager);
  document.getElementById("buscarOrden").oninput = filtrarOrdenes;
  document.getElementById("vozOrden").onclick = () => dictarInput("descripcionOrden");

  // AI assistant input
  const inputAI = document.getElementById("inputAI");
  const respuestasAI = document.getElementById("respuestasAI");
  inputAI.addEventListener("keypress", async (e) => {
    if(e.key === "Enter"){
      const pregunta = inputAI.value.trim();
      if(!pregunta) return;
      const respuesta = await aiassistant(pregunta);
      const div = document.createElement("div");
      div.style.marginBottom = "8px";
      div.innerHTML = `<b>Consulta:</b> ${pregunta}<br><b>Respuesta:</b> ${respuesta}`;
      respuestasAI.prepend(div);
      hablar(respuesta);
      inputAI.value = "";
    }
  });

  // ===========================
  // Cargar órdenes
  // ===========================
  await cargarOrdenes();
}

/* ===========================
GUARDAR ORDEN
=========================== */
async function guardarOrden(customerManager){
  const phone = document.getElementById("clienteOrden").value.trim();
  const vehiculo = document.getElementById("vehiculoOrden").value.trim();
  const placa = document.getElementById("placaOrden").value.trim();
  const descripcion = document.getElementById("descripcionOrden").value.trim();

  if(!phone || !vehiculo) {
    hablar("Cliente y vehículo son obligatorios");
    return alert("Cliente y Vehículo son obligatorios");
  }

  // Verificar o crear cliente
  let cliente = await customerManager.searchCustomer(phone);
  if(!cliente){
    const idCliente = await customerManager.createCustomer({phone, name:"Cliente", vehicle:vehiculo, plate:placa});
    cliente = {id:idCliente, phone, vehicle:vehiculo, plate:placa};
  } else {
    await customerManager.updateVisit(cliente.id);
  }

  try {
    await addDoc(collection(db,"ordenes"),{
      clienteId: cliente.id,
      clientePhone: phone,
      vehiculo,
      placa,
      descripcion,
      estado: "Recepción",
      fecha: new Date()
    });

    // Actualizar inventario automáticamente según descripción
    actualizarStock(descripcion);

    hablar("Orden guardada correctamente");
    alert("✅ Orden guardada");
    limpiarFormularioOrden();
    await cargarOrdenes();
  } catch(e){
    console.error("Error guardando orden:",e);
    hablar("Error al guardar la orden");
    alert("❌ Error guardando orden");
  }
}

/* ===========================
CARGAR ORDENES
=========================== */
async function cargarOrdenes(){
  const lista = document.getElementById("listaOrdenes");
  try {
    const q = query(collection(db,"ordenes"), orderBy("fecha","desc"));
    const snapshot = await getDocs(q);
    if(snapshot.empty){
      lista.innerHTML = "No hay órdenes registradas. Usa el formulario superior para crear la primera orden.";
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;"><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Fecha</th></tr>`;
    snapshot.forEach(docSnap=>{
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
  } catch(e){
    console.error("Error cargando órdenes:",e);
    lista.innerHTML = "❌ Error cargando órdenes";
    hablar("Error cargando las órdenes");
  }
}

/* ===========================
FILTRAR ORDENES
=========================== */
function filtrarOrdenes(){
  const input = document.getElementById("buscarOrden").value.toLowerCase();
  const rows = document.querySelectorAll("#listaOrdenes table tr");
  rows.forEach((row,index)=>{
    if(index===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

/* ===========================
LIMPIAR FORMULARIO
=========================== */
function limpiarFormularioOrden(){
  document.getElementById("clienteOrden").value = "";
  document.getElementById("vehiculoOrden").value = "";
  document.getElementById("placaOrden").value = "";
  document.getElementById("descripcionOrden").value = "";
}