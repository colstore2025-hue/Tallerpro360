/**
 * moduleLoader.js
 * Cargador central del ERP TallerPRO360
 * Versión PRO ULTRA ROBUSTA 🔥
 */

import dashboard from "../modules/dashboard.js";

/* ================= ESTADO GLOBAL ================= */

let voiceInitialized = false;

const state = {
  currentModule: null,
  empresaId: "taller_001",
  cargando: false,
};

/* ================= MAPA DE MÓDULOS ================= */

const modules = {
  dashboard: () => import("../modules/dashboard.js"),
  ordenes: () => import("../modules/ordenes.js"),
  clientes: () => import("../modules/clientes.js"),
  inventario: () => import("../modules/inventario.js"),
  finanzas: () => import("../modules/finanzas.js"),
  reportes: () => import("../modules/reportes.js"),
  configuracion: () => import("../modules/configuracion.js"),
  contabilidad: () => import("../modules/contabilidad.js"),

  // IA
  aiassistant: () => import("../modules/aiAssistant.js"),
  aiadvisor: () => import("../modules/aiAdvisor.js"),

  // 🔥 CEO AI (corregido)
  ceoai: () => import("../modules/ceoAI.js"),
};

/* ================= UI HELPERS ================= */

function showLoader(container, text = "⚡ Cargando módulo...") {
  container.innerHTML = `
    <div style="color:#00ffcc; font-size:18px; text-align:center; padding:40px;">
      ${text}
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

/* ================= LOADER ================= */

export async function loadModule(moduleName, container) {
  if (state.cargando) return;

  try {
    state.cargando = true;
    showLoader(container);

    const key = moduleName.toLowerCase(); // 🔥 normaliza nombre

    if (!modules[key]) {
      throw new Error(`Módulo no existe: ${moduleName}`);
    }

    const module = await modules[key]();

    if (!module || !module.default) {
      throw new Error(`Módulo inválido: ${moduleName}`);
    }

    container.innerHTML = "";

    await module.default(container, state);

    state.currentModule = key;

  } catch (error) {

    console.error("❌ Error cargando módulo:", moduleName, error);

    if (error.message.includes("Failed to fetch")) {
      showError(container, new Error(`No se encontró el archivo del módulo (${moduleName}). Verifica nombre y ruta.`));
    } else {
      showError(container, error);
    }

  } finally {
    state.cargando = false;
  }
}

/* ================= INIT APP ================= */

export function initApp() {

  const root = document.getElementById("app");
  if (!root) return console.error("❌ No existe #app en index.html");

  root.innerHTML = `
    <div style="display:flex; height:100vh; background:#0a0a0a; color:white;">
      
      <!-- Sidebar -->
      <div style="width:260px; background:#111; padding:15px; display:flex; flex-direction:column; gap:10px;">
        
        <h2 style="color:#00ffcc;">TallerPRO360</h2>

        <button onclick="window.navigate('dashboard')">📊 Dashboard</button>
        <button onclick="window.navigate('ordenes')">🧾 Órdenes</button>
        <button onclick="window.navigate('clientes')">👥 Clientes</button>
        <button onclick="window.navigate('inventario')">📦 Inventario</button>
        <button onclick="window.navigate('finanzas')">💰 Finanzas</button>
        <button onclick="window.navigate('contabilidad')">💼 Contabilidad</button>
        <button onclick="window.navigate('ceoai')">🧠 CEO AI</button>
        <button onclick="window.navigate('reportes')">📈 Reportes</button>
        <button onclick="window.navigate('configuracion')">⚙️ Configuración</button>

      </div>

      <!-- Vista -->
      <div id="view" style="flex:1; padding:20px; overflow:auto;"></div>
    </div>
  `;

  const view = document.getElementById("view");

  /* ================= NAVEGACIÓN ================= */

  window.navigate = async (moduleName) => {
    if (state.cargando) return;

    try {

      if (moduleName === "dashboard") {

        showLoader(view);

        await dashboard(view, state);

        state.currentModule = "dashboard";

      } else {

        await loadModule(moduleName, view);

      }

    } catch (error) {

      showError(view, error);

    }
  };

  /* ================= INIT ================= */

  window.navigate("dashboard");

  initAI();
  initVoice();
}

/* ================= IA ================= */

async function initAI() {

  try {

    const ai = await modules.aiassistant();
    if (ai?.init) ai.init();

    const advisor = await modules.aiadvisor();
    if (advisor?.init) advisor.init();

    console.log("🤖 IA inicializada");

  } catch (e) {

    console.warn("⚠️ IA no disponible:", e.message);

  }
}

/* ================= VOZ ================= */

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