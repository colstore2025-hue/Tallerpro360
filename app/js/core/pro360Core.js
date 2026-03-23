/**
 * pro360Core.js - TallerPRO360 V10.4.3 👑
 * Orquestador de Micro-Servicios - Lanzamiento Automático de Dashboard
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.3_NEXUS";

const routes = {
  dashboard:     () => import(`./modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`./modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`./modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`./modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`./modules/pagosTaller.js?v=${VERSION}`),
  finanzas:      () => import(`./modules/contabilidad.js?v=${VERSION}`),
  contabilidad:  () => import(`./modules/contabilidad.js?v=${VERSION}`),
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  configuracion: () => import(`./modules/config.js?v=${VERSION}`)
};

export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // 1. Limpieza profunda del nombre del módulo
  const cleanName = moduleName.replace("#", "").replace("/", "").toLowerCase() || "dashboard";

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[10px] text-cyan-500 mt-4 tracking-widest uppercase">Nexus Iniciando...</p>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE"
  };

  // Verificación de seguridad
  if (!state.uid && !window.location.pathname.includes("login.html")) {
      window.location.href = "/login.html";
      return;
  }

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
    console.error(`❌ Fallo en módulo [${cleanName}]:`, error);
  }
}

function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "bg-white/5");
        if (link.getAttribute("href").includes(activeId)) {
            link.classList.add("text-cyan-400", "bg-white/5");
        }
    });
}

// --- LÓGICA DE LANZAMIENTO AUTOMÁTICO ---

// Escucha cambios de Hash
window.addEventListener("hashchange", () => {
    const target = window.location.hash || "#dashboard";
    navigate(target);
});

// Al cargar la página por primera vez
window.addEventListener("load", () => {
    // Si la URL es solo .../app o .../app/ sin nada más
    if (!window.location.hash || window.location.hash === "#") {
        // Forzamos visualmente la URL
        window.history.replaceState(null, null, "#dashboard");
        navigate("dashboard");
    } else {
        // Si ya traía un hash (ej: #inventario), lo respetamos
        navigate(window.location.hash);
    }
});

window.nexusNavigate = navigate;
