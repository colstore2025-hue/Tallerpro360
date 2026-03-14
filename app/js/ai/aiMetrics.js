/*
================================================
aiMetrics.js
Métricas y predicciones inteligentes para TallerPRO360
Ubicación: /app/js/ai/aiMetrics.js
Versión Final Integrada
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================
Calcular KPIs y predicciones del taller
Retorna array de recomendaciones inteligentes
=========================== */
export async function calcularPredicciones() {
  try {
    const ordenesSnap = await getDocs(collection(db,"ordenes"));
    const inventarioSnap = await getDocs(collection(db,"inventario"));
    const pagosSnap = await getDocs(collection(db,"pagos"));

    const hoy = new Date().toDateString();

    // ===========================
    // Cálculos operativos
    // ===========================
    let completadasHoy = 0;
    let ingresosHoy = 0;
    let tiempoTotal = 0;
    let margenTotal = 0;
    let stockCritico = 0;

    // Órdenes
    ordenesSnap.docs.forEach(doc=>{
      const o = doc.data();
      const fechaOrden = o.fecha.toDate().toDateString();

      if(fechaOrden === hoy) ingresosHoy += o.total || 0;
      if(o.estado === "completada") {
        completadasHoy++;
        tiempoTotal += o.tiempoReparacion || 0;
        margenTotal += o.margen || 0;
      }
    });

    const tiempoPromedio = ordenesSnap.docs.length ? (tiempoTotal / ordenesSnap.docs.length).toFixed(1) : 0;
    const margenPromedio = ordenesSnap.docs.length ? (margenTotal / ordenesSnap.docs.length).toFixed(1) : 0;

    // Inventario crítico
    stockCritico = inventarioSnap.docs.filter(p=>p.data().stock <=3).length;

    // Flujo de caja hoy
    let ingresosPagosHoy = 0;
    pagosSnap.docs.forEach(p=>{
      if(p.data().fecha.toDate().toDateString() === hoy) ingresosPagosHoy += p.data().monto || 0;
    });

    // ===========================
    // Recomendaciones IA
    // ===========================
    const recomendaciones = [];

    if(stockCritico > 0) recomendaciones.push(`Hay ${stockCritico} productos en stock crítico. Considera reabastecer.`);
    if(tiempoPromedio > 4) recomendaciones.push(`Tiempo promedio de reparación elevado: ${tiempoPromedio}h. Optimiza procesos.`);
    if(margenPromedio < 20) recomendaciones.push(`Margen de utilidad promedio bajo (${margenPromedio}%). Revisa costos y precios.`);
    if(ingresosHoy < ingresosPagosHoy) recomendaciones.push(`Ingresos de órdenes menores a pagos registrados. Verifica conciliación de caja.`);
    if(completadasHoy < 3) recomendaciones.push(`Órdenes completadas hoy bajas: ${completadasHoy}. Revisa asignación de trabajo.`);

    if(recomendaciones.length === 0) recomendaciones.push("Todos los KPIs dentro de parámetros normales. Excelente gestión.");

    return recomendaciones;

  } catch(e) {
    console.error("Error calculando métricas IA:", e);
    return ["❌ Error generando recomendaciones IA"];
  }
}