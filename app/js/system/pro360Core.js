/**
 * ULTRA PRO360 CORE INTEGRADO 🔥
 * Autoregulación + Watchers + Fix Inicial + Heartbeat
 */

import { hablar } from "../voice/voiceCore.js";
import { activarModoDiosGuardian, fixTotalInicial } from "./firestoreGuardianGod.js";

let voiceInitialized = false;

const CORE = {
  estado: "inicializando",
  errores: [],
  modulosFallidos: [],
  intentos: {},
  empresaId: null
};

// ================= INIT APP =================
export async function initApp(state) {
  const container = document.getElementById("appContainer");
  const sidebar = document.getElementById("sidebar");

  if (!state?.empresaId) {
    console.error("❌ empresaId requerido");
    container.innerHTML = "Error: EmpresaId no definido";
    return;
  }

  CORE.empresaId = state.empresaId;
  CORE.estado = "activo";

  // 🔹 Activar Guardian
  await fixTotalInicial(state.empresaId);
  activarModoDiosGuardian(state.empresaId);

  // 🔹 Renderizar Sidebar
  renderSidebar(sidebar, state.rolGlobal, state.plan);

  // 🔹 Inicializar módulos críticos
  await ejecutarModuloSeguro("dashboard", state, container);

  // 🔹 Heartbeat para reintentos
  setInterval(() => {
    if (CORE.modulosFallidos.length > 0) {
      const pendientes = [...CORE.modulosFallidos];
      CORE.modulosFallidos = [];
      pendientes.forEach(nombre => {
        console.log("🔁 Reintentando módulo:", nombre);
        ejecutarModuloSeguro(nombre, state, container);
      });
    }
  }, 15000);

  initVoice();
}

// ================= MODULE SAFE EXEC =================
export async function ejecutarModuloSeguro(nombre, state, container) {
  try {
    const mod = await import(`../modules/${nombre}.js?v=${Date.now()}`);
    if (!mod?.default) throw new Error(`Módulo inválido: ${nombre}`);
    await mod.default(container, state);
  } catch (e) {
    console.error(`❌ Falló módulo ${nombre}`, e);
    CORE.modulosFallidos.push(nombre);
    CORE.intentos[nombre] = (CORE.intentos[nombre] || 0) + 1;

    if (CORE.intentos[nombre] < 5) {
      setTimeout(() => ejecutarModuloSeguro(nombre, state, container), 2000);
    } else {
      console.error(`💀 Módulo ${nombre} muerto tras 5 intentos`);
    }
  }
}

// ================= SIDEBAR =================
function renderSidebar(sidebar, rol, plan) {
  const baseModules = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "ordenes", label: "🧾 Órdenes" },
    { id: "clientes", label: "👥 Clientes" },
    { id: "vehiculos", label: "🚗 Vehículos" }
  ];

  if (["Pro","Elite","Enterprise"].includes(plan)) {
    baseModules.push({ id: "inventario", label: "📦 Inventario" });
    baseModules.push({ id: "finanzas", label: "💰 Finanzas" });
    baseModules.push({ id: "pagos", label: "💳 Pagos" });
  }

  if (rol === "superadmin" || ["Elite","Enterprise"].includes(plan)) {
    baseModules.push({ id: "contabilidad", label: "📊 Contabilidad" });
    baseModules.push({ id: "gerenteai", label: "🧠 Gerente AI" });
    baseModules.push({ id: "reportes", label: "📈 Reportes" });
    baseModules.push({ id: "configuracion", label: "⚙️ Configuración" });
  }

  sidebar.innerHTML = baseModules
    .map(m => `<button onclick="window.PRO360?.ejecutarModuloSeguro('${m.id}', window.state, document.getElementById('appContainer'))">${m.label}</button>`)
    .join("");
}

// ================= VOICE =================
async function initVoice() {
  if (voiceInitialized) return;
  try {
    const voice = await import("../voice/voiceAssistantWorkshop.js");
    if (voice?.init) { voice.init(); voiceInitialized = true; console.log("🎤 Voz activada"); }
  } catch (e) {
    console.warn("⚠️ Voz no disponible:", e.message);
  }
}

// ================= GLOBAL =================
window.PRO360 = {
  core: CORE,
  ejecutarModuloSeguro,
  estado: () => CORE.estado,
  errores: () => CORE.errores
};