// app/js/app.js

/* ===============================
   VALIDAR SESIÓN
=============================== */
if (!localStorage.getItem("uid")) {
  window.location.href = "/login.html";
}

/* ===============================
   IMPORTS FIREBASE Y UTILES
=============================== */
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";
import { diagnosticoIA } from "./iaMecanica.js";
import { crearRepuesto } from "./repuestos.js";
import { notificarCliente } from "./whatsappService.js";
import { generarFactura } from "./factura.js";

/* ===============================
   INICIAR APP
=============================== */
export async function iniciarApp(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">TallerPRO360 - SaaS Automotriz</h1>
    <div id="menuPrincipal" class="grid grid-cols-3 gap-4 mb-6">
      <button id="btnDashboard" class="bg-blue-600 text-white px-4 py-2 rounded">Dashboard</button>
      <button id="btnOrdenes" class="bg-green-600 text-white px-4 py-2 rounded">Órdenes</button>
      <button id="btnRepuestos" class="bg-yellow-600 text-white px-4 py-2 rounded">Repuestos</button>
      <button id="btnFinanzas" class="bg-indigo-600 text-white px-4 py-2 rounded col-span-3">Panel Financiero</button>
    </div>
    <div id="appContentInner"></div>
  `;

  document.getElementById("btnDashboard").onclick = () => dashboard(container.querySelector("#appContentInner"));
  document.getElementById("btnOrdenes").onclick = () => ordenes(container.querySelector("#appContentInner"));
  document.getElementById("btnRepuestos").onclick = () => repuestos(container.querySelector("#appContentInner"));
  document.getElementById("btnFinanzas").onclick = () => panelFinanciero(container.querySelector("#appContentInner"));
}

/* ===============================
   DASHBOARD
=============================== */
export async function dashboard(container) {
  container.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Dashboard TallerPRO360</h2>
    <div id="kpis" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white p-4 rounded shadow"><h3>Ingresos últimos 7 días</h3><canvas id="graficaIngresos"></canvas></div>
      <div class="bg-white p-4 rounded shadow"><h3>Órdenes por estado</h3><canvas id="graficaEstados"></canvas></div>
    </div>
    <button id="btnVoz" class="mt-4 bg-green-600 text-white px-4 py-2 rounded">🎙️ Crear orden por voz</button>
  `;
  await cargarKPIs();
  await cargarGraficas();

  document.getElementById("btnVoz").addEventListener("click", iniciarVoz);
}

/* ===============================
   ÓRDENES
=============================== */
export async function ordenes(container) {
  container.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Gestión de Órdenes</h2>
    <div class="bg-white p-4 rounded shadow mb-6">
      <input id="cliente" placeholder="Cliente" class="border p-2 rounded w-full mb-2">
      <input id="vehiculo" placeholder="Vehículo" class="border p-2 rounded w-full mb-2">
      <input id="placa" placeholder="Placa" class="border p-2 rounded w-full mb-2">
      <input id="tecnico" placeholder="Técnico" class="border p-2 rounded w-full mb-4">
      <button id="crearOrden" class="bg-blue-600 text-white px-4 py-2 rounded">Crear Orden</button>
    </div>
    <div class="bg-white p-4 rounded shadow"><div id="listaOrdenes">Cargando órdenes...</div></div>
  `;

  document.getElementById("crearOrden").onclick = crearOrden;
  await cargarOrdenes();
}

async function crearOrden() {
  const cliente = document.getElementById("cliente").value;
  const vehiculo = document.getElementById("vehiculo").value;
  const placa = document.getElementById("placa").value;
  const tecnico = document.getElementById("tecnico").value;

  if (!cliente || !vehiculo || !placa) return alert("Complete los campos obligatorios");

  await addDoc(collection(db, "ordenes"), {
    cliente,
    vehiculo,
    placa,
    tecnico: tecnico || "Sin asignar",
    estado: "activa",
    total: 0,
    acciones: [],
    fecha: serverTimestamp(),
  });

  alert("Orden creada correctamente");
  limpiarFormulario();
  await cargarOrdenes();
}

function limpiarFormulario() {
  ["cliente","vehiculo","placa","tecnico"].forEach(id => document.getElementById(id).value = "");
}

async function cargarOrdenes() {
  const lista = document.getElementById("listaOrdenes");
  const snapshot = await getDocs(collection(db,"ordenes"));
  if (snapshot.empty) return lista.innerHTML = "<p>No hay órdenes registradas</p>";

  lista.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const div = document.createElement("div");
    div.className = "border p-3 rounded mb-2";
    div.innerHTML = `
      <strong>${data.cliente}</strong><br>${data.vehiculo} - ${data.placa}<br>Técnico: ${data.tecnico || "Sin asignar"}<br>Estado: ${data.estado}
      <input id="accion-${id}" placeholder="Nueva acción" class="border p-2 rounded w-full mt-2">
      <button onclick="window.agregarAccion('${id}')" class="bg-blue-600 text-white px-3 py-1 rounded mt-1">Agregar acción</button>
    `;
    lista.appendChild(div);
  });

  window.agregarAccion = async function(ordenId){
    const input = document.getElementById(`accion-${ordenId}`);
    const accion = input.value;
    if(!accion) return alert("Escriba una acción");
    await agregarAccionOrden(ordenId, accion);
    input.value = "";
    alert("Acción agregada correctamente");
  };
}

/* ===============================
   REPUESTOS
=============================== */
export async function repuestos(container){
  container.innerHTML = `
    <h2 class="text