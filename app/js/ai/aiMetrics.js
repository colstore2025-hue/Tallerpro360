/**
 * aiMetrics.js
 * Módulo de IA para métricas y predicciones - TallerPRO360
 * Versión Final Avanzada
 */

import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * calcularPredicciones
 * Retorna recomendaciones y predicciones para el gerente del taller
 */
export async function calcularPredicciones() {
  try {
    const ordenesSnap = await getDocs(collection(db, "ordenes"));
    const inventarioSnap = await getDocs(collection(db, "inventario"));

    // Variables para KPIs internos
    let tiempoTotal = 0;
    let ingresosTotales = 0;
    let completadas = 0;
    let margenTotal = 0;
    const stockCriticoItems = [];

    const hoy = new Date().toDateString();

    ordenesSnap.forEach(doc => {
      const o = doc.data();

      // Tiempo promedio de reparación
      if(o.estado === "completada" && o.tiempoReparacion) tiempoTotal += o.tiempoReparacion;

      // Margen promedio
      if(o.margen) margenTotal += o.margen;

      // Ingresos del día
      const fechaOrden = o.fecha.toDate().toDateString();
      if(fechaOrden === hoy) ingresosTotales += o.total || 0;

      if(o.estado === "completada") completadas++;
    });

    // Stock crítico
    inventarioSnap.forEach(doc => {
      const p = doc.data();
      if(p.stock <= 3) stockCriticoItems.push(p.nombre || "Item desconocido");
    });

    const tiempoPromedio = ordenesSnap.docs.length ? (tiempoTotal / ordenesSnap.docs.length).toFixed(1) : 0;
    const margenPromedio = ordenesSnap.docs.length ? (margenTotal / ordenesSnap.docs.length).toFixed(1) : 0;

    // ===========================
    // Recomendaciones Inteligentes
    // ===========================
    const recomendaciones = [];

    if(stockCriticoItems.length > 0) {
      recomendaciones.push(`Revisar stock crítico: ${stockCriticoItems.join(", ")}`);
    }
    if(tiempoPromedio > 5) {
      recomendaciones.push(`Reducir tiempo promedio de reparación (actual ${tiempoPromedio}h)`);
    }
    if(margenPromedio < 25) {
      recomendaciones.push(`Optimizar precios o costos para aumentar margen (actual ${margenPromedio}%)`);
    }
    if(completadas < ordenesSnap.docs.length * 0.7) {
      recomendaciones.push(`Incrementar tasa de órdenes completadas (actual ${completadas} de ${ordenesSnap.docs.length})`);
    }
    if(ingresosTotales < 500) {
      recomendaciones.push(`Aumentar ingresos diarios (actual $${ingresosTotales})`);
    }

    return recomendaciones;

  } catch(e) {
    console.error("Error calculando métricas AI:", e);
    return ["Error generando recomendaciones de AI"];
  }
}