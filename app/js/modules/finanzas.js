/*
================================================
FINANZAS.JS - Versión Avanzada
Módulo de Finanzas con voz de IA y alertas
Ubicación: /app/js/modules/finanzas.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function finanzas(container) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💰 Finanzas del Taller - Avanzado</h1>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:25px;">
      <div class="card" style="background:#dcfce7;">
        <h3>Ingresos</h3>
        <p id="ingresosTotal" style="font-size:28px;">$0</p>
      </div>
      <div class="card" style="background:#fee2e2;">
        <h3>Gastos</h3>
        <p id="gastosTotal" style="font-size:28px;">$0</p>
      </div>
      <div class="card" style="background:#dbeafe;">
        <h3>Balance</h3>
        <p id="balanceTotal" style="font-size:28px;">$0</p>
      </div>
    </div>

    <div class="card">
      <h2>Movimientos Financieros</h2>
      <input id="buscarMovimiento" placeholder="Buscar por concepto..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="leerBalanceVoz" style="margin-bottom:10px;padding:8px 15px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🔊 Leer Balance</button>
      <div id="listaMovimientos">Cargando movimientos...</div>
    </div>
  `;

  document.getElementById("buscarMovimiento").addEventListener("input", filtrarMovimientos);
  document.getElementById("leerBalanceVoz").onclick = leerBalanceVoz;

  await cargarMovimientos();
}

let ultimoBalance = {ingresos:0, gastos:0, balance:0};

async function cargarMovimientos() {
  const lista = document.getElementById("listaMovimientos");
  try {
    const q = query(collection(db,"movimientos"), orderBy("fecha","desc"));
    const snapshot = await getDocs(q);

    if(snapshot.empty){ 
      lista.innerHTML = "No hay movimientos registrados"; 
      return; 
    }

    let ingresos = 0;
    let gastos = 0;
    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;">
        <th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Monto</th>
      </tr>`;

    snapshot.forEach(docSnap=>{
      const m = docSnap.data();
      const monto = Number(m.monto || 0);
      if(m.tipo === "ingreso") ingresos += monto;
      else if(m.tipo === "gasto") gastos += monto;

      html += `<tr>
        <td>${new Date(m.fecha.seconds*1000).toLocaleDateString()}</td>
        <td>${m.concepto || "-"}</td>
        <td>${m.tipo || "-"}</td>
        <td>$${monto}</td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;

    const balance = ingresos - gastos;
    document.getElementById("ingresosTotal").innerText = `$${ingresos}`;
    document.getElementById("gastosTotal").innerText = `$${gastos}`;
    document.getElementById("balanceTotal").innerText = `$${balance}`;

    ultimoBalance = {ingresos, gastos, balance};
    hablar(`Balance actualizado. Ingresos ${ingresos} dólares. Gastos ${gastos} dólares. Balance total ${balance} dólares.`);

  } catch(e){
    console.error("Error cargando movimientos:", e);
    lista.innerHTML = "❌ Error cargando movimientos";
    hablar("Ocurrió un error al cargar los movimientos financieros");
  }
}

function filtrarMovimientos(){
  const input = document.getElementById("buscarMovimiento").value.toLowerCase();
  const rows = document.querySelectorAll("#listaMovimientos table tr");
  rows.forEach((row,index)=>{
    if(index===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

function leerBalanceVoz(){
  const {ingresos, gastos, balance} = ultimoBalance;
  if(ingresos === 0 && gastos === 0){
    hablar("No hay movimientos registrados aún");
  } else {
    hablar(`Resumen financiero. Ingresos: ${ingresos} dólares. Gastos: ${gastos} dólares. Balance total: ${balance} dólares.`);
  }
}

function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}