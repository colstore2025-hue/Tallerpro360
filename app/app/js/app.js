/* ===============================
   VALIDAR SESIÓN
=============================== */
if (!localStorage.getItem("uid")) {
  window.location.href = "/login.html";
}

/* ===============================
   IMPORTS FIREBASE Y UTILIDADES
=============================== */
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";
import { diagnosticoIA, iniciarVoz } from "./iaMecanica.js";
import { crearRepuesto, cargarRepuestos } from "./repuestos.js";
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
    empresaId: localStorage.getItem("empresaId"), // Multiempresa
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
  const empresaId = localStorage.getItem("empresaId");
  const snapshot = await getDocs(collection(db,"ordenes"));

  const ordenes = snapshot.docs.filter(docSnap => docSnap.data().empresaId === empresaId);

  if (ordenes.length === 0) return lista.innerHTML = "<p>No hay órdenes registradas</p>";

  lista.innerHTML = "";
  ordenes.forEach(docSnap => {
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

    const ordenRef = doc(db,"ordenes",ordenId);
    await updateDoc(ordenRef,{
      acciones: [...(ordenes.find(o=>o.id===ordenId).data().acciones||[]), {descripcion:accion, fecha: serverTimestamp()}]
    });
    input.value = "";
    alert("Acción agregada correctamente");
  };
}

/* ===============================
   REPUESTOS
=============================== */
export async function repuestos(container){
  container.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Gestión de Repuestos</h2>
    <div class="bg-white p-4 rounded shadow mb-6">
      <input id="repNombre" placeholder="Nombre" class="border p-2 rounded w-full mb-2">
      <input id="repCosto" placeholder="Costo de compra COP" type="number" class="border p-2 rounded w-full mb-2">
      <input id="repMargen" placeholder="Margen %" type="number" class="border p-2 rounded w-full mb-2">
      <input id="repStock" placeholder="Stock inicial" type="number" class="border p-2 rounded w-full mb-2">
      <button id="crearRepuestoBtn" class="bg-yellow-600 text-white px-4 py-2 rounded">Crear Repuesto</button>
    </div>
    <div id="listaRepuestos">Cargando repuestos...</div>
  `;

  document.getElementById("crearRepuestoBtn").onclick = async () => {
    const data = {
      nombre: document.getElementById("repNombre").value,
      costoCompra: Number(document.getElementById("repCosto").value),
      margen: Number(document.getElementById("repMargen").value),
      stock: Number(document.getElementById("repStock").value),
      empresaId: localStorage.getItem("empresaId")
    };
    await crearRepuesto(data);
    alert("Repuesto creado correctamente");
    await cargarRepuestosLista();
  };

  await cargarRepuestosLista();
}

async function cargarRepuestosLista(){
  const lista = document.getElementById("listaRepuestos");
  const empresaId = localStorage.getItem("empresaId");
  const snapshot = await getDocs(collection(db,"repuestos"));
  const repuestosList = snapshot.docs.filter(d=>d.data().empresaId===empresaId);

  if(repuestosList.length === 0) return lista.innerHTML = "<p>No hay repuestos registrados</p>";

  lista.innerHTML = "";
  repuestosList.forEach(docSnap=>{
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "border p-2 rounded mb-2";
    div.innerHTML = `${data.nombre} - Costo: ${data.costoCompra} COP - Stock: ${data.stock}`;
    lista.appendChild(div);
  });
}

/* ===============================
   PANEL FINANCIERO
=============================== */
export async function panelFinanciero(container){
  container.innerHTML = `<h2 class="text-xl font-bold mb-4">Panel Financiero</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <canvas id="graficaUtilidad"></canvas>
    <canvas id="graficaServicios"></canvas>
    <canvas id="graficaRepuestos"></canvas>
    <canvas id="graficaTecnicos"></canvas>
  </div>`;
  await cargarDatosFinancieros();
}

async function cargarDatosFinancieros(){
  const empresaId = localStorage.getItem("empresaId");
  const snapshot = await getDocs(collection(db,"ordenes"));
  const snapshotEmpresa = snapshot.docs.filter(d=>d.data().empresaId===empresaId);

  let utilidadMes = new Array(12).fill(0);
  let servicios = {};
  let repuestos = {};
  let tecnicos = {};

  snapshotEmpresa.forEach(doc=>{
    const data = doc.data();
    if(!data.fecha) return;
    const fecha = data.fecha.toDate?.() || new Date();
    const mes = fecha.getMonth();

    let utilidadOrden = 0;
    if(data.acciones){
      data.acciones.forEach(a=>{
        const precio = a.precio || 0;
        const costo = a.costo || 0;
        utilidadOrden += precio - costo;
        servicios[a.descripcion] = (servicios[a.descripcion]||0)+(precio-costo);
        if(a.repuesto) repuestos[a.repuesto] = (repuestos[a.repuesto]||0)+1;
      });
    }
    if(data.tecnico) tecnicos[data.tecnico] = (tecnicos[data.tecnico]||0)+utilidadOrden;
    utilidadMes[mes]+=utilidadOrden;
  });

  new Chart(document.getElementById("graficaUtilidad"), {
    type:"line",
    data:{
      labels:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
      datasets:[{label:"Utilidad COP", data:utilidadMes}]
    }
  });

  new Chart(document.getElementById("graficaServicios"), {
    type:"bar",
    data:{labels:Object.keys(servicios), datasets:[{label:"Utilidad COP", data:Object.values(servicios)}]}
  });

  new Chart(document.getElementById("graficaRepuestos"), {
    type:"bar",
    data:{labels:Object.keys(repuestos), datasets:[{label:"Cantidad vendida", data:Object.values(repuestos)}]}
  });

  new Chart(document.getElementById("graficaTecnicos"), {
    type:"bar",
    data:{labels:Object.keys(tecnicos), datasets:[{label:"Utilidad COP", data:Object.values(tecnicos)}]}
  });
}