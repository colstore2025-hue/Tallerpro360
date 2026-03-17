/**
 * aiAdvisor.js
 * Asistente Inteligente Tesla · Última generación
 * Sugerencias, alertas, optimización y predicciones
 * TallerPRO360 ERP SaaS
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// 🔹 Genera sugerencias y alertas inteligentes
export async function generarSugerencias({ ordenes = [], inventario = [], empresaId }) {
  const sugerencias = [];

  // ===== Análisis financiero y operativo =====
  let totalVentas = 0, totalCosto = 0, totalItems = 0;
  ordenes.forEach(o => {
    totalVentas += Number(o.total || 0);
    totalCosto += Number(o.costoTotal || 0);
    totalItems += o.items?.length || 1;
  });

  const utilidad = totalVentas - totalCosto;
  const ticketPromedio = totalItems ? (totalVentas / totalItems).toFixed(2) : 0;
  const margen = totalVentas ? ((utilidad / totalVentas) * 100).toFixed(2) : 0;

  sugerencias.push(`📈 Margen promedio: ${margen}%`);
  sugerencias.push(`🎯 Ticket promedio: $${ticketPromedio}`);

  // ===== Alertas de inventario =====
  inventario.forEach(r => {
    if ((r.stock || 0) <= (r.stockMinimo || 0)) {
      sugerencias.push(`⚠️ Stock crítico: ${r.nombre}`);
    }
  });

  // ===== Recomendaciones inteligentes =====
  if (ordenes.length && inventario.length) {
    // Top repuestos vendidos
    const topRepuestos = inventario
      .sort((a,b) => (b.ventasRecientes||0) - (a.ventasRecientes||0))
      .slice(0,3)
      .map(r => r.nombre);
    if(topRepuestos.length) {
      sugerencias.push(`🚀 Reaprovisiona: ${topRepuestos.join(", ")}`);
    }

    // Optimización de precios
    sugerencias.push(`💡 Revisa precios para maximizar utilidades`);
  }

  // ===== Predicciones simples =====
  const proyeccionVentas = (totalVentas * 1.05).toFixed(2); // +5% esperado
  sugerencias.push(`🔮 Proyección de ventas próxima semana: $${proyeccionVentas}`);

  return { 
    sugerencias, 
    resumen: { totalVentas, totalCosto, utilidad, ticketPromedio, margen, proyeccionVentas } 
  };
}

// 🔹 Render dinámico en interfaz (Tesla UI)
export function renderSugerencias(containerId, data) {
  const container = document.getElementById(containerId);
  if(!container) return;

  const { sugerencias = [], resumen = {} } = data;

  container.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 25px #00ff99;
      font-family: 'Segoe UI', sans-serif;
    ">
      <h2 style="color:#00ffcc;">🧠 Asistente Inteligente PRO360</h2>
      
      <h3 style="color:#ffcc00;">📊 Resumen financiero</h3>
      <p>💰 Ventas: $${formatear(resumen.totalVentas)}</p>
      <p>📉 Costos: $${formatear(resumen.totalCosto)}</p>
      <p>📈 Utilidad: $${formatear(resumen.utilidad)}</p>
      <p>🎯 Ticket promedio: $${resumen.ticketPromedio}</p>
      <p>📊 Margen: ${resumen.margen}%</p>
      <p>🔮 Proyección: $${resumen.proyeccionVentas}</p>

      <h3 style="color:#00ffff;">💡 Sugerencias y alertas</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${sugerencias.map(s => `<p style="color:#0ff; margin:0;">${s}</p>`).join("")}
      </div>
    </div>
  `;
}

// 🔹 Función helper para formatear dinero
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}