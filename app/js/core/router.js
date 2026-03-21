/**
 * router.js
 * 🚀 Orquestador de Navegación SPA - TallerPRO360
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
  ceoAI:         () => import("../modules/ceoAI.js"),
  aiAdvisor:     () => import("../modules/aiAdvisor.js")
};

/* ===============================
   NAVEGACIÓN PRINCIPAL
   =============================== */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  
  if (!container) {
    console.error("❌ Error Crítico: No se encontró el contenedor #appContainer");
    return;
  }

  // Validar si la ruta existe
  if (!routes[moduleName]) {
    console.warn(`⚠️ El módulo [${moduleName}] no está definido.`);
    container.innerHTML = `<div class="p-10 text-red-500"><h2>Módulo no encontrado: ${moduleName}</h2></div>`;
    return;
  }

  try {
    console.log(`📦 SPA: Cargando módulo [${moduleName}]...`);
    
    // Feedback visual de carga
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-cyan-400">
        <i class="fas fa-circle-notch fa-spin text-3xl mb-4"></i>
        <p class="animate-pulse">Sincronizando ${moduleName}...</p>
      </div>`;

    // Importación dinámica
    const module = await routes[moduleName]();
    
    // Identificar la función de renderizado (soporta export default o export nombrado)
    const renderFunc = module.default || module[moduleName];

    if (typeof renderFunc !== 'function') {
      throw new Error(`El módulo ${moduleName} no exporta una función válida.`);
    }

    // Limpiar contenedor e inyectar módulo
    container.innerHTML = "";
    
    // Recuperar estado global (prioriza window.appState o localStorage)
    const currentState = window.appState || {
      uid: localStorage.getItem("uid"),
      empresaId: localStorage.getItem("empresaId"),
      rol: localStorage.getItem("rol")
    };

    await renderFunc(container, currentState);

    // Matar el loader inicial si aún existe
    document.getElementById("boot-loader")?.remove();
    
    console.log(`✅ SPA: Módulo [${moduleName}] desplegado con éxito.`);

  } catch (error) {
    console.error(`❌ Error al navegar a ${moduleName}:`, error);
    container.innerHTML = `
      <div class="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
        <i class="fas fa-engine-warning text-red-500 text-3xl mb-4"></i>
        <h2 class="text-white font-bold">Falla en la carga del módulo</h2>
        <p class="text-slate-400 text-sm my-2">${error.message}</p>
        <button onclick="location.reload()" class="mt-4 bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold">Reintentar sistema</button>
      </div>`;
  }
}

/* ===============================
   INICIALIZACIÓN GLOBAL
   =============================== */
if (typeof window !== "undefined") {
  window.navigate = navigate;

  // Manejo del Hash para evitar recargas de página
  window.addEventListener("hashchange", () => {
    const mod = window.location.hash.replace("#", "");
    if (mod) navigate(mod);
  });

  // Carga inicial basada en la URL actual o dashboard por defecto
  window.addEventListener("load", () => {
    const initialMod = window.location.hash.replace("#", "") || "dashboard";
    navigate(initialMod);
  });
}
