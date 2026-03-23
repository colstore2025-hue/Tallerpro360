/**
 * pro360Core.js - TallerPRO360 V10.4.4 👑
 * Edición: Seguridad Reforzada & Auto-Slash
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.4_NEXUS";

// 1. VERIFICACIÓN DE IDENTIDAD INMEDIATA (Cero tolerancia)
function checkAuth() {
    const uid = localStorage.getItem("uid");
    if (!uid) {
        // Guardamos a donde quería ir el usuario para volver después del login
        if (window.location.hash) {
            localStorage.setItem("redirectAfterLogin", window.location.hash);
        }
        window.location.href = "/login.html";
        return false;
    }
    return true;
}

const routes = {
  dashboard:     () => import(`./modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`./modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`./modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`./modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`./modules/pagosTaller.js?v=${VERSION}`),
  finanzas:      () => import(`./modules/contabilidad.js?v=${VERSION}`),
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  configuracion: () => import(`./modules/config.js?v=${VERSION}`)
};

export async function navigate(moduleName) {
  if (!checkAuth()) return; // Si no hay sesión, se detiene aquí.

  const container = document.getElementById("appContainer");
  if (!container) return;

  const cleanName = moduleName.replace("#", "").replace("/", "").toLowerCase() || "dashboard";

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-[9px] text-cyan-500 tracking-[0.3em] uppercase">Validando Acceso Nexus...</p>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE"
  };

  try {
    const routeAction = routes[cleanName] || routes['dashboard'];
    const module = await routeAction();
    container.innerHTML = "";
    
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }
  } catch (error) {
    console.error("Error de Sincronización:", error);
  }
}

// 2. ELIMINACIÓN DEL "/" MANUAL
window.addEventListener("load", () => {
    // Si la URL no tiene el /# (ej: /app#dashboard), lo corregimos silenciosamente
    if (window.location.hash && !window.location.href.includes("/#")) {
        const targetHash = window.location.hash;
        window.history.replaceState(null, null, window.location.pathname + "/" + targetHash);
    }

    // Si entran a la raíz /app o /app/ sin hash
    if (!window.location.hash || window.location.hash === "#") {
        window.location.hash = "#dashboard";
    }

    navigate(window.location.hash);
});

window.addEventListener("hashchange", () => navigate(window.location.hash));
window.nexusNavigate = navigate;
