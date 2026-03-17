/**
 * IA GERENTE TOTAL - PRO
 * Analiza el negocio completo del taller en tiempo real
 */

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { hablar } from "../voice/voiceCore.js";

// 🔥 FUNCIÓN PRINCIPAL
export async function analizarNegocio() {
  try {

    const db = window.db;

    if (!db) {
      console.warn("⚠️ DB no disponible");
      return null;
    }

    const snapshot = await getDocs(collection(db, "ordenes"));

    // 🧊 SIN DATOS
    if (snapshot.empty) {
      return {
        resumen: {
          ingresos: 0,
          costos: 0,
          utilidad: 0,
          ordenes: 0,
          ticketPromedio: 0,
          margen: 0
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

      const total = Number(data.total) || 0;
      const costo = Number(data.costoTotal) || 0;
      const utilidad = total - costo;

      totalIngresos += total;
      totalCostos += costo;

      ordenes.push({
        ...data,
        utilidad
      });
    });

    const totalUtilidad = totalIngresos - totalCostos;

    // 📊 MÉTRICAS INTELIGENTES
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

---

/**
 * ⚠️ ALERTAS INTELIGENTES
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
    alertas.push("⚠️ Margen de ganancia muy bajo");
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

---

/**
 * 🚀 RECOMENDACIONES AUTOMÁTICAS
 */
function generarRecomendaciones(resumen, ordenes) {

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
    recomendaciones.push("🚀 Buen margen, puedes escalar el negocio");
  }

  if (resumen.serviciosFrecuentes.length > 0) {
    recomendaciones.push("🔧 Potencia los servicios más frecuentes");
  }

  return recomendaciones;
}

---

/**
 * 🗣️ VOZ GERENCIAL
 */
export function hablarResumen(data) {
  if (!data) return;

  const { resumen } = data;

  const mensaje = `
    Atención.
    Ingresos totales ${resumen.ingresos} pesos.
    Utilidad ${resumen.utilidad}.
    Margen del ${resumen.margen} por ciento.
    Ticket promedio ${resumen.ticketPromedio}.
  `;

  hablar(mensaje);
}

---

/**
 * 🔥 EJECUCIÓN AUTOMÁTICA (OPCIONAL)
 * IA analiza sola cada cierto tiempo
 */
export function iniciarMonitoreoIA(intervalo = 60000) {

  setInterval(async () => {

    const data = await analizarNegocio();

    if (!data) return;

    console.log("🧠 IA Gerente Auto:", data);

    if (data.alertas.length > 0) {
      hablar("Atención. Se detectaron alertas en el negocio");
    }

  }, intervalo);
}