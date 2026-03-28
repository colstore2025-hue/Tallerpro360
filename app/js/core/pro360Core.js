/**
 * pro360Core.js - Nexus-X Intelligence Edition 👑 V17.0
 * NÚCLEO DE NAVEGACIÓN Y SEGURIDAD DE ENLACE NEURAL
 * Optimizado para Colecciones Raíz y Control de Staff
 * @author William Jeffry Urquijo Cubillos
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v17.0.0_NEXUS";

/**
 * 1. ESCUDO DE AUTENTICACIÓN (SHIELD)
 * Verifica credenciales en LocalStorage. 
 * Nota: nexus_ es el prefijo para evitar colisiones con otros sitios.
 */
function checkAuth() {
    const uid = localStorage.getItem("nexus_uid") || localStorage.getItem("uid");
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");

    if (!uid || !empresaId || empresaId === "PENDIENTE") {
        console.warn("NEXUS: Acceso denegado. Órbita no identificada.");
        // Redirige al login asegurando la ruta correcta
        window.location.href = "../login.html";
        return false;
    }
    return true;
}

/**
 * 2. MAPEO DE MÓDULOS (Rutas Críticas V17.0)
 * Asegúrate de que los archivos existan en /modules/ con estos nombres exactos
 */
const routes = {
  dashboard:     () => import(`../modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`../modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`../modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`../modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`../modules/pagosTaller.js?v=${VERSION}`),
  contabilidad:  () => import(`../modules/contabilidad.js?v=${VERSION}`),
  finanzas:      () => import(`../modules/contabilidad.js?v=${VERSION}`), 
  staff:         () => import(`../modules/staff.js?v=${VERSION}`), // NUEVO: Control de Técnicos
  configuracion: () => import(`../modules/config.js?v=${VERSION}`), // ACTUALIZADO: System Core
  gerencia:      () => import(`../modules/gerenteAI.js?v=${VERSION}`)
};

/**
 * 3. MOTOR DE NAVEGACIÓN (NAVIGATE)
 */
export async function navigate(moduleHash) {
  if (!checkAuth()) return;

  const container = document.getElementById("appContainer");
  if (!container) return;

  // Normalización del nombre del módulo
  let cleanName = moduleHash.replace("#", "").toLowerCase() || "dashboard";
  
  // Alias de seguridad: configuracion -> config (si el archivo se llama config.js)
  if (cleanName === "configuracion") cleanName = "configuracion"; 

  // UI: Feedback de carga Aero-Spatial
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div class="relative">
            <div class="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <div class="absolute inset-0 bg-cyan-500 blur-xl opacity-10"></div>
        </div>
        <p class="text-[7px] text-cyan-500 mt-6 tracking-[0.5em] uppercase font-black orbitron italic">
            Sincronizando Nodo: ${cleanName}
        </p>
    </div>
  `;

  // Estado Global que se inyecta a cada módulo
  const state = {
    uid: localStorage.getItem("nexus_uid") || localStorage.getItem("uid"),
    empresaId: localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId"),
    rol: localStorage.getItem("nexus_rol") || "TECNICO", // Por defecto el rol más bajo
    version: VERSION
  };

  try {
    // Protección de Nivel de Acceso (RBAC)
    const restrictedModules = ['contabilidad', 'finanzas', 'staff', 'configuracion'];
    if (restrictedModules.includes(cleanName) && state.rol !== 'ADMIN') {
        throw new Error("ACCESO DENEGADO: NIVEL DE COMANDANTE REQUERIDO");
    }

    const routeAction = routes[cleanName] || routes['dashboard'];
    const module = await routeAction();
    
    container.innerHTML = ""; // Limpieza de buffer
    
    // Inyección de módulo (soporta export default o funciones nombradas)
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }
    
    updateActiveMenu(cleanName);

    // UX: Cierre de menú en móviles para dejar ver el contenido
    const sidebar = document.getElementById("sidebar");
    if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add("-translate-x-full"); // Ajusta según tu CSS de Tailwind
    }

  } catch (error) {
    console.error(`❌ NEXUS ERROR [${cleanName}]:`, error);
    container.innerHTML = `
        <div class="p-16 text-center border border-red-500/10 bg-red-500/5 rounded-[3rem] max-w-md mx-auto mt-20">
            <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-6"></i>
            <p class="text-red-500 text-[9px] font-black uppercase tracking-widest mb-4 orbitron italic">Error de Enlace Neural</p>
            <p class="text-slate-500 text-[10px] mb-8 uppercase font-bold">${error.message}</p>
            <button onclick="location.hash='#dashboard'" class="bg-white text-black px-10 py-4 rounded-full text-[9px] font-black uppercase orbitron tracking-widest">
                Volver a Base
            </button>
        </div>
    `;
  }
}

/**
 * 4. ACTUALIZADOR DE INTERFAZ (ACTIVE STATE)
 */
function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        const href = link.getAttribute("href");
        if(href) {
            const isCurrent = href === `#${activeId}`;
            link.classList.toggle("active-nexus", isCurrent);
            // Si usas clases de Tailwind:
            if(isCurrent) link.classList.add("text-cyan-400");
            else link.classList.remove("text-cyan-400");
        }
    });
}

/**
 * 5. INICIALIZADOR NEXUS (MOTOR PRINCIPAL)
 */
function initNexus() {
    const hash = window.location.hash;

    // Si no hay hash, forzamos dashboard
    if (!hash || hash === "#") {
        window.location.hash = "#dashboard";
        return;
    }

    navigate(hash);
}

// LISTENERS DE EVENTOS
window.addEventListener("hashchange", () => navigate(window.location.hash));
window.addEventListener("load", initNexus);

// Exportación global para depuración y botones manuales
window.nexusNavigate = navigate;
