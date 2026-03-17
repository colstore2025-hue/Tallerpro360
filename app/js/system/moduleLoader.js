/**
 * moduleLoader.js
 * Cargador central PRO360
 * Compatible Vercel, IA, voz, sidebar neón interactivo
 */

import dashboard from "../modules/dashboard.js";

// 🔊 Estado de voz
let voiceInitialized = false;

// 🔹 Módulos disponibles
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

// 🔹 Estado global
const state = {
  currentModule: null,
  empresaId: "taller_001",
  cargando: false
};

/* ===============================
UI Loader
=============================== */
function showLoader(container) {
  container.innerHTML = `
    <div style="color:#00ffcc; font-size:18px; text-align:center; padding:40px;">
      ⚡ Cargando módulo...
    </div>
  `;
}

function showError(container, error) {
  container.innerHTML = `
    <div style="color:red; padding:20px;">
      ❌ Error cargando módulo <br/>
      ${error.message}
    </div>
  `;
}

/* ===============================
Cargar módulo dinámico
=============================== */
export async function loadModule(moduleName, container) {
  if (state.cargando) return;

  try {
    state.cargando = true;
    showLoader(container);

    if (!modules[moduleName]) throw new Error(`Módulo no existe: ${moduleName}`);

    const module = await modules[moduleName]();

    if (!module || !module.default) throw new Error(`Módulo inválido: ${moduleName}`);

    container.innerHTML = "";
    await module.default(container, state);

    state.currentModule = moduleName;

  } catch (error) {
    console.error("Error cargando módulo:", error);
    showError(container, error);
  } finally {
    state.cargando = false;
  }
}

/* ===============================
Inicializar ERP completo
=============================== */
export function initApp() {
  const root = document.getElementById("app");
  if (!root) return console.error("❌ No existe #app en index.html");

  // 🔹 Layout base
  root.innerHTML = `
    <div style="display:flex; height:100vh; background:#0a0a0a; color:white;">
      
      <!-- Sidebar -->
      <div style="width:260px; background:#111; padding:10px;">
        <h2 style="color:#00ffcc; text-shadow:0 0 10px #0ff;">TallerPRO360</h2>
        ${crearSidebarButton("📊 Dashboard", "dashboard")}
        ${crearSidebarButton("🧾 Órdenes", "ordenes")}
        ${crearSidebarButton("👥 Clientes", "clientes")}
        ${crearSidebarButton("📦 Inventario", "inventario")}
        ${crearSidebarButton("💰 Finanzas", "finanzas")}
        ${crearSidebarButton("📈 Reportes", "reportes")}
        ${crearSidebarButton("⚙️ Configuración", "configuracion")}
      </div>

      <!-- Contenido -->
      <div id="view" style="flex:1; padding:20px; overflow:auto;"></div>
    </div>
  `;

  const view = document.getElementById("view");

  // 🔹 Navegación global
  window.navigate = async (moduleName) => {
    if (state.cargando) return;
    if (moduleName === "dashboard") {
      showLoader(view);
      await dashboard(view, state);
      state.currentModule = "dashboard";
    } else {
      await loadModule(moduleName, view);
    }
  };

  // 🚀 Inicial: dashboard
  window.navigate("dashboard");

  // 🤖 IA
  initAI();

  // 🎤 Voz
  initVoice();
}

/* ===============================
Crear botones sidebar con estilo neón
=============================== */
function crearSidebarButton(text, moduleName) {
  return `
    <button onclick="window.navigate('${moduleName}')" style="
      display:flex;
      align-items:center;
      gap:8px;
      margin:5px 0;
      padding:10px;
      font-size:16px;
      border-radius:8px;
      background:#0f172a;
      color:#0ff;
      box-shadow:0 0 5px #00ffcc;
      cursor:pointer;
      font-weight:bold;
      transition:0.3s;
    ">
      <span>${text}</span>
    </button>
  `;
}

/* ===============================
Inicializar IA
=============================== */
async function initAI() {
  try {
    const ai = await modules.aiAssistant();
    if (ai?.init) ai.init();

    const advisor = await modules.aiAdvisor();
    if (advisor?.init) advisor.init();

    console.log("🤖 IA inicializada correctamente");
  } catch (e) {
    console.warn("⚠️ IA no disponible:", e.message);
  }
}

/* ===============================
Inicializar Voz
=============================== */
async function initVoice() {
  if (voiceInitialized) return;

  try {
    const voice = await import("../voice/voiceAssistantWorkshop.js");
    if (voice?.init) {
      voice.init();
      voiceInitialized = true;
      console.log("🎤 Voz activada");
    }
  } catch (e) {
    console.warn("⚠️ Voz no disponible:", e.message);
  }
}