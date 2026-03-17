/**
 * moduleLoader.js
 * Cargador central del ERP TallerPRO360
 * Versión PRO estable
 */

import dashboard from "../modules/dashboard.js";

// Módulos principales del ERP
const modules = {
  ordenes: () => import("../modules/ordenes.js"),
  clientes: () => import("../modules/clientes.js"),
  inventario: () => import("../modules/inventario.js"),
  finanzas: () => import("../modules/finanzas.js"),
  configuracion: () => import("../modules/configuracion.js"),
  reportes: () => import("../modules/reportes.js"),

  // IA
  aiAssistant: () => import("../modules/aiAssistant.js"),
  aiAdvisor: () => import("../modules/aiAdvisor.js")
};

// Estado global
const state = {
  currentModule: null,
  empresaId: "taller_001",
  cargando: false
};

// Loader UI
function showLoader(container) {
  container.innerHTML = `
    <div style="color:#00ffcc; font-size:18px; text-align:center; padding:40px;">
      ⚡ Cargando módulo...
    </div>
  `;
}

// Error UI
function showError(container, error) {
  container.innerHTML = `
    <div style="color:red; padding:20px;">
      ❌ Error cargando módulo <br/>
      ${error.message}
    </div>
  `;
}

// Cargar módulo dinámicamente
export async function loadModule(moduleName, container) {
  if (state.cargando) return;

  try {
    state.cargando = true;
    showLoader(container);

    if (!modules[moduleName]) {
      throw new Error(`Módulo no existe: ${moduleName}`);
    }

    const module = await modules[moduleName]();

    if (!module || !module.default) {
      throw new Error(`Módulo inválido: ${moduleName}`);
    }

    container.innerHTML = "";

    // 🔥 SOPORTE async/await
    await module.default(container, state);

    state.currentModule = moduleName;

  } catch (error) {
    console.error("Error cargando módulo:", error);
    showError(container, error);
  } finally {
    state.cargando = false;
  }
}

// Inicializar ERP completo
export function initApp() {
  const root = document.getElementById("app");

  if (!root) {
    console.error("❌ No existe #app en index.html");
    return;
  }

  // Layout base
  root.innerHTML = `
    <div style="display:flex; height:100vh; background:#0a0a0a; color:white;">
      
      <!-- Sidebar -->
      <div style="width:240px; background:#111; padding:10px;">
        <h2 style="color:#00ffcc;">TallerPRO360</h2>

        <button onclick="window.navigate('dashboard')">📊 Dashboard</button>
        <button onclick="window.navigate('ordenes')">🧾 Órdenes</button>
        <button onclick="window.navigate('clientes')">👥 Clientes</button>
        <button onclick="window.navigate('inventario')">📦 Inventario</button>
        <button onclick="window.navigate('finanzas')">💰 Finanzas</button>
        <button onclick="window.navigate('reportes')">📈 Reportes</button>
        <button onclick="window.navigate('configuracion')">⚙️ Configuración</button>
      </div>

      <!-- Contenido -->
      <div id="view" style="flex:1; padding:20px; overflow:auto;"></div>
    </div>
  `;

  const view = document.getElementById("view");

  // Navegación global
  window.navigate = async (moduleName) => {
    try {
      if (moduleName === "dashboard") {
        showLoader(view);
        await dashboard(view, state);
      } else {
        await loadModule(moduleName, view);
      }
    } catch (error) {
      showError(view, error);
    }
  };

  // Cargar dashboard inicial
  window.navigate("dashboard");

  // Inicializar IA en background
  initAI();
}

// Inicializar IA (sin bloquear UI)
async function initAI() {
  try {
    const ai = await modules.aiAssistant();

    if (ai?.init) {
      ai.init();
    }

    const advisor = await modules.aiAdvisor();

    if (advisor?.init) {
      advisor.init();
    }

    console.log("🤖 IA inicializada correctamente");

  } catch (e) {
    console.warn("⚠️ IA no disponible:", e.message);
  }
}