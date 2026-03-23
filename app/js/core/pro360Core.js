/**
 * pro360Core.js - TallerPRO360 V10.4.1 👑
 * Orquestador de Micro-Servicios - Edición Reloj Suizo
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.1_NEXUS";

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

export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // 1. CIERRE DE MENÚ (Ajuste para compatibilidad móvil total)
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
      // Usamos classList.replace o remove/add para asegurar que el estado cambie
      sidebar.classList.add("-translate-x-full"); // Estándar de Tailwind para ocultar
      // Si usas 'hidden', descomenta la siguiente línea:
      // sidebar.classList.add("hidden"); 
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

  // REDIRECCIÓN SI NO HAY SESIÓN
  if (!state.uid || state.empresaId === "PENDIENTE") {
    if(!window.location.pathname.includes("login.html")) {
        window.location.href = "/login.html";
        return;
    }
  }

  try {
    // 2. NORMALIZACIÓN DEL NOMBRE (Evita errores de mayúsculas/minúsculas)
    const cleanName = moduleName.toLowerCase();
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

    setTimeout(() => {
        const bl = document.getElementById("boot-loader");
        if(bl) {
            bl.classList.add("opacity-0");
            setTimeout(() => bl.remove(), 500);
        }
    }, 300);

  } catch (error) {
    console.error(`❌ Fallo Nexus en [${moduleName}]:`, error);
    container.innerHTML = `<div class="p-10 text-center text-white">Error de Carga: ${error.message}</div>`;
  }
}

function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "border-cyan-500", "bg-white/5");
        // Comparamos de forma segura el href
        if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("text-cyan-400", "border-cyan-500", "bg-white/5");
        }
    });
}

// 3. LISTENERS ROBUSTOS
window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "").split('?')[0] || "dashboard";
    navigate(target);
});

window.addEventListener("load", () => {
    // Corrección para evitar el bucle de carga y asegurar el Dashboard inicial
    let initialHash = window.location.hash.replace("#", "").split('?')[0];
    
    if (!initialHash) {
        window.location.hash = "#dashboard";
        initialHash = "dashboard";
    }
    
    navigate(initialHash);
});

window.nexusNavigate = navigate;
