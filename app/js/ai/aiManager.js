/**
 * IA GERENTE TOTAL - PRO
 * Analiza el negocio completo del taller (SaaS READY)
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { hablar } from "../voice/voiceCore.js";

// 🔥 FUNCIÓN PRINCIPAL
export async function analizarNegocio(state) {
  try {

    const db = window.db;

    if (!db) {
      console.warn("⚠️ DB no disponible");
      return null;
    }

    if (!state?.empresaId) {
      console.warn("⚠️ empresaId no definido");
      return null;
    }

    // 🔐 SaaS FILTER
    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );

    const snapshot = await getDocs(q);

    // 🧊 SIN DATOS
    if (snapshot.empty) {
      return {
        resumen: {
          ingresos: 0,
          costos: 0,
          utilidad: 0,
          ordenes: 0,
          ticketPromedio: 0,
          margen: 0,
          serviciosFrecuentes: []
        },
        alertas: ["⚠️ No hay órdenes registradas"],
        recomendaciones: ["📌 Empieza registrando órdenes"]
      };
    }

    let totalIngresos = 0;
    let totalCostos = 0;
    let ordenes = [];

    snapshot.forEach(doc => {
      const data = doc.data() || {};

      const total = Number(data.total || data.valorTrabajo || 0);
      const costo = Number(data.costoTotal || 0);
      const utilidad = total - costo;

      totalIngresos += total;
      totalCostos += costo;

      ordenes.push({
        ...data,
        utilidad
      });
    });

    const totalUtilidad = totalIngresos - totalCostos;

    const totalOrdenes = ordenes.length;

    const ticketPromedio = totalOrdenes > 0
      ? totalIngresos / totalOrdenes
      : 0;

    const margen = totalIngresos > 0
      ? (totalUtilidad / totalIngresos) * 100
      : 0;

    // 🧠 SERVICIOS MÁS FRECUENTES
    const serviciosMap = {};

    ordenes.forEach(o => {
      (o.items || []).forEach(item => {
        const nombre = item.nombre || "General";
        serviciosMap[nombre] = (serviciosMap[nombre] || 0) + 1;
      });
    });

    const serviciosFrecuentes = Object.entries(serviciosMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    const resumen = {
      ingresos: Math.round(totalIngresos),
      costos: Math.round(totalCostos),
      utilidad: Math.round(totalUtilidad),
      ordenes: totalOrdenes,
      ticketPromedio: Math.round(ticketPromedio),
      margen: Math.round(margen),
      serviciosFrecuentes
    };

    const alertas = generarAlertas(resumen, ordenes);
    const recomendaciones = generarRecomendaciones(resumen, ordenes);

    return {
      resumen,
      alertas,
      recomendaciones
    };

  } catch (e) {
    console.error("❌ Error IA gerente:", e);
    return null;
  }
}

/**
 * ⚠️ ALERTAS
 */
function generarAlertas(resumen, ordenes) {

  let alertas = [];

  if (resumen.utilidad < 0) {
    alertas.push("❌ Estás perdiendo dinero");
  }

  if (resumen.ordenes < 5) {
    alertas.push("⚠️ Pocas órdenes registradas");
  }

  if (resumen.margen < 20) {
    alertas.push("⚠️ Margen bajo");
  }

  const ordenesBajas = ordenes.filter(o => o.utilidad < 20000);

  if (ordenesBajas.length > ordenes.length * 0.4) {
    alertas.push("⚠️ Muchas órdenes poco rentables");
  }

  if (resumen.costos > resumen.ingresos * 0.8) {
    alertas.push("💸 Costos demasiado altos");
  }

  return alertas;
}

/**
 * 🚀 RECOMENDACIONES
 */
function generarRecomendaciones(resumen) {

  let recomendaciones = [];

  if (resumen.utilidad > 0) {
    recomendaciones.push("✅ El taller es rentable");
  }

  if (resumen.costos > resumen.ingresos * 0.7) {
    recomendaciones.push("💸 Reduce costos o sube precios");
  }

  if (resumen.ticketPromedio < 100000) {
    recomendaciones.push("📈 Aumenta el valor por servicio");
  }

  if (resumen.margen > 30) {
    recomendaciones.push("🚀 Buen margen, puedes escalar");
  }

  if (resumen.serviciosFrecuentes.length > 0) {
    recomendaciones.push("🔧 Potencia servicios más frecuentes");
  }

  return recomendaciones;
}

/**
 * 🗣️ VOZ
 */
export function hablarResumen(data) {
  if (!data) return;

  const { resumen } = data;

  hablar(`
    Atención.
    Ingresos ${resumen.ingresos} pesos.
    Utilidad ${resumen.utilidad}.
    Margen ${resumen.margen} por ciento.
  `);
}

/**
 * 🤖 AUTO MONITOREO
 */
export function iniciarMonitoreoIA(state, intervalo = 60000) {

  setInterval(async () => {

    const data = await analizarNegocio(state);

    if (!data) return;

    console.log("🧠 IA Gerente:", data);

    if (data.alertas.length > 0) {
      hablar("Atención. Hay alertas en el negocio");
    }

  }, intervalo);
}