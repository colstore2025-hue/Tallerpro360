/**
 * contabilidad.js
 * Módulo avanzado de Contabilidad - TallerPRO360
 * Genera balance, P&L y reportes contables
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * contabilidad(container)
 * @param {HTMLElement} container - contenedor principal para renderizar contabilidad
 */
export async function contabilidad(container) {

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">📊 Contabilidad</h1>

    <div class="card" style="margin-bottom:20px;">
      <h3>Filtrar por mes</h3>
      <input type="month" id="mesContabilidad" style="padding:8px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="cargarReporte" style="margin-left:10px;padding:8px 12px;background:#16a34a;color:white;border:none;border-radius:6px;cursor:pointer;">Generar Reporte</button>
    </div>

    <div id="resumenContabilidad">
      <p>Selecciona un mes y presiona "Generar Reporte".</p>
    </div>
  `;

  document.getElementById("cargarReporte").onclick = async () => {
    const mes = document.getElementById("mesContabilidad").value;
    if(!mes) return alert("Selecciona un mes");
    await generarReporte(container, mes);
  };
}

/* ===============================
FUNCIONES PRINCIPALES
=============================== */

/**
 * generarReporte(container, mes)
 * Obtiene todos los movimientos del mes y calcula balance y P&L
 */
async function generarReporte(container, mes){
  const [anio, mesNum] = mes.split("-");

  const inicio = new Date(anio, mesNum-1, 1);
  const fin = new Date(anio, mesNum, 0, 23, 59, 59);

  // =====================================
  // Obtener ingresos y gastos de Firestore
  // =====================================
  const ingresos = await getMovimientos("ingresos", inicio, fin);
  const gastos = await getMovimientos("gastos", inicio, fin);

  // =====================================
  // Calcular totals
  // =====================================
  const totalIngresos = ingresos.reduce((acc, i) => acc + (i.monto || 0), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
  const balance = totalIngresos - totalGastos;

  // =====================================
  // Renderizar HTML resumen
  // =====================================
  const resumen = `
    <div class="card" style="margin-bottom:15px;">
      <h3>Balance del Mes ${mes}</h3>
      <p><b>Ingresos:</b> $${totalIngresos.toFixed(2)}</p>
      <p><b>Gastos:</b> $${totalGastos.toFixed(2)}</p>
      <p><b>Balance:</b> $${balance.toFixed(2)}</p>
    </div>

    <div class="card">
      <h3>Detalle de Ingresos</h3>
      <ul>
        ${ingresos.map(i => `<li>${i.fecha.toDate().toLocaleDateString()} - ${i.descripcion} - $${i.monto}</li>`).join("")}
      </ul>
    </div>

    <div class="card">
      <h3>Detalle de Gastos</h3>
      <ul>
        ${gastos.map(g => `<li>${g.fecha.toDate().toLocaleDateString()} - ${g.descripcion} - $${g.monto}</li>`).join("")}
      </ul>
    </div>
  `;

  container.querySelector("#resumenContabilidad").innerHTML = resumen;
}

/**
 * getMovimientos(tipo, inicio, fin)
 * @param {string} tipo - "ingresos" o "gastos"
 * @param {Date} inicio
 * @param {Date} fin
 * @returns {Array} movimientos
 */
async function getMovimientos(tipo, inicio, fin){
  try{
    const q = query(
      collection(db, tipo),
      where("fecha", ">=", inicio),
      where("fecha", "<=", fin),
      orderBy("fecha","asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch(e){
    console.error(`Error obteniendo ${tipo}:`, e);
    return [];
  }
}