/**
 * PRO360 CORE AUTÓNOMO 😈🔥
 * Cerebro central del ERP
 * Auto-reparación + monitoreo + IA
 */

import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";

const CORE = {

  estado: "inicializando",
  errores: [],
  modulosFallidos: [],
  empresaId: null,
  intentos: {},

};

/* ================= INIT ================= */

export async function iniciarPRO360Core(state) {

  console.log("🧠🔥 Iniciando PRO360 CORE AUTÓNOMO");

  if (!state?.empresaId) {
    console.error("❌ empresaId requerido para CORE");
    return;
  }

  CORE.empresaId = state.empresaId;
  CORE.estado = "activo";

  activarGuardian();
  interceptarErrores();
  vigilarConexion();
  heartbeat();

}

/* ================= GUARDIAN ================= */

function activarGuardian() {

  try {
    activarModoDiosGuardian(CORE.empresaId);
    console.log("😈 Guardian DIOS activo");
  } catch (e) {
    console.warn("Guardian error:", e);
  }

}

/* ================= ERROR TRACKER ================= */

function interceptarErrores() {

  window.addEventListener("error", e => {

    registrarError({
      tipo: "global",
      mensaje: e.message
    });

  });

  window.addEventListener("unhandledrejection", e => {

    registrarError({
      tipo: "promise",
      mensaje: e.reason?.message || "Promise error"
    });

  });

}

/* ================= REGISTRO ================= */

function registrarError(err) {

  CORE.errores.push({
    ...err,
    fecha: new Date()
  });

  console.warn("⚠️ Error detectado:", err);

}

/* ================= CONEXIÓN ================= */

function vigilarConexion() {

  window.addEventListener("offline", () => {
    console.warn("📡 Sin conexión");
  });

  window.addEventListener("online", () => {
    console.log("🌐 Conexión restaurada");
    reintentarModulos();
  });

}

/* ================= HEARTBEAT ================= */

function heartbeat() {

  setInterval(() => {

    console.log("💓 CORE activo");

    if (CORE.modulosFallidos.length > 0) {
      reintentarModulos();
    }

  }, 15000);

}

/* ================= REINTENTOS ================= */

export async function ejecutarModuloSeguro(nombre, state, container) {

  try {

    const mod = await import(`../modules/${nombre}.js?v=${Date.now()}`);

    await mod.default(container, state);

  } catch (e) {

    console.error(`❌ Fallo módulo ${nombre}`, e);

    CORE.modulosFallidos.push(nombre);

    CORE.intentos[nombre] = (CORE.intentos[nombre] || 0) + 1;

    if (CORE.intentos[nombre] < 5) {

      setTimeout(() => {
        ejecutarModuloSeguro(nombre, state, container);
      }, 2000);

    } else {

      console.error(`💀 Módulo ${nombre} muerto`);

    }

  }

}

/* ================= REINTENTAR ================= */

function reintentarModulos() {

  const pendientes = [...CORE.modulosFallidos];

  CORE.modulosFallidos = [];

  pendientes.forEach(nombre => {
    console.log("🔁 Reintentando:", nombre);
  });

}

/* ================= API GLOBAL ================= */

window.PRO360 = {
  core: CORE,
  estado: () => CORE.estado,
  errores: () => CORE.errores
};