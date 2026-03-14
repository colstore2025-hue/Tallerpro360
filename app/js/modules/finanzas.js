/**
 * finanzas.js
 * Módulo avanzado de Finanzas - TallerPRO360 ERP
 * Ruta: app/js/modules/finanzas.js
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function finanzas(container) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">💰 Finanzas del Taller</h1>

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
      <div id="listaMovimientos">Cargando movimientos...</div>
    </div>
  `;

  await cargarMovimientos();

  document.getElementById("buscarMovimiento").addEventListener("input", filtrarMovimientos);
}

/* ===========================
CARGAR MOVIMIENTOS Y CALCULAR BALANCE
=========================== */
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

    // Actualizar estadísticas
    document.getElementById("ingresosTotal").innerText = `$${ingresos}`;
    document.getElementById("gastosTotal").innerText = `$${gastos}`;
    document.getElementById("balanceTotal").innerText = `$${ingresos - gastos}`;

  } catch(e){
    console.error("Error cargando movimientos:", e);
    lista.innerHTML = "❌ Error cargando movimientos";
  }
}

/* ===========================
FILTRAR MOVIMIENTOS
=========================== */
function filtrarMovimientos(){
  const input = document.getElementById("buscarMovimiento").value.toLowerCase();
  const rows = document.querySelectorAll("#listaMovimientos table tr");
  rows.forEach((row,index)=>{
    if(index===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}