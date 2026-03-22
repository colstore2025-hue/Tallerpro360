/**
 * router.js - TallerPRO360 ULTRA V3 🚀
 * VERSIÓN: 10.1 (Fuerza Bruta de Caché)
 */

const VERSION_ACTUAL = "v10.1"; 

async function checkForUpdates() {
  const savedVersion = localStorage.getItem("app_version");
  if (savedVersion !== VERSION_ACTUAL) {
    console.warn("🔄 Actualizando estructura del edificio...");
    localStorage.setItem("app_version", VERSION_ACTUAL);
    
    // Limpieza profunda de Service Workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let r of regs) await r.unregister();
    }
    // Forzamos recarga ignorando caché del navegador
    location.reload(true); 
  }
}
checkForUpdates();

// 💡 Agregamos el VERSION_ACTUAL a los imports para que Vercel no nos mienta
const routes = {
  dashboard:     () => import(`../modules/dashboard.js?v=${VERSION_ACTUAL}`),
  ordenes:       () => import(`../modules/ordenes.js?v=${VERSION_ACTUAL}`),
  vehiculos:     () => import(`../modules/vehiculos.js?v=${VERSION_ACTUAL}`),
  inventario:    () => import(`../modules/inventario.js?v=${VERSION_ACTUAL}`),
  clientes:      () => import(`../modules/clientes.js?v=${VERSION_ACTUAL}`),
  contabilidad:  () => import(`../modules/contabilidad.js?v=${VERSION_ACTUAL}`),
  configuracion: () => import(`../modules/config.js?v=${VERSION_ACTUAL}`)
};

export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // 1. Limpieza total antes de cargar el nuevo módulo
  // Esto evita que los módulos se "encimen" uno sobre otro
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64">
        <div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p class="mt-4 text-[10px] text-cyan-400 uppercase tracking-widest animate-pulse">Cargando ${moduleName}...</p>
    </div>`;

  if (!routes[moduleName]) {
    container.innerHTML = `<div class="p-10 text-white bg-red-900/20 rounded-3xl border border-red-500/50 text-center">
        ⚠️ Módulo [${moduleName}] no encontrado en el mapa del edificio.
    </div>`;
    return;
  }

  try {
    const module = await routes[moduleName]();
    const renderFunc = module.default;

    if (typeof renderFunc !== 'function') throw new Error("Punto de entrada inválido");

    // Limpiamos de nuevo por si acaso quedó rastro del loader
    container.innerHTML = "";
    
    const state = {
      uid: localStorage.getItem("uid"),
      empresaId: localStorage.getItem("empresaId") || "taller_001",
      rol: localStorage.getItem("rol")
    };

    // Ejecutamos el render
    await renderFunc(container, state);
    
    console.log(`🏁 Puerta ${moduleName} abierta.`);
    document.getElementById("boot-loader")?.remove();

  } catch (error) {
    console.error("🔥 Falla en el ascensor:", error);
    container.innerHTML = `<div class="p-10 text-red-500 text-center">Error: ${error.message}</div>`;
  }
}

// Escuchas globales (No cambies esto)
window.onhashchange = () => {
    const mod = window.location.hash.replace("#", "");
    if (mod) navigate(mod);
};

window.onload = () => {
    const mod = window.location.hash.replace("#", "") || "dashboard";
    navigate(mod);
};
