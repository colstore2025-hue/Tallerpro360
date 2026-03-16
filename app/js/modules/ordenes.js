/*
================================================
ORDENES.JS - Versión Estable
Gestión de órdenes con dictado y voz de IA
Ubicación: /app/js/modules/ordenes.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import CustomerManager from "./customerManager.js";
import { aiAssistant } from "./aiAssistant.js"; 
import { iniciarAsistenteWorkshop } from "../voice/voiceAssistantWorkshop.js";  
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
  // Eventos botones y formularios
  // ===========================
  document.getElementById("guardarOrden").onclick = async () => await guardar