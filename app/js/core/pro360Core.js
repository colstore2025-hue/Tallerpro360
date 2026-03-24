/**
 * pro360Core.js - TallerPRO360 V10.4.6 👑
 * Reingeniería: Normalización Forzada de Directorio y Seguridad Nexus
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.6_NEXUS";

// 1. BLOQUEO DE SEGURIDAD INMEDIATO
function checkAuth() {
    const uid = localStorage.getItem("uid");
    const empresaId = localStorage.getItem("empresaId");

    if (!uid || !empresaId || empresaId === "PENDIENTE") {
        console.warn("Acceso denegado: Sesión no válida");
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
  // Solo navegamos si hay auth
  if (!checkAuth()) return;

  const container = document.getElementById("appContainer");
  if (!container) return;

  // Limpieza total de la ruta para evitar el error del "/"
  const cleanName = moduleName.replace("#", "").split("/").pop().toLowerCase() || "dashboard";

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[8px] text-cyan-500 mt-4 tracking-[0.3em] uppercase italic font-black">Nexus Sincronizando...</p>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId"),
    rol: localStorage.getItem("rol") || "admin"
  };

  try {
    const routeAction = routes[cleanName] || routes['dashboard'];
    const module = await routeAction();
    
    // Limpiamos el contenedor antes de inyectar el módulo
    container.innerHTML = "";
    
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }
    
    updateActiveMenu(cleanName);

    // Cierre automático de sidebar en móviles tras navegar
    const sidebar = document.getElementById("sidebar");
    if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.add("-translate-x-full");
    }

  } catch (error) {
    console.error(`❌ Error Crítico en Módulo [${cleanName}]:`, error);
    container.innerHTML = `
        <div class="p-10 text-center">
            <p class="text-red-400 text-xs font-bold uppercase mb-4">Error de Enlace Nexus</p>
            <button onclick="location.reload()" class="bg-white/10 text-white px-6 py-2 rounded-full text-[10px]">Reintentar</button>
        </div>
    `;
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
 * MOTOR DE NORMALIZACIÓN DE URL (The Swiss Watch Fix)
 */
function initNexus() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Si la URL no termina en barra (ej: /app), forzamos /app/ para que las rutas relativas no mueran
    if (path.endsWith("/app")) {
        window.location.replace(path + "/" + hash);
        return;
    }

    // Si no hay hash, ponemos el Dashboard por defecto
    if (!hash || hash === "#") {
        window.location.hash = "#dashboard";
        return;
    }

    navigate(hash);
}

// Listeners globales
window.addEventListener("hashchange", () => navigate(window.location.hash));
window.addEventListener("load", initNexus);

window.nexusNavigate = navigate;
