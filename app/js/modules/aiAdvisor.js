/**
 * aiAdvisor.js
 * Asistente Inteligente PRO360 · FIX GLOBAL
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

/* =========================
GENERAR SUGERENCIAS
========================= */
export async function generarSugerencias({
  ordenes = [],
  inventario = [],
  empresaId
} = {}) {

  try {

    const sugerencias = [];

    /* ===== MÉTRICAS ===== */
    let totalVentas = 0;
    let totalCosto = 0;
    let totalItems = 0;

    ordenes.forEach(o => {
      totalVentas += Number(o.total || 0);
      totalCosto += Number(o.costoTotal || 0);
      totalItems += (o.items?.length || 1);
    });

    const utilidad = totalVentas - totalCosto;

    const ticketPromedio = totalItems
      ? (totalVentas / totalItems)
      : 0;

    const margen = totalVentas
      ? ((utilidad / totalVentas) * 100)
      : 0;

    sugerencias.push(`📈 Margen promedio: ${margen.toFixed(2)}%`);
    sugerencias.push(`🎯 Ticket promedio: $${formatear(ticketPromedio)}`);

    /* ===== INVENTARIO ===== */
    inventario.forEach(r => {
      if ((r.stock || 0) <= (r.stockMinimo || 0)) {
        sugerencias.push(`⚠️ Stock crítico: ${r.nombre}`);
      }
    });

    /* ===== INTELIGENCIA ===== */
    if (ordenes.length && inventario.length) {

      const topRepuestos = [...inventario]
        .sort((a, b) => (b.ventasRecientes || 0) - (a.ventasRecientes || 0))
        .slice(0, 3)
        .map(r => r.nombre);

      if (topRepuestos.length) {
        sugerencias.push(`🚀 Reaprovisiona: ${topRepuestos.join(", ")}`);
      }

      sugerencias.push(`💡 Optimiza precios para mejorar utilidad`);
    }

    /* ===== PROYECCIÓN ===== */
    const proyeccionVentas = totalVentas * 1.05;

    sugerencias.push(
      `🔮 Proyección próxima semana: $${formatear(proyeccionVentas)}`
    );

    return {
      sugerencias,
      resumen: {
        totalVentas,
        totalCosto,
        utilidad,
        ticketPromedio: formatear(ticketPromedio),
        margen: margen.toFixed(2),
        proyeccionVentas: formatear(proyeccionVentas)
      }
    };

  } catch (error) {

    console.error("❌ Error en generarSugerencias:", error);

    return {
      sugerencias: ["⚠️ No se pudieron generar sugerencias"],
      resumen: {}
    };
  }
}

/* =========================
RENDER
========================= */
export function renderSugerencias(containerId, data = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const sugerencias = data?.sugerencias || [];
  const resumen = data?.resumen || {};

  container.innerHTML = `
    <div style="
      background:#0f172a;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 20px #00ff99;
    ">
      <h2 style="color:#00ffcc;">🧠 IA PRO360</h2>

      <h3 style="color:#ffcc00;">📊 Resumen</h3>
      <p>💰 Ventas: $${formatear(resumen.totalVentas)}</p>
      <p>📉 Costos: $${formatear(resumen.totalCosto)}</p>
      <p>📈 Utilidad: $${formatear(resumen.utilidad)}</p>
      <p>🎯 Ticket: $${resumen.ticketPromedio || 0}</p>
      <p>📊 Margen: ${resumen.margen || 0}%</p>
      <p>🔮 Proyección: $${resumen.proyeccionVentas || 0}</p>

      <h3 style="color:#00ffff;">💡 Sugerencias</h3>
      ${sugerencias.length
        ? sugerencias.map(s => `<p>${s}</p>`).join("")
        : "<p>Sin sugerencias</p>"
      }
    </div>
  `;
}

/* =========================
UTIL
========================= */
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}