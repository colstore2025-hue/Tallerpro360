/**
 * router.js
 * 🚀 Orquestador de Navegación SPA - TallerPRO360
 * Nexus-X Starlink SAS - Enterprise Cloud Edition
 * Ruta: app/js/core/router.js
 */

const routes = {
  dashboard:     () => import("../modules/dashboard.js"),
  ordenes:       () => import("../modules/ordenes.js"),
  inventario:    () => import("../modules/inventario.js"),
  clientes:      () => import("../modules/clientes.js"),
  finanzas:      () => import("../modules/finanzas.js"),
  contabilidad:  () => import("../modules/contabilidad.js"),
  pagos:         () => import("../modules/pagosTaller.js"),
  reportes:      () => import("../modules/reportes.js"),
  configuracion: () => import("../modules/configuracion.js"),
  aiAssistant:   () => import("../modules/aiAssistant.js"),
  ceoAI:         () => import("../modules/ceoAI.js"), // Exclusivo Superadmin
  aiAdvisor:     () => import("../modules/aiAdvisor.js")
};

/* ===============================
   NAVEGACIÓN PRINCIPAL
   =============================== */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  const role = localStorage.getItem("rol");
  
  if (!container) return;

  // 1. SEGURIDAD DE ACCESO (Nexus-X Logic)
  // Impedir que talleres vean módulos de administración global
  if (moduleName === 'ceoAI' && role !== 'superadmin') {
    console.warn("🚫 Acceso denegado a módulo CEO.");
    window.location.hash = "#dashboard";
    return;
  }

  // 2. VALIDAR RUTA
  if (!routes[moduleName]) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen text-slate-500">
        <i class="fas fa-map-signs text-5xl mb-4"></i>
        <h2 class="text-xl font-bold">Módulo [${moduleName}] en desarrollo</h2>
        <button onclick="window.navigate('dashboard')" class="mt-4 text-cyan-400 underline">Regresar al centro de mando</button>
      </div>`;
    return;
  }

  try {
    // Feedback visual con estética Neón
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div class="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-xs tracking-widest text-cyan-400 uppercase animate-pulse">Enlazando con Nexus-X...</p>
      </div>`;

    // 3. IMPORTACIÓN DINÁMICA CON TRY-CATCH
    const module = await routes[moduleName]();
    
    // Soporte flexible para: export default function o export function nombreModulo
    const renderFunc = module.default || module[moduleName];

    if (typeof renderFunc !== 'function') {
      throw new Error(`El módulo [${moduleName}] no tiene una función de inicio válida.`);
    }

    // 4. LIMPIEZA Y RENDERIZADO
    container.innerHTML = "";
    
    const state = {
      uid: localStorage.getItem("uid"),
      empresaId: localStorage.getItem("empresaId"),
      rol: role,
      plan: localStorage.getItem("plan") || "freemium"
    };

    // Ejecutar el módulo inyectando el contenedor y el estado
    await renderFunc(container, state);

    // Remover loader de sistema si es la primera carga
    document.getElementById("boot-loader")?.fadeOut?.(); // Si usas una librería de efectos
    document.getElementById("boot-loader")?.remove();
    
    console.log(`🚀 TallerPRO360: [${moduleName}] activo.`);

  } catch (error) {
    console.error(`❌ Falla en módulo ${moduleName}:`, error);
    container.innerHTML = `
      <div class="p-10 m-6 border border-red-500/30 bg-red-500/5 rounded-3xl text-center">
        <i class="fas fa-microchip-slash text-red-500 text-4xl mb-4"></i>
        <h2 class="text-white font-bold text-lg">Error de Sincronización</h2>
        <p class="text-slate-400 text-sm mt-2 mb-6">${error.message}</p>
        <div class="flex gap-2 justify-center">
          <button onclick="location.reload()" class="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-xs">REINTENTAR</button>
          <button onclick="window.navigate('dashboard')" class="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold text-xs">DASHBOARD</button>
        </div>
      </div>`;
  }
}

/* ===============================
   MANEJO AUTOMÁTICO DE EVENTOS
   =============================== */
if (typeof window !== "undefined") {
  window.navigate = navigate;

  // Escuchar cambios en la URL (Atrás/Adelante en el navegador)
  window.onhashchange = () => {
    const mod = window.location.hash.replace("#", "");
    if (mod) navigate(mod);
  };

  // Carga inicial al entrar a la URL
  window.onload = () => {
    const initialMod = window.location.hash.replace("#", "") || "dashboard";
    navigate(initialMod);
  };
}
