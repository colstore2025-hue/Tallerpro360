/**
 * moduleLoader.js
 * ULTRA PRO · TallerPRO360 🚀
 * CORE integrado + Autoregulación Firestore + Watchers + Heartbeat + IA + Voz
 */

import { hablar } from "../voice/voiceCore.js";
import { activarModoDiosGuardian, fixTotalInicial } from "../system/firestoreGuardianGod.js";

let voiceInitialized = false;

const state = {
  currentModule: null,
  empresaId: null,
  uid: null,
  rolGlobal: null,
  plan: null,
  planFechaInicio: null,
  cargando: false,
};

const CORE = {
  modulosFallidos: [],
  intentos: {},
  estado: "inicializando",
  errores: [],
};

/* ================= MAPA DE MÓDULOS ================= */
const modules = {
  dashboard: () => import("../modules/dashboard.js"),
  ordenes: () => import("../modules/ordenes.js"),
  clientes: () => import("../modules/clientes.js"),
  inventario: () => import("../modules/inventario.js"),
  finanzas: () => import("../modules/finanzas.js"),
  contabilidad: () => import("../modules/contabilidad.js"),
  reportes: () => import("../modules/reportes.js"),
  configuracion: () => import("../modules/configuracion.js"),
  pagos: () => import("../modules/pagosTaller.js"),
  vehiculos: () => import("../modules/vehículos.js"),
  aiasistant: () => import("../modules/aiAssistant.js"),
  aiadvisor: () => import("../modules/aiAdvisor.js"),
  gerenteai: () => import("../modules/gerenteAI.js"),
  ia: () => import("../modules/ia.js"),
};

/* ================= PERMISOS POR PLAN ================= */
function verificarPermisoModulo(modulo) {
  const plan = state.plan;
  const superadmin = state.rolGlobal === "superadmin";

  const moduloPremium = ["inventario","finanzas","contabilidad","reportes","configuracion","gerenteai","pagos"];
  const moduloERP = ["ordenes","clientes","dashboard","vehiculos"];
  const moduloReportes = ["reportes","contabilidad"];
  const moduloFacturacion = ["configuracion","pagos"];

  if(plan === "Freemium" && state.planFechaInicio){
    const diffDias = Math.floor((new Date() - state.planFechaInicio) / (1000*60*60*24));
    if(diffDias > 15){
      alert("⏳ Tu plan Freemium ha expirado. Actualiza para continuar.");
      return false;
    }
  }

  if(superadmin) return true;

  if(plan === "Freemium" || plan === "Básico" || plan === "Pro"){
    if(moduloReportes.includes(modulo) || moduloFacturacion.includes(modulo)) return false;
  }
  if(plan === "Elite"){
    if(moduloFacturacion.includes(modulo)) return false;
  }
  return true;
}

/* ================= LOAD MODULE CON AUTOREINTENTOS ================= */
export async function ejecutarModuloSeguro(nombre, state, container) {
  try {
    const mod = await import(`../modules/${nombre}.js?v=${Date.now()}`);
    if (!mod?.default) throw new Error(`Módulo inválido: ${nombre}`);
    await mod.default(container, state);
  } catch (e) {
    console.error(`❌ Falló módulo ${nombre}`, e);
    CORE.modulosFallidos.push(nombre);
    CORE.intentos[nombre] = (CORE.intentos[nombre] || 0) + 1;

    if (CORE.intentos[nombre] < 5) {
      setTimeout(() => ejecutarModuloSeguro(nombre, state, container), 2000);
    } else {
      console.error(`💀 Módulo ${nombre} muerto tras 5 intentos`);
    }
  }
}

