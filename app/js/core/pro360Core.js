/**
 * pro360Core.js - TallerPRO360 V10.2 👑
 * Orquestador Único de Micro-Servicios y Sincronización Real
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.2_NEXUS";

/**
 * MAPA MAESTRO DE RUTAS - TallerPRO360 SaaS
 * Solo los módulos que generan valor real y flujo de caja.
 */
const routes = {
  // --- Operación ---
  dashboard:     () => import(`./modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`./modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`./modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`./modules/clientes.js?v=${VERSION}`),
  
  // --- Dinero & Legal ---
  pagos:         () => import(`./modules/pagosTaller.js?v=${VERSION}`),
  contabilidad:  () => import(`./modules/contabilidad.js?v=${VERSION}`),
  
  // --- Cerebro Nexus-X ---
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`), // Reemplaza a Reportes
  asistente:     () => import(`./modules/aiAssistant.js?v=${VERSION}`),
  comando:       () => import(`./modules/aiCommand.js?v=${VERSION}`),
  
  // --- Sistema ---
  configuracion: () => import(`./modules/config.js?v=${VERSION}`)
};

/**
 * Función Principal de Navegación y Sincronización
 */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // Feedback visual de carga (Neon Style)
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Sincronizando Nexus-X...</p>
    </div>
  `;

  // 2. RECUPERACIÓN DE ESTADO (Sync Check)
  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE",
    rol: localStorage.getItem("rol") || "invitado",
    timestamp: Date.now()
  };

  // Redirección si no hay sesión activa
  if (!state.uid || state.empresaId === "PENDIENTE") {
    console.warn("⚠️ Sesión no detectada. Re-autenticando...");
    // Si estamos en desarrollo, podrías forzar un ID para pruebas:
    // state.empresaId = "tu_id_de_prueba"; 
    if(window.location.pathname !== "/login.html") {
        window.location.href = "/login.html";
        return;
    }
  }

  try {
    // 3. CARGA DINÁMICA DEL MÓDULO
    const routeAction = routes[moduleName] || routes['dashboard'];
    const module = await routeAction();
    
    // Limpieza de UI previa a la ejecución
    container.innerHTML = "";
    
    /**
     * EJECUCIÓN DEL MÓDULO
     * Pasamos 'container' para el render y 'state' para que el módulo 
     * sepa qué empresa consultar en Firebase sin repetir código.
     */
    if (module.default) {
        await module.default(container, state);
    } else {
        // Para módulos que exportan funciones específicas (como aiCommand)
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }

    // 4. PERSISTENCIA DE UI (Menú Activo)
    updateActiveMenu(moduleName);

    // Quitar boot-loader de bienvenida si existe
    setTimeout(() => {
        document.getElementById("boot-loader")?.classList.add("opacity-0");
        setTimeout(() => document.getElementById("boot-loader")?.remove(), 500);
    }, 300);

  } catch (error) {
    console.error(`❌ Error Crítico en [${moduleName}]:`, error);
    container.innerHTML = `
      <div class="p-10 text-center">
        <div class="text-red-500 text-4xl mb-4"><i class="fas fa-exclamation-triangle"></i></div>
        <h2 class="text-white font-black uppercase tracking-tighter">Error de Sincronización</h2>
        <p class="text-slate-500 text-[10px] uppercase mb-6">${error.message}</p>
        <button onclick="location.reload()" class="bg-cyan-500 text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            Reiniciar Núcleo
        </button>
      </div>
    `;
  }
}

/**
 * Resalta el botón del menú actual
 */
function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("text-cyan-400", "border-cyan-500", "bg-white/5");
        if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("text-cyan-400", "border-cyan-500", "bg-white/5");
        }
    });
}

// 5. LISTENERS GLOBALES
window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

window.addEventListener("load", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

// Exportación para uso manual si es necesario
window.nexusNavigate = navigate;
