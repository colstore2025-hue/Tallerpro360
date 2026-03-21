/**
 * ULTRA PRO360 CORE INTEGRADO 🔥
 * Autoregulación + Watchers + Fix Inicial + Heartbeat
 * Ruta: app/js/system/moduleLoader.js (o core/app-init.js)
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

/**
 * INICIALIZACIÓN DEL SISTEMA
 * @param {Object} state - El estado global proveniente de store.js
 */
export async function initApp(state) {
  const container = document.getElementById("appContainer");
  const sidebar = document.getElementById("sidebar");

  if (!state?.empresaId) {
    console.error("❌ empresaId requerido para inicializar el CORE");
    if (container) container.innerHTML = "Error Crítico: Empresa no identificada.";
    return;
  }

  CORE.empresaId = state.empresaId;
  CORE.estado = "activo";

  // 🔹 1. Estabilización de Base de Datos
  try {
    await fixTotalInicial(state.empresaId);
    activarModoDiosGuardian(state.empresaId);
  } catch (err) {
    console.warn("⚠️ Guardian inició con advertencias", err);
  }

  // 🔹 2. Renderizar Interfaz Base
  renderSidebar(sidebar, state.rolGlobal, state.plan);

  // 🔹 3. Cargar Módulo Inicial (Dashboard)
  await ejecutarModuloSeguro("dashboard", state, container);

  // 🔹 4. Heartbeat: Reintentos automáticos cada 15s para módulos que fallaron
  setInterval(() => {
    if (CORE.modulosFallidos.length > 0) {
      const pendientes = [...CORE.modulosFallidos];
      CORE.modulosFallidos = []; // Limpiamos lista para el reintento
      pendientes.forEach(nombre => {
        console.log(`🔁 Heartbeat: Reintentando módulo [${nombre}]`);
        ejecutarModuloSeguro(nombre, state, container);
      });
    }
  }, 15000);

  initVoice();
}

/**
 * EJECUCIÓN SEGURA DE MÓDULOS CON AUTO-REPARACIÓN
 */
export async function ejecutarModuloSeguro(nombre, state, container) {
  try {
    // Importación dinámica con prevención de caché para asegurar versiones frescas
    const mod = await import(`../modules/${nombre}.js?v=${Date.now()}`);
    
    if (!mod?.default) throw new Error(`El módulo [${nombre}] no tiene un export default.`);

    // Limpiar contenedor antes de cargar nuevo módulo
    container.innerHTML = '<div class="loader">Cargando...</div>'; 
    
    await mod.default(container, state);
    
    // Si tiene éxito, lo removemos de la lista de fallidos si existía
    CORE.modulosFallidos = CORE.modulosFallidos.filter(m => m !== nombre);
    CORE.intentos[nombre] = 0; 

  } catch (e) {
    console.error(`❌ Falló módulo ${nombre}:`, e);

    // Registrar error internamente
    CORE.intentos[nombre] = (CORE.intentos[nombre] || 0) + 1;

    if (CORE.intentos[nombre] < 5) {
      // Reintento rápido (2 segundos)
      setTimeout(() => ejecutarModuloSeguro(nombre, state, container), 2000);
    } else {
      // 💀 FALLO DEFINITIVO: Reportar a IA_LOGS
      CORE.modulosFallidos.push(nombre);
      reportarFalloCritico(nombre, e, state.empresaId);
      
      container.innerHTML = `
        <div class="error-card">
          <p>⚠️ El módulo <b>${nombre}</b> presenta problemas técnicos.</p>
          <button onclick="location.reload()">Recargar App</button>
        </div>
      `;
    }
  }
}

/**
 * REPORTE DE ERRORES A FIRESTORE PARA ANÁLISIS DE IA
 */
async function reportarFalloCritico(nombre, error, empresaId) {
  try {
    const { dataService } = await import("../services/dataService.js");
    if (dataService?.saveLog) {
      await dataService.saveLog("ia_logs", {
        tipo: "error_sistema",
        modulo: nombre,
        mensaje: error.message,
        empresaId: empresaId,
        fecha: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
    }
  } catch (err) {
    console.error("No se pudo reportar el error a la base de datos", err);
  }
}

/**
 * SIDEBAR DINÁMICO POR ROL Y PLAN
 */
function renderSidebar(sidebar, rol, plan) {
  if (!sidebar) return;

  const baseModules = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "ordenes", label: "🧾 Órdenes" },
    { id: "clientes", label: "👥 Clientes" },
    { id: "vehiculos", label: "🚗 Vehículos" }
  ];

  // Módulos por Plan
  if (["Pro", "Elite", "Enterprise"].includes(plan)) {
    baseModules.push({ id: "inventario", label: "📦 Inventario" });
    baseModules.push({ id: "finanzas", label: "💰 Finanzas" });
    baseModules.push({ id: "pagos", label: "💳 Pagos" });
  }

  // Módulos por Rol o Planes Superiores
  if (rol === "superadmin" || ["Elite", "Enterprise"].includes(plan)) {
    baseModules.push({ id: "contabilidad", label: "📊 Contabilidad" });
    baseModules.push({ id: "gerenteai", label: "🧠 Gerente AI" });
    baseModules.push({ id: "reportes", label: "📈 Reportes" });
    baseModules.push({ id: "configuracion", label: "⚙️ Configuración" });
  }

  sidebar.innerHTML = baseModules
    .map(m => `
      <button class="nav-btn" onclick="window.PRO360.ejecuirModuloDesdeUI('${m.id}')">
        ${m.label}
      </button>
    `).join("");
}

/**
 * ASISTENTE DE VOZ
 */
async function initVoice() {
  if (voiceInitialized) return;
  try {
    const voice = await import("../voice/voiceAssistantWorkshop.js");
    if (voice?.init) { 
      voice.init(); 
      voiceInitialized = true; 
      console.log("🎤 Sistema de Voz activado"); 
    }
  } catch (e) {
    console.warn("⚠️ Voz no disponible:", e.message);
  }
}

// ================= EXPOSICIÓN GLOBAL =================
window.PRO360 = {
  core: CORE,
  // Helper para llamar desde el HTML/Sidebar
  ejecuirModuloDesdeUI: (nombre) => {
    const container = document.getElementById("appContainer");
    ejecutarModuloSeguro(nombre, window.state, container);
  },
  estado: () => CORE.estado
};
