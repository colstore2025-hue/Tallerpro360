/*
================================================
PAGOS TALLER - Módulo avanzado de pagos y flujo de caja
Versión: Última generación - TallerPRO360
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function pagosTaller(container){
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💳 Pagos y Flujo de Caja</h1>

    <div class="card" style="margin-bottom:20px;">
      <input id="pagoCliente" placeholder="Cliente" style="padding:8px;width:30%;margin-right:5px;">
      <input id="pagoMonto" type="number" placeholder="Monto" style="padding:8px;width:20%;margin-right:5px;">
      <select id="pagoMetodo" style="padding:8px;width:20%;margin-right:5px;">
        <option value="efectivo">Efectivo</option>
        <option value="banco">Banco</option>
        <option value="tarjeta">Tarjeta</option>
      </select>
      <button id="btnRegistrarPago" style="padding:8px 15px;background:#16a34a;border:none;color:white;border-radius:6px;cursor:pointer;">Registrar Pago</button>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <h2>Resumen Diario</h2>
      <p id="resumenIngresos">Ingresos: $0</p>
      <p id="resumenEfectivo">Efectivo: $0</p>
      <p id="resumenBancos">Bancos: $0</p>
      <p id="resumenTarjeta">Tarjetas: $0</p>
      <button id="leerResumenVoz" style="padding:8px 15px;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;">🔊 Leer Resumen</button>
    </div>

    <div class="card">
      <h2>Historial de Pagos</h2>
      <input id="buscarPago" placeholder="Buscar por cliente o método..." style="padding:8px;width:100%;margin-bottom:10px;">
      <div id="listaPagos" style="overflow-x:auto;">Cargando pagos...</div>
    </div>
  `;

  document.getElementById("btnRegistrarPago").onclick = registrarPago;
  document.getElementById("buscarPago").oninput = filtrarPagos;
  document.getElementById("leerResumenVoz").onclick = leerResumenVoz;

  await cargarPagos();
  await calcularResumenDiario();
}

/* ===========================
REGISTRAR PAGO
=========================== */
async function registrarPago(){
  const cliente = document.getElementById("pagoCliente").value.trim();
  const monto = Number(document.getElementById("pagoMonto").value);
  const metodo = document.getElementById("pagoMetodo").value;
  if(!cliente || monto <= 0) return alert("Cliente y monto válidos requeridos");

  await addDoc(collection(db,"pagos"),{cliente,monto,metodo,fecha:new Date()});

  document.getElementById("pagoCliente").value = "";
  document.getElementById("pagoMonto").value = "";
  document.getElementById("pagoMetodo").value = "efectivo";

  await cargarPagos();
  await calcularResumenDiario();
}

/* ===========================
CARGAR PAGOS
=========================== */
async function cargarPagos(){
  const lista = document.getElementById("listaPagos");
  try {
    const snapshot = await getDocs(query(collection(db,"pagos"), orderBy("fecha","desc")));
    if(snapshot.empty){ lista.innerHTML = "No hay pagos"; return; }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;">
        <th>Fecha</th><th>Cliente</th><th>Método</th><th>Monto</th>
      </tr>`;

    snapshot.forEach(doc => {
      const p = doc.data();
      const fechaObj = p.fecha.toDate ? p.fecha.toDate() : new Date(p.fecha);
      const fecha = fechaObj.toLocaleDateString();
      html += `<tr>
        <td>${fecha}</td>
        <td>${p.cliente}</td>
        <td>${p.metodo}</td>
        <td>$${p.monto}</td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;
  } catch(e){
    console.error("Error cargando pagos:", e);
    lista.innerHTML = "❌ Error cargando pagos";
  }
}

/* ===========================
FILTRAR PAGOS
=========================== */
function filtrarPagos(){
  const input = document.getElementById("buscarPago").value.toLowerCase();
  document.querySelectorAll("#listaPagos table tr").forEach((row,i)=>{
    if(i===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

/* ===========================
CALCULAR RESUMEN DIARIO
=========================== */
let resumenDiarioCache = {ingresos:0,efectivo:0,bancos:0,tarjeta:0};

async function calcularResumenDiario(){
  const snapshot = await getDocs(collection(db,"pagos"));
  const hoy = new Date().toDateString();
  let ingresos=0, efectivo=0, bancos=0, tarjeta=0;

  snapshot.forEach(doc => {
    const p = doc.data();
    const fechaPago = p.fecha.toDate ? p.fecha.toDate() : new Date(p.fecha);
    if(fechaPago.toDateString() === hoy){
      ingresos += p.monto || 0;
      if(p.metodo === "efectivo") efectivo += p.monto || 0;
      else if(p.metodo === "banco") bancos += p.monto || 0;
      else if(p.metodo === "tarjeta") tarjeta += p.monto || 0;
    }
  });

  resumenDiarioCache = {ingresos, efectivo, bancos, tarjeta};

  document.getElementById("resumenIngresos").innerText = `Ingresos: $${ingresos}`;
  document.getElementById("resumenEfectivo").innerText = `Efectivo: $${efectivo}`;
  document.getElementById("resumenBancos").innerText = `Bancos: $${bancos}`;
  document.getElementById("resumenTarjeta").innerText = `Tarjetas: $${tarjeta}`;
}

/* ===========================
LEER RESUMEN POR VOZ
=========================== */
function leerResumenVoz(){
  const {ingresos, efectivo, bancos, tarjeta} = resumenDiarioCache;
  if(ingresos === 0 && efectivo === 0 && bancos === 0 && tarjeta === 0){
    hablar("No hay pagos registrados hoy");
  } else {
    hablar(`Resumen de hoy. Ingresos: ${ingresos} pesos. Efectivo: ${efectivo}. Bancos: ${bancos}. Tarjetas: ${tarjeta}.`);
  }
}

/* ===========================
SÍNTESIS DE VOZ
=========================== */
function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}