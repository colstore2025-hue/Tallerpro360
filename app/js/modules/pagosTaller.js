/**
 * pagosTaller.js
 * Módulo avanzado de Pagos y Flujo de Caja - TallerPRO360
 */

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function pagosTaller(container){
  container.innerHTML = `
    <h1>💳 Pagos y Flujo de Caja</h1>
    <div class="card">
      <input id="pagoCliente" placeholder="Cliente">
      <input id="pagoMonto" type="number" placeholder="Monto">
      <select id="pagoMetodo">
        <option value="efectivo">Efectivo</option>
        <option value="banco">Banco</option>
        <option value="tarjeta">Tarjeta</option>
      </select>
      <button id="btnRegistrarPago">Registrar Pago</button>
    </div>
    <div class="card">
      <h2>Resumen Diario</h2>
      <p id="resumenIngresos">Ingresos: $0</p>
      <p id="resumenEfectivo">Efectivo: $0</p>
      <p id="resumenBancos">Bancos: $0</p>
      <p id="resumenTarjeta">Tarjetas: $0</p>
    </div>
    <div class="card">
      <h2>Historial de Pagos</h2>
      <input id="buscarPago" placeholder="Buscar por cliente o método...">
      <div id="listaPagos">Cargando pagos...</div>
    </div>
  `;

  document.getElementById("btnRegistrarPago").onclick = registrarPago;
  document.getElementById("buscarPago").oninput = filtrarPagos;
  await cargarPagos();
  await calcularResumenDiario();
};

async function registrarPago(){
  const cliente = document.getElementById("pagoCliente").value.trim();
  const monto = Number(document.getElementById("pagoMonto").value);
  const metodo = document.getElementById("pagoMetodo").value;
  if(!cliente || monto<=0) return alert("Cliente y monto válidos requeridos");
  await addDoc(collection(db,"pagos"),{cliente,monto,metodo,fecha:new Date()});
  document.getElementById("pagoCliente").value="";
  document.getElementById("pagoMonto").value="";
  document.getElementById("pagoMetodo").value="efectivo";
  await cargarPagos();
  await calcularResumenDiario();
}

async function cargarPagos(){
  const lista = document.getElementById("listaPagos");
  const snapshot = await getDocs(query(collection(db,"pagos"),orderBy("fecha","desc")));
  if(snapshot.empty){ lista.innerHTML="No hay pagos"; return; }
  let html = "<table><tr><th>Fecha</th><th>Cliente</th><th>Método</th><th>Monto</th></tr>";
  snapshot.forEach(doc=>{
    const p=doc.data();
    const fecha = new Date(p.fecha.seconds*1000).toLocaleDateString();
    html += `<tr><td>${fecha}</td><td>${p.cliente}</td><td>${p.metodo}</td><td>$${p.monto}</td></tr>`;
  });
  html+="</table>";
  lista.innerHTML=html;
}

function filtrarPagos(){
  const input = document.getElementById("buscarPago").value.toLowerCase();
  document.querySelectorAll("#listaPagos table tr").forEach((row,i)=>{
    if(i===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input)?"":"none";
  });
}

async function calcularResumenDiario(){
  const snapshot = await getDocs(collection(db,"pagos"));
  const hoy = new Date().toDateString();
  let ingresos=0,efectivo=0,bancos=0,tarjeta=0;
  snapshot.forEach(doc=>{
    const p=doc.data();
    if(p.fecha.toDate().toDateString()===hoy){
      ingresos+=p.monto||0;
      if(p.metodo==="efectivo") efectivo+=p.monto||0;
      else if(p.metodo==="banco") bancos+=p.monto||0;
      else if(p.metodo==="tarjeta") tarjeta+=p.monto||0;
    }
  });
  document.getElementById("resumenIngresos").innerText=`Ingresos: $${ingresos}`;
  document.getElementById("resumenEfectivo").innerText=`Efectivo: $${efectivo}`;
  document.getElementById("resumenBancos").innerText=`Bancos: $${bancos}`;
  document.getElementById("resumenTarjeta").innerText=`Tarjetas: $${tarjeta}`;
}