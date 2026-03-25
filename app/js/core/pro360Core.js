/**
 * pro360Core.js - Nexus-X Intelligence Edition 👑
 * Auditoría: Normalización de Directorio y Seguridad de Enlace Neural
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.4.6_NEXUS";

/**
 * 1. ESCUDO DE AUTENTICACIÓN
 * Verifica credenciales en LocalStorage antes de disparar el Router
 */
function checkAuth() {
    const uid = localStorage.getItem("uid");
    const empresaId = localStorage.getItem("empresaId");

    if (!uid || !empresaId || empresaId === "PENDIENTE") {
        console.warn("NEXUS: Acceso denegado. Credenciales insuficientes.");
        // Redirige al nivel superior para encontrar el login.html
        window.location.href = "../login.html";
        return false;
    }
    return true;
}

/**
 * 2. MAPEO DE MÓDULOS (Rutas dinámicas)
 */
const routes = {
  dashboard:     () => import(`../modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`../modules/ordenes.js?v=${VERSION}`),
  inventario:    () => import(`../modules/inventario.js?v=${VERSION}`),
  clientes:      () => import(`../modules/clientes.js?v=${VERSION}`),
  pagos:         () => import(`../modules/pagosTaller.js?v=${VERSION}`),
  contabilidad:  () => import(`../modules/contabilidad.js?v=${VERSION}`),
  finanzas:      () => import(`../modules/contabilidad.js?v=${VERSION}`), // Alias de seguridad
  gerencia:      () => import(`../modules/gerenteAI.js?v=${VERSION}`),
  configuracion: () => import(`../modules/config.js?v=${VERSION}`)
};

/**
 * 3. MOTOR DE NAVEGACIÓN (NAVIGATE)
 */
export async function navigate(moduleHash) {
  if (!checkAuth()) return;

  const container = document.getElementById("appContainer");
  if (!container) return;

  // Limpieza de Hash para obtener el nombre del módulo puro
  const cleanName = moduleHash.replace("#", "").toLowerCase() || "dashboard";

  // UI: Feedback de carga NASA
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[7px] text-cyan-500 mt-4 tracking-[0.4em] uppercase font-black">Sincronizando Módulo: ${cleanName}</p>
    </div>
  `;

  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId"),
    rol: localStorage.getItem("rol") || "ADMIN",
    version: VERSION
  };

  try {
    const routeAction = routes[cleanName] || routes['dashboard'];
    const module = await routeAction();
    
    container.innerHTML = ""; // Limpieza de buffer
    
    // Inyección de módulo según exportación (Default o Función)
    if (module.default) {
        await module.default(container, state);
    } else {
        const funcName = Object.keys(module)[0];
        await module[funcName](container, state);
    }
    
    updateActiveMenu(cleanName);

    // UX: Auto-cierre de sidebar en dispositivos móviles
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.style.display = "none";
    }

  } catch (error) {
    console.error(`❌ NEXUS CRITICAL ERROR [${cleanName}]:`, error);
    container.innerHTML = `
        <div class="p-10 text-center border border-red-900/30 bg-red-900/10 rounded">
            <p class="text-red-500 text-[9px] font-black uppercase tracking-widest mb-4">Falla de Enlace en el Módulo</p>
            <button onclick="location.reload()" class="bg-cyan-500 text-black px-6 py-2 rounded text-[10px] font-bold uppercase">Reiniciar Sistema</button>
        </div>
    `;
  }
}

/**
 * 4. ACTUALIZADOR DE INTERFAZ (ACTIVE STATE)
 */
function updateActiveMenu(activeId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        const isCurrent = link.getAttribute("href") === `#${activeId}`;
        link.classList.toggle("active", isCurrent);
    });
}

/**
 * 5. INICIALIZADOR NEXUS (MOTOR PRINCIPAL)
 * Resuelve el problema de la URL y arranca el sistema
 */
function initNexus() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // FIX: Si entra como /app lo forzamos a /app/ para mantener rutas relativas limpias
    if (path.endsWith("/app")) {
        window.location.replace(path + "/" + hash);
        return;
    }

    // Si no hay destino, enviamos a Dashboard
    if (!hash || hash === "#") {
        window.location.hash = "#dashboard";
        return;
    }

    navigate(hash);
}

// LISTENERS DE EVENTOS GLOBALES
window.addEventListener("hashchange", () => navigate(window.location.hash));
window.addEventListener("load", initNexus);

// Exportación para uso global si es necesario
window.nexusNavigate = navigate;
