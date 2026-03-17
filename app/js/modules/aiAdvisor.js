/**
 * aiAdvisor.js
 * Asistente Inteligente para talleres: sugerencias, alertas y optimización
 * Nivel Tesla · Última generación
 * TallerPRO360 ERP SaaS
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export async function generarSugerencias({ ordenes = [], inventario = [], empresaId }) {
  const sugerencias = [];

  // 🔹 Analizar órdenes recientes para margen y ticket promedio
  let totalVentas = 0, totalCosto = 0, totalItems = 0;
  ordenes.forEach(o => {
    totalVentas += Number(o.precio || o.total || 0);
    totalCosto += Number(o.costo || 0);
    totalItems += o.cantidad || 1;
  });

  const utilidad = totalVentas - totalCosto;
  const ticketPromedio = totalItems ? (totalVentas / totalItems).toFixed(2) : 0;
  const margen = totalVentas ? ((utilidad / totalVentas) * 100).toFixed(2) : 0;

  sugerencias.push(`📈 Margen promedio actual: ${margen}%`);
  sugerencias.push(`🎯 Ticket promedio: $${ticketPromedio}`);

  // 🔹 Alertas de inventario bajo
  inventario.forEach(r => {
    if ((r.stock || 0) <= (r.stockMinimo || 0)) {
      sugerencias.push(`⚠️ Stock bajo para: ${r.nombre}`);
    }
  });

  // 🔹 Recomendaciones inteligentes de compra o venta
  if (ordenes.length > 0 && inventario.length > 0) {
    sugerencias.push(`🚀 Considera reaprovisionar los repuestos más vendidos`);
    sugerencias.push(`💡 Revisa precios de venta para optimizar utilidades`);
  }

  return { sugerencias, resumen: { totalVentas, totalCosto, utilidad, ticketPromedio, margen } };
}

// 🔹 Render dinámico en la interfaz
export function renderSugerencias(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { sugerencias = [], resumen = {} } = data;

  container.innerHTML = `
    <div style="
      background:#0f172a; 
      padding:20px; 
      border-radius:12px; 
      box-shadow:0 0 20px #00ff99;
    ">
      <h2 style="color:#00ffcc;">🧠 Asistente Inteligente</h2>
      <h3 style="color:#ffcc00;">📊 Resumen</h3>
      <p>💰 Ventas: $${formatear(resumen.totalVentas)}</p>
      <p>📉 Costos: $${formatear(resumen.totalCosto)}</p>
      <p>📈 Utilidad: $${formatear(resumen.utilidad)}</p>
      <p>🎯 Ticket promedio: $${resumen.ticketPromedio}</p>
      <p>📊 Margen: ${resumen.margen}%</p>

      <h3 style="color:#00ffff;">💡 Sugerencias y alertas</h3>
      ${sugerencias.map(s => `<p style="color:#0ff;">${s}</p>`).join("")}
    </div>
  `;
}

// 🔹 Formateo de dinero
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}