/**
 * pro360Core.js - TallerPRO360 V10.4.2 👑
 * Orquestador de Micro-Servicios - Corrección de Rutas y URL
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.2_NEXUS";

const routes = {
  dashboard:     () => import(`./modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`./modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`./modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`./modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`./modules/pagosTaller.js?v=${VERSION}`),
  // Alias: Ambos cargan el mismo archivo físico
  contabilidad:  () => import(`./modules/contabilidad.js?v=${VERSION}`),
  finanzas:      () => import(`./modules/contabilidad.js?v=${VERSION}`), 
  
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  asistente:     () => import(`./modules/aiAssistant.js?v=${VERSION}`),
  comando:       () => import(`./modules/aiCommand.js?v=${VERSION}`),
  configuracion: () => import(`./modules/config.js?v=${VERSION}`),
  saneamiento:   () => import(`./modules/saneamiento.js?v=${VERSION}`) 
};

export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // Normalización del nombre para evitar fallos por "/" o mayúsculas
  const cleanName = moduleName.replace("/", "").toLowerCase();

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE"
  };

  try {
    // Si la ruta no existe, por defecto al dashboard
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
    console.error(`❌ Error en [${cleanName}]:`, error);
  }
}

function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "bg-white/5");
        // Verifica si el enlace coincide con el módulo actual
        if (link.getAttribute("href").includes(activeId)) {
            link.classList.add("text-cyan-400", "bg-white/5");
        }
    });
}

// Listener de cambios en la URL (Maneja el "/" automáticamente)
window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

// Carga inicial: Si falta el "/" o el hash, lo corrige
window.addEventListener("load", () => {
    let currentPath = window.location.pathname;
    let currentHash = window.location.hash;

    // Si estás en /app y no hay hash, fuerza /app/#dashboard
    if (!currentHash || currentHash === "#") {
        window.location.hash = "#dashboard";
    }

    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

window.nexusNavigate = navigate;
