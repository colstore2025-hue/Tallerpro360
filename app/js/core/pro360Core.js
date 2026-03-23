/**
 * pro360Core.js - TallerPRO360 V10.4.5 👑
 * Edición: Normalización de Path, Seguridad Extrema y Auto-Slash
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.5_NEXUS";

// 1. BLOQUEO DE SEGURIDAD INMEDIATO
function checkAuth() {
    const uid = localStorage.getItem("uid");
    if (!uid) {
        // Si no hay sesión, al login sin escalas
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
  contabilidad:  () => import(`./modules/contabilidad.js?v=${VERSION}`),
  finanzas:      () => import(`./modules/contabilidad.js?v=${VERSION}`),
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  configuracion: () => import(`./modules/config.js?v=${VERSION}`),
  saneamiento:   () => import(`./modules/saneamiento.js?v=${VERSION}`)
};

export async function navigate(moduleName) {
  if (!checkAuth()) return;

  const container = document.getElementById("appContainer");
  if (!container) return;

  // Normalización: quitamos slash, hash y pasamos a minúsculas
  const cleanName = moduleName.replace("#", "").replace(/\//g, "").toLowerCase() || "dashboard";

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[9px] text-cyan-500 mt-4 tracking-widest uppercase italic">Nexus Sincronizando...</p>
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
    
    updateActiveMenu(cleanName);
  } catch (error) {
    console.error(`❌ Error en ${cleanName}:`, error);
    container.innerHTML = `<div class="p-10 text-white text-center">Error cargando módulo. Reintente.</div>`;
  }
}

function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "bg-white/5", "border-cyan-500");
        if (link.getAttribute("href")?.includes(activeId)) {
            link.classList.add("text-cyan-400", "bg-white/5", "border-cyan-500");
        }
    });
}

/**
 * MOTOR DE NORMALIZACIÓN DE URL
 * Este bloque corrige el problema de la "/" y el acceso inicial.
 */
function initNexus() {
    let path = window.location.pathname;
    let hash = window.location.hash;

    // A. CORRECCIÓN DE SLASH (Evita el problema de Foto 1 y 2)
    // Si la URL termina en /app (sin la barra final), la forzamos.
    if (path.endsWith("/app")) {
        window.history.replaceState(null, null, "/app/" + hash);
    }

    // B. CORRECCIÓN DE HASH VACÍO
    if (!hash || hash === "#") {
        window.location.hash = "#dashboard";
    }

    // C. LANZAMIENTO
    navigate(window.location.hash);
}

// Listeners
window.addEventListener("hashchange", () => navigate(window.location.hash));
window.addEventListener("load", initNexus);

window.nexusNavigate = navigate;

