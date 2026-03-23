/**
 * pro360Core.js - TallerPRO360 V10.3 👑
 * Orquestador Único de Micro-Servicios y Sincronización Real
 * Actualización: Inclusión de Módulo de Saneamiento
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.3_NEXUS";

/**
 * MAPA MAESTRO DE RUTAS - TallerPRO360 SaaS
 * Registro oficial de módulos activos en el núcleo.
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
  gerencia:      () => import(`./modules/gerenteAI.js?v=${VERSION}`),
  asistente:     () => import(`./modules/aiAssistant.js?v=${VERSION}`),
  comando:       () => import(`./modules/aiCommand.js?v=${VERSION}`),
  
  // --- Sistema & Mantenimiento (Superadmin William) ---
  configuracion: () => import(`./modules/config.js?v=${VERSION}`),
  saneamiento:   () => import(`./modules/saneamiento.js?v=${VERSION}`) // <--- VÍNCULO ACTIVADO
};

/**
 * Función Principal de Navegación y Sincronización
 */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // Feedback visual de carga (Nexus Neon Style)
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
        <p class="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500 italic">Sincronizando Nexus-X...</p>
    </div>
  `;

  // 2. RECUPERACIÓN DE ESTADO
  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId") || "PENDIENTE",
    rol: localStorage.getItem("rol") || "invitado",
    timestamp: Date.now()
  };

  // Redirección de seguridad
  if (!state.uid || state.empresaId === "PENDIENTE") {
    if(!window.location.pathname.includes("login.html")) {
        window.location.href = "/login.html";
        return;
    }
  }

  try {
    // 3. CARGA DINÁMICA
    const routeAction = routes[moduleName] || routes['dashboard'];
    const module = await routeAction();
    
    container.innerHTML = "";
    
    // Ejecución con inyección de estado
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }

    // 4. PERSISTENCIA DE UI (Menú Activo)
    updateActiveMenu(moduleName);

    // Limpieza de boot-loader
    setTimeout(() => {
        const bl = document.getElementById("boot-loader");
        if(bl) {
            bl.classList.add("opacity-0");
            setTimeout(() => bl.remove(), 500);
        }
    }, 300);

  } catch (error) {
    console.error(`❌ Error Crítico en [${moduleName}]:`, error);
    container.innerHTML = `
      <div class="p-10 text-center animate-in fade-in zoom-in duration-500">
        <div class="text-red-500 text-5xl mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <i class="fas fa-microchip"></i>
        </div>
        <h2 class="text-white font-black uppercase tracking-tighter text-xl mb-2">Fallo de Enlace Nexus</h2>
        <p class="text-slate-500 text-[9px] uppercase tracking-widest mb-8 px-10 leading-relaxed">
            El módulo [${moduleName}] no responde o el archivo físico no existe en el servidor.
        </p>
        <button onclick="location.hash='#dashboard'; location.reload();" class="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-500 hover:text-black transition-all active:scale-95">
            Retornar al Núcleo
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
        // Soporte para href="#modulo"
        if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("text-cyan-400", "border-cyan-500", "bg-white/5");
        }
    });
}

// 5. LISTENERS GLOBALES (Hash Navigation)
window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

window.addEventListener("load", () => {
    const target = window.location.hash.replace("#", "") || "dashboard";
    navigate(target);
});

window.nexusNavigate = navigate;
