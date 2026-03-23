/**
 * pro360Core.js - TallerPRO360 V10.4 👑
 * Orquestador de Micro-Servicios - Edición Reloj Suizo
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4_NEXUS";

const routes = {
  dashboard:     () => import(`./modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`./modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`./modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`./modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`./modules/pagosTaller.js?v=${VERSION}`),
  contabilidad:  () => import(`./modules/contabilidad.js?v=${VERSION}`),
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  asistente:     () => import(`./modules/aiAssistant.js?v=${VERSION}`),
  comando:       () => import(`./modules/aiCommand.js?v=${VERSION}`),
  configuracion: () => import(`./modules/config.js?v=${VERSION}`),
  saneamiento:   () => import(`./modules/saneamiento.js?v=${VERSION}`) 
};

/**
 * Función Principal de Navegación
 */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // Cierre de menú lateral automático para móviles
  const sidebar = document.getElementById("sidebar");
  if (sidebar && !sidebar.classList.contains("hidden")) {
      sidebar.classList.add("hidden"); // Ajusta según tu clase de CSS para ocultar
  }

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
        <p class="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500 italic">Sincronizando Nexus-X...</p>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE",
    rol: localStorage.getItem("rol") || "invitado",
    timestamp: Date.now()
  };

  if (!state.uid || state.empresaId === "PENDIENTE") {
    if(!window.location.pathname.includes("login.html")) {
        window.location.href = "/login.html";
        return;
    }
  }

  try {
    const routeAction = routes[moduleName] || routes['dashboard'];
    const module = await routeAction();
    
    container.innerHTML = "";
    
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }

    updateActiveMenu(moduleName);

    setTimeout(() => {
        const bl = document.getElementById("boot-loader");
        if(bl) {
            bl.classList.add("opacity-0");
            setTimeout(() => bl.remove(), 500);
        }
    }, 300);

  } catch (error) {
    console.error(`❌ Fallo Nexus en [${moduleName}]:`, error);
    container.innerHTML = `
      <div class="p-10 text-center">
        <h2 class="text-white font-black uppercase">Fallo de Enlace</h2>
        <button onclick="window.location.hash='#dashboard'; location.reload();" class="mt-4 bg-cyan-500 text-black px-6 py-2 rounded-full font-bold text-xs">REINTENTAR</button>
      </div>
    `;
  }
}

function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "border-cyan-500", "bg-white/5");
        if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("text-cyan-400", "border-cyan-500", "bg-white/5");
        }
    });
}

// Escucha de cambios de hash
window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

// Carga inicial y corrección de URL vacía
window.addEventListener("load", () => {
    if (!window.location.hash) {
        window.location.hash = "#dashboard"; // Fuerza el hash inicial
    }
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

window.nexusNavigate = navigate;
