/*
================================================
PAGOSTALLER.JS - Módulo Avanzado de Pagos y Flujo de Caja
TallerPRO360 - Versión Final Integrada
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { actualizarContabilidad } from "./contabilidad.js"; // integración contable

export async function pagosTaller(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">💳 Pagos y Flujo de Caja</h1>

    <div class="card mb-6">
      <h2 class="font-semibold mb-3">Registrar Nuevo Pago</h2>
      <input id="pagoCliente" placeholder="Cliente" style="width:100%;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input id="pagoMonto" type="number" placeholder="Monto" style="width:100%;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <select id="pagoMetodo" style="width:100%;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
        <option value="efectivo">Efectivo</option>
        <option value="banco">Transferencia / Banco</option>
        <option value="tarjeta">Tarjeta</option>
      </select>
      <button id="btnRegistrarPago" class="bg-green-600 text-white px-4 py-2 rounded">Registrar Pago</button>
    </div>

    <div class="card mb-6">
      <h2 class="font-semibold mb-3">Resumen Diario</h2>
      <p id="resumenIngresos">Ingresos: $0</p>
      <p id="resumenEfectivo">Efectivo: $0</p>
      <p id="resumenBancos">Bancos: $0</p>
      <p id="resumenTarjeta">Tarjetas: $0</p>
      <button id="btnCierreDia" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded">Cerrar Día</button>
    </div>

    <div class="card">
      <h2 class="font-semibold mb-3">Historial de Pagos</h2>
      <input id="buscarPago" placeholder="Buscar por cliente o método..." style="width:100%;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <div id="listaPagos">Cargando pagos...</div>
    </div>
  `;

  // ===========================
  // Eventos
  // ===========================
  document.getElementById("btnRegistrarPago").onclick = registrarPago;
  document.getElementById("buscarPago").oninput = filtrarPagos;
  document.getElementById("btnCierreDia").onclick = cierreDelDia;

  await cargarPagos();
  await calcularResumenDiario();
}

// ===========================
// Registrar un nuevo pago
// ===========================
async function registrarPago() {
  const cliente = document.getElementById("pagoCliente").value.trim();
  const monto = Number(document.getElementById("pagoMonto").value);
  const metodo = document.getElementById("pagoMetodo").value;

  if(!cliente) return alert("Cliente es obligatorio");
  if(monto <= 0) return alert("Monto inválido");

  try {
    const pagoDoc = {
      cliente,
      monto,
      metodo,
      fecha: new Date()
    };

    await addDoc(collection(db,"pagos"), pagoDoc);

    // Integración contable automática
    await actualizarContabilidad({
      tipo: "ingreso",
      cliente,
      monto,
      metodo,
      fecha: pagoDoc.fecha,
      descripcion: `Pago recibido de ${cliente}`
    });

    alert("✅ Pago registrado y contabilidad actualizada");

    // Limpiar formulario
    document.getElementById("pagoCliente").value = "";
    document.getElementById("pagoMonto").value = "";
    document.getElementById("pagoMetodo").value = "efectivo";

    await cargarPagos();
    await calcularResumenDiario();

  } catch(e) {
    console.error("Error registrando pago:", e);
    alert("❌ Error registrando pago");
  }
}

// ===========================
// Cargar pagos desde Firestore
// ===========================
async function cargarPagos() {
  const lista = document.getElementById("listaPagos");
  try {
    const q = query(collection(db,"pagos"), orderBy("fecha","desc"));
    const snapshot = await getDocs(q);

    if(snapshot.empty) {
      lista.innerHTML = "No hay pagos registrados";
      return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;">
        <th>Fecha</th><th>Cliente</th><th>Método</th><th>Monto</th>
      </tr>`;

    snapshot.forEach(docSnap=>{
      const p = docSnap.data();
      const fecha = new Date(p.fecha.seconds * 1000).toLocaleString();
      html += `<tr>
        <td>${fecha}</td>
        <td>${p.cliente}</td>
        <td>${p.metodo}</td>
        <td>$${p.monto}</td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;

  } catch(e) {
    console.error("Error cargando pagos:", e);
    lista.innerHTML = "❌ Error cargando pagos";
  }
}

// ===========================
// Filtrar pagos
// ===========================
function filtrarPagos() {
  const input = document.getElementById("buscarPago").value.toLowerCase();
  const rows = document.querySelectorAll("#listaPagos table tr");
  rows.forEach((row,index)=>{
    if(index===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

// ===========================
// Resumen diario
// ===========================
async function calcularResumenDiario() {
  try {
    const snapshot = await getDocs(collection(db,"pagos"));
    const hoy = new Date().toDateString();

    let ingresos = 0, efectivo = 0, bancos = 0, tarjeta = 0;

    snapshot.forEach(docSnap=>{
      const p = docSnap.data();
      const fechaPago = p.fecha.toDate().toDateString();
      if(fechaPago === hoy){
        ingresos += p.monto || 0;
        if(p.metodo === "efectivo") efectivo += p.monto || 0;
        else if(p.metodo === "banco") bancos += p.monto || 0;
        else if(p.metodo === "tarjeta") tarjeta += p.monto || 0;
      }
    });

    document.getElementById("resumenIngresos").innerText = `Ingresos: $${ingresos}`;
    document.getElementById("resumenEfectivo").innerText = `Efectivo: $${efectivo}`;
    document.getElementById("resumenBancos").innerText = `Bancos: $${bancos}`;
    document.getElementById("resumenTarjeta").innerText = `Tarjetas: $${tarjeta}`;

  } catch(e) {
    console.error("Error calculando resumen diario:", e);
  }
}

// ===========================
// Cierre del día
// ===========================
async function cierreDelDia() {
  const resumen = {
    fecha: new Date(),
    ingresos: document.getElementById("resumenIngresos").innerText.replace("Ingresos: $",""),
    efectivo: document.getElementById("resumenEfectivo").innerText.replace("Efectivo: $",""),
    bancos: document.getElementById("resumenBancos").innerText.replace("Bancos: $",""),
    tarjeta: document.getElementById("resumenTarjeta").innerText.replace("Tarjetas: $","")
  };

  // Guardar cierre en Firestore para auditoría
  try {
    await addDoc(collection(db,"cierres_diarios"), resumen);
    alert("✅ Cierre del día registrado correctamente");
  } catch(e) {
    console.error("Error registrando cierre diario:", e);
    alert("❌ Error registrando cierre diario");
  }
}