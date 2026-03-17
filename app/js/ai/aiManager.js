/**
 * 🧠 IA GERENTE TOTAL PRO
 * TallerPRO360 SaaS
 * IA asesora (NO autónoma invasiva)
 */

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";


/* ======================================================
🔥 FUNCIÓN PRINCIPAL
====================================================== */

export async function analizarNegocio(state) {

  try {

    if (!state?.empresaId) {
      console.warn("⚠️ empresaId no definido");
      return null;
    }

    /* ===============================
    🔐 CONSULTA SaaS
    =============================== */

    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", state.empresaId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return construirRespuestaVacia();
    }

    /* ===============================
    📊 PROCESAR DATOS
    =============================== */

    let totalIngresos = 0;
    let totalCostos = 0;
    let ordenes = [];

    snapshot.forEach(doc => {

      const data = doc.data() || {};

      const total = Number(data.total || data.valorTrabajo || 0);
      const costo = Number(data.costoTotal || 0);

      totalIngresos += total;
      totalCostos += costo;

      ordenes.push({
        ...data,
        utilidad: total - costo
      });

    });

    const totalOrdenes = ordenes.length;
    const utilidad = totalIngresos - totalCostos;

    const ticketPromedio = totalOrdenes
      ? totalIngresos / totalOrdenes
      : 0;

    const margen = totalIngresos
      ? (utilidad / totalIngresos) * 100
      : 0;

    const serviciosFrecuentes = calcularServiciosFrecuentes(ordenes);

    const resumen = {
      ingresos: round(totalIngresos),
      costos: round(totalCostos),
      utilidad: round(utilidad),
      ordenes: totalOrdenes,
      ticketPromedio: round(ticketPromedio),
      margen: round(margen),
      serviciosFrecuentes
    };

    /* ===============================
    🧠 INTELIGENCIA
    =============================== */

    const alertas = generarAlertas(resumen, ordenes);

    const recomendaciones = generarRecomendaciones(resumen);

    const sugerencias = generarSugerenciasAccionables(resumen, ordenes);

    return {
      resumen,
      alertas,
      recomendaciones,
      sugerencias // 🔥 NUEVO NIVEL PRO
    };

  } catch (error) {

    console.error("❌ IA gerente error:", error);

    return null;

  }

}


/* ======================================================
🧊 RESPUESTA VACÍA
====================================================== */

function construirRespuestaVacia() {
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
    recomendaciones: ["📌 Empieza registrando órdenes"],
    sugerencias: []
  };
}


/* ======================================================
🔧 SERVICIOS FRECUENTES
====================================================== */

function calcularServiciosFrecuentes(ordenes) {

  const map = {};

  ordenes.forEach(o => {
    (o.items || []).forEach(i => {
      const nombre = i.nombre || "General";
      map[nombre] = (map[nombre] || 0) + 1;
    });
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));

}


/* ======================================================
⚠️ ALERTAS
====================================================== */

function generarAlertas(resumen, ordenes) {

  const alertas = [];

  if (resumen.utilidad < 0)
    alertas.push("❌ Estás perdiendo dinero");

  if (resumen.ordenes < 5)
    alertas.push("⚠️ Pocas órdenes");

  if (resumen.margen < 20)
    alertas.push("⚠️ Margen bajo");

  if (resumen.costos > resumen.ingresos * 0.8)
    alertas.push("💸 Costos demasiado altos");

  const bajas = ordenes.filter(o => o.utilidad < 20000);

  if (bajas.length > ordenes.length * 0.4)
    alertas.push("⚠️ Muchas órdenes poco rentables");

  return alertas;

}


/* ======================================================
🚀 RECOMENDACIONES
====================================================== */

function generarRecomendaciones(resumen) {

  const r = [];

  if (resumen.utilidad > 0)
    r.push("✅ Negocio rentable");

  if (resumen.ticketPromedio < 100000)
    r.push("📈 Aumenta ticket promedio");

  if (resumen.margen > 30)
    r.push("🚀 Puedes escalar el negocio");

  if (resumen.serviciosFrecuentes.length)
    r.push("🔧 Potencia servicios más vendidos");

  return r;

}


/* ======================================================
🔥 SUGERENCIAS ACCIONABLES (CLAVE PRO)
====================================================== */

function generarSugerenciasAccionables(resumen, ordenes) {

  const acciones = [];

  if (resumen.ticketPromedio < 100000) {
    acciones.push({
      tipo: "PRECIO",
      mensaje: "Subir precios en servicios de bajo valor",
      impacto: "ALTO"
    });
  }

  if (resumen.costos > resumen.ingresos * 0.7) {
    acciones.push({
      tipo: "COSTOS",
      mensaje: "Revisar proveedores o repuestos",
      impacto: "ALTO"
    });
  }

  if (ordenes.length < 10) {
    acciones.push({
      tipo: "MARKETING",
      mensaje: "Activar promociones o WhatsApp clientes",
      impacto: "MEDIO"
    });
  }

  return acciones;

}


/* ======================================================
🗣️ VOZ IA
====================================================== */

export function hablarResumen(data) {

  if (!data) return;

  const r = data.resumen;

  hablar(`
    Atención gerente.
    Ingresos ${r.ingresos}.
    Utilidad ${r.utilidad}.
    Margen ${r.margen} por ciento.
  `);

}


/* ======================================================
🤖 MONITOREO (NO INVASIVO)
====================================================== */

export function iniciarMonitoreoIA(state, intervalo = 60000) {

  setInterval(async () => {

    const data = await analizarNegocio(state);

    if (!data) return;

    console.log("🧠 IA:", data);

    if (data.alertas.length) {
      hablar("Atención. Hay alertas importantes");
    }

  }, intervalo);

}


/* ======================================================
🔢 UTIL
====================================================== */

function round(n) {
  return Math.round(n || 0);
}