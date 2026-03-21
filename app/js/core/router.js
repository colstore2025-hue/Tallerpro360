/**
 * router.js
 * 🚀 Orquestador de Navegación SPA - TallerPRO360
 * Nexus-X Starlink SAS - Enterprise Cloud Edition
 * Ruta: app/js/core/router.js
 */

const routes = {
  dashboard:     () => import("../modules/dashboard.js"),
  ordenes:       () => import("../modules/ordenes.js"),
  vehiculos:     () => import("../modules/vehiculos.js"), // ✅ Añadido
  inventario:    () => import("../modules/inventario.js"),
  clientes:      () => import("../modules/clientes.js"),
  finanzas:      () => import("../modules/finanzas.js"),
  contabilidad:  () => import("../modules/contabilidad.js"),
  pagos:         () => import("../modules/pagosTaller.js"),
  reportes:      () => import("../modules/reportes.js"),
  configuracion: () => import("../modules/config.js"),      // ✅ Corregido (config.js)
  aiAssistant:   () => import("../modules/aiAssistant.js"),
  gerenteAI:     () => import("../modules/gerenteAI.js"),  // ✅ Corregido (gerenteAI.js)
  aiAdvisor:     () => import("../modules/aiAdvisor.js")
};

/* ===============================
   NAVEGACIÓN PRINCIPAL
   =============================== */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  const role = localStorage.getItem("rol");
  
  if (!container) return;

  // SEGURIDAD: Solo Superadmin entra al Gerente AI de Nexus-X
  if (moduleName === 'gerenteAI' && role !== 'superadmin') {
    console.warn("🚫 Acceso restringido.");
    window.location.hash = "#dashboard";
    return;
  }

  if (!routes[moduleName]) {
    container.innerHTML = `<div class="p-10 text-center text-slate-500">Módulo [${moduleName}] no disponible.</div>`;
    return;
  }

  try {
    // UI Loading Neón
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p class="mt-4 text-[10px] tracking-[0.2em] text-cyan-400 uppercase animate-pulse">Sincronizando Nexus-X</p>
      </div>`;

    // Carga del Módulo
    const module = await routes[moduleName]();
    const renderFunc = module.default || module[moduleName];

    if (typeof renderFunc !== 'function') throw new Error("Falla en punto de entrada del módulo.");

    // Limpieza e Inyección de Estado
    container.innerHTML = "";
    
    const state = {
      uid: localStorage.getItem("uid"),
      empresaId: localStorage.getItem("empresaId"),
      rol: role,
      plan: localStorage.getItem("plan") || "freemium"
    };

    // CARGA SILENCIOSA DE IA (Si existe el script ia.js)
    // Esto permite que el asistente de voz esté disponible globalmente
    try {
      await import("../modules/ia.js");
    } catch(e) { 
      console.log("ℹ️ Sistema IA en espera."); 
    }

    await renderFunc(container, state);

    // Finalizar loaders
    document.getElementById("boot-loader")?.remove();
    console.log(`✅ [${moduleName}] cargado exitosamente.`);

  } catch (error) {
    console.error(`❌ Error en ${moduleName}:`, error);
    container.innerHTML = `
      <div class="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center">
        <h2 class="text-white font-bold">Error de Conexión Modular</h2>
        <p class="text-slate-500 text-xs my-2">${error.message}</p>
        <button onclick="location.reload()" class="mt-4 bg-cyan-500 text-black px-4 py-2 rounded-lg text-xs font-bold">REINTENTAR</button>
      </div>`;
  }
}

/* ===============================
   INICIALIZACIÓN
   =============================== */
if (typeof window !== "undefined") {
  window.navigate = navigate;

  window.onhashchange = () => {
    const mod = window.location.hash.replace("#", "");
    if (mod) navigate(mod);
  };

  window.onload = () => {
    const initialMod = window.location.hash.replace("#", "") || "dashboard";
    navigate(initialMod);
  };
}