/* ================= INIT APP ================= */
export async function initApp() {
  const container = document.getElementById("appContainer");
  const sidebar = document.getElementById("sidebar");

  try {
    const { auth, db } = await import("../core/firebase-config.js");
    const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    onAuthStateChanged(auth, async (user) => {
      if (!user) return window.location.href = "/login.html";

      const snap = await getDoc(doc(db, "usuariosGlobal", user.uid));
      if (!snap.exists()) return window.location.href = "/login.html";

      const u = snap.data();
      state.uid = user.uid;
      state.empresaId = u.empresaId;
      state.rolGlobal = u.rolGlobal || "user";
      state.plan = u.plan || "Freemium";
      state.planFechaInicio = u.planFechaInicio?.toDate ? u.planFechaInicio.toDate() : new Date();

      // 🔹 CORE ACTIVADO
      CORE.estado = "activo";

      await fixTotalInicial(state.empresaId);
      activarModoDiosGuardian(state.empresaId);

      renderSidebar(sidebar, state.rolGlobal, state.plan);
      await ejecutarModuloSeguro("dashboard", state, container);

      // 🔹 CEO y IA
      initCEO();
      initIA();
      initVoice();

      // 🔹 Heartbeat para reintentos
      setInterval(() => {
        if (CORE.modulosFallidos.length > 0) {
          const pendientes = [...CORE.modulosFallidos];
          CORE.modulosFallidos = [];
          pendientes.forEach(nombre => {
            console.log("🔁 Reintentando módulo:", nombre);
            ejecutarModuloSeguro(nombre, state, container);
          });
        }
      }, 15000);
    });

    document.getElementById("logoutBtn").onclick = async () => {
      await signOut(auth);
      localStorage.clear();
      window.location.href = "/login.html";
    };

  } catch (e) {
    container.innerHTML = `<div style="color:red;">❌ Error inicializando APP<br>${e.message}</div>`;
    console.error(e);
  }
}

/* ================= SIDEBAR ================= */
function renderSidebar(sidebar, rol, plan) {
  const baseModules = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "ordenes", label: "🧾 Órdenes" },
    { id: "clientes", label: "👥 Clientes" },
    { id: "vehiculos", label: "🚗 Vehículos" }
  ];

  if (["Pro","Elite","Enterprise"].includes(plan)) {
    baseModules.push({ id: "inventario", label: "📦 Inventario" });
    baseModules.push({ id: "finanzas", label: "💰 Finanzas" });
    baseModules.push({ id: "pagos", label: "💳 Pagos" });
  }

  if (rol === "superadmin" || ["Elite","Enterprise"].includes(plan)) {
    baseModules.push({ id: "contabilidad", label: "📊 Contabilidad" });
    baseModules.push({ id: "gerenteai", label: "🧠 Gerente AI" });
    baseModules.push({ id: "reportes", label: "📈 Reportes" });
    baseModules.push({ id: "configuracion", label: "⚙️ Configuración" });
  }

  sidebar.innerHTML = baseModules
    .map(m => `<button onclick="window.PRO360?.ejecutarModuloSeguro('${m.id}', window.state, document.getElementById('appContainer'))">${m.label}</button>`)
    .join("");
}

/* ================= IA ================= */
async function initIA() {
  try {
    const ia = await modules.ia();
    if (ia?.init) ia.init();

    const ai = await modules.aiasistant();
    if (ai?.init) ai.init();

    const advisor = await modules.aiadvisor();
    if (advisor?.init) advisor.init();

    console.log("🤖 IA inicializada");
  } catch (e) {
    console.warn("⚠️ IA no disponible:", e.message);
  }
}

/* ================= VOICE ================= */
async function initVoice() {
  if (voiceInitialized) return;
  try {
    const voice = await import("../voice/voiceAssistantWorkshop.js");
    if (voice?.init) { voice.init(); voiceInitialized = true; console.log("🎤 Voz activada"); }
  } catch (e) {
    console.warn("⚠️ Voz no disponible:", e.message);
  }
}

/* ================= CEO AUTÓNOMO ================= */
async function initCEO() {
  try {
    const ceo = await import("../ai/ceoAutonomo.js");
    if (ceo.default?.iniciar) ceo.default.iniciar(state);
    console.log("👑 CEO Autónomo ACTIVADO");
  } catch (e) {
    console.warn("⚠️ CEO no disponible:", e.message);
  }
}

/* ================= GLOBAL ================= */
window.PRO360 = {
  core: CORE,
  ejecutarModuloSeguro,
  estado: () => CORE.estado,
  errores: () => CORE.errores
};