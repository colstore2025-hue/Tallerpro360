/*
=====================================
router.js
Router SPA completo TallerPRO360 · Nivel Tesla
=====================================
*/

const routes = {

  // Panel principal
  dashboard: () => import("/app/js/modules/dashboard.js"),

  // Gestión de órdenes
  ordenes: () => import("/app/js/modules/ordenes.js"),

  // Inventario inteligente
  inventario: () => import("/app/js/modules/inventario.js"),

  // CRM Clientes + Vehículos
  clientes: () => import("/app/js/modules/clientes.js"),

  // Finanzas y contabilidad
  finanzas: () => import("/app/js/modules/finanzas.js"),
  contabilidad: () => import("/app/js/modules/contabilidad.js"),

  // Pagos (PSE, tarjeta, efectivo)
  pagos: () => import("/app/js/modules/pagosTaller.js"),

  // Reportes PDF/Excel + IA
  reportes: () => import("/app/js/modules/reportes.js"),

  // Configuración avanzada del taller
  configuracion: () => import("/app/js/modules/configuracion.js"),

  // Asistente IA para consultas de taller
  aiAssistant: () => import("/app/js/modules/aiAssistant.js"),

  // Asistente CEO / IA gerencial
  ceoAI: () => import("/app/js/modules/ceoAI.js"),

  // Módulos adicionales futuros
  aiAdvisor: () => import("/app/js/modules/aiAdvisor.js"),
};

/* ===============================
NAVEGACIÓN PRINCIPAL
=============================== */
export async function navigate(moduleName) {
  const container = document.getElementById("appContainer"); // Unificamos ID
  if (!container) return;

  try {
    const module = await routes[moduleName]();
    // IMPORTANTE: Algunos módulos exportan una función directamente, otros un objeto
    const renderFunc = module.default || module[moduleName]; 
    
    container.innerHTML = ""; // Limpiar antes de inyectar
    await renderFunc(container, window.appState);
    
    document.getElementById("boot-loader")?.remove(); // Matar el loader al cargar
  } catch (error) {
    console.error("❌ Error en Router:", error);
  }
}


  if (!routes[moduleName]) {
    console.warn("⚠️ Módulo no existe:", moduleName);
    container.innerHTML = `
      <h2 style="padding:20px;color:#ff4d4d;">Módulo no encontrado: ${moduleName}</h2>
    `;
    return;
  }

  try {
    console.log("📦 Cargando módulo:", moduleName);

    const module = await routes[moduleName]();

    // limpiar vista
    container.innerHTML = `<p style="padding:20px;color:#0ff;">Cargando ${moduleName}...</p>`;

    // ejecutar módulo
    await module.default(container, window.appState);

    console.log("✅ Módulo cargado:", moduleName);
  } catch (error) {
    console.error("❌ Error cargando módulo:", moduleName, error);

    container.innerHTML = `
      <div style="padding:30px;background:#111;color:#ff4d4d;border-radius:10px;">
        <h2>Error cargando módulo: ${moduleName}</h2>
        <p>${error.message || error}</p>
      </div>
    `;
  }
}

/* ===============================
GLOBAL (para botones UI)
=============================== */
if (typeof window !== "undefined") {
  window.navigate = navigate;

  // Navegación inicial al dashboard si no hay hash
  const hashModule = window.location.hash.replace("#", "");
  navigate(hashModule || "dashboard");

  // Escuchar cambios en la URL para SPA hash-routing
  window.addEventListener("hashchange", () => {
    const mod = window.location.hash.replace("#", "");
    navigate(mod);
  });
}