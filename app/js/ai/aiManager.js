/**
 * IA GERENTE TOTAL
 */

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { hablar } from "../voice/voiceCore.js";

// 🔥 ANALIZAR TODO EL NEGOCIO
export async function analizarNegocio() {
  try {

    const snapshot = await getDocs(collection(window.db, "ordenes"));

    let totalIngresos = 0;
    let totalCostos = 0;
    let totalUtilidad = 0;
    let ordenes = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      const total = Number(data.total || 0);
      const costo = Number(data.costoTotal || 0);
      const utilidad = total - costo;

      totalIngresos += total;
      totalCostos += costo;
      totalUtilidad += utilidad;

      ordenes.push({
        ...data,
        utilidad
      });
    });

    const resumen = {
      ingresos: totalIngresos,
      costos: totalCostos,
      utilidad: totalUtilidad,
      ordenes: ordenes.length
    };

    const alertas = generarAlertas(resumen, ordenes);
    const recomendaciones = generarRecomendaciones(resumen, ordenes);

    return {
      resumen,
      alertas,
      recomendaciones
    };

  } catch (e) {
    console.error("Error IA gerente:", e);
    return null;
  }
}

function generarAlertas(resumen, ordenes) {

  let alertas = [];

  if (resumen.utilidad < 0) {
    alertas.push("❌ Estás perdiendo dinero");
  }

  if (resumen.ordenes < 5) {
    alertas.push("⚠️ Pocas órdenes registradas");
  }

  const ordenesBajas = ordenes.filter(o => o.utilidad < 20000);

  if (ordenesBajas.length > 3) {
    alertas.push("⚠️ Muchas órdenes con baja utilidad");
  }

  return alertas;
}

function generarRecomendaciones(resumen, ordenes) {

  let recomendaciones = [];

  if (resumen.utilidad > 0) {
    recomendaciones.push("✅ El taller es rentable");
  }

  if (resumen.costos > resumen.ingresos * 0.7) {
    recomendaciones.push("💸 Reduce costos de repuestos");
  }

  if (ordenes.length > 0) {
    recomendaciones.push("📈 Promociona servicios más frecuentes");
  }

  return recomendaciones;
}

export function hablarResumen(data) {
  if (!data) return;

  const { resumen } = data;

  const mensaje = `
    El taller tiene ingresos de ${resumen.ingresos} pesos,
    con una utilidad de ${resumen.utilidad}.
  `;

  hablar(mensaje);
}