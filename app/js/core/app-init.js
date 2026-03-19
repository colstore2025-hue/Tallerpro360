/**
 * app-init.js
 * Core Loader PRO360 · ERP SaaS
 * 🔥 Versión ULTRA ESTABLE + Guardian IA + Modo Dios
 */

// ================= IMPORTS =================
import dashboardModule from "../modules/dashboard.js";
import ordenesModule from "../modules/ordenes.js";
import clientesModule from "../modules/clientes.js";
import inventarioModule from "../modules/inventario.js";
import contabilidadModule from "../modules/contabilidad.js";
import finanzasModule from "../modules/finanzas.js";
import pagosTallerModule from "../modules/pagosTaller.js";
import reportesModule from "../modules/reportes.js";
import configuracionModule from "../modules/configuracion.js";
import ceoAIModule from "../modules/ceoAI.js"; // 👑 IMPORTANTE

import { ejecutarGuardianIA } from "../ai/firestoreGuardianAI.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";
import orquestadorSupremo from "./orquestadorSupremo.js";

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ================= STATE GLOBAL =================
const state = {
  uid: localStorage.getItem("uid") || null,
  empresaId: localStorage.getItem("empresaId") || null,
  rol: localStorage.getItem("rol") || null,
  planTipo: localStorage.getItem("planTipo") || "freemium"
};

// ================= DOM =================
const container = document.getElementById("appContainer");
const menu = document.getElementById("menu");
const logoutBtn = document.getElementById("logoutBtn");

// ================= AUTH =================
onAuthStateChanged(auth, user => {

  if (!user) {
    console.warn("🔒 Usuario no autenticado");
    localStorage.clear();
    window.location.href = "/login.html";
    return;
  }

  state.uid = user.uid;

  if (!state.empresaId) {
    console.error("❌ empresaId no definido");
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        Empresa no configurada
      </h2>
    `;
    return;
  }

  initApp();
});
orquestadorSupremo.activarOrquestadorSupremo();

// ================= LOGOUT =================
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "/login.html";
  };
}

// ================= INIT =================
function initApp() {

  renderMenu();

  // 🚀 carga inicial segura
  safeLoad("dashboard");

  // 🧠 IA automática
  activarGuardian();
}

// ================= GUARDIAN + DIOS =================
function activarGuardian() {

  setTimeout(() => {

    const empresaId = state.empresaId;
    if (!empresaId) return;

    const lastRun = localStorage.getItem("guardian_last_run");
    const now = Date.now();

    if (!lastRun || (now - Number(lastRun)) > (6 * 60 * 60 * 1000)) {

      console.log("🧠 Ejecutando Guardian IA...");
      ejecutarGuardianIA({ empresaId });

      localStorage.setItem("guardian_last_run", now);
    }

    // 😈 MODO DIOS (tiempo real)
    activarModoDiosGuardian(empresaId);

  }, 3000);
}

// ================= MENU =================
function renderMenu() {

  if (!menu) return;

  menu.innerHTML = `
    <button data-module="dashboard">📊 Dashboard</button>
    <button data-module="ordenes">🧾 Órdenes</button>
    <button data-module="clientes">👥 Clientes</button>
    <button data-module="inventario">📦 Inventario</button>
    <button data-module="finanzas">💰 Finanzas</button>
    <button data-module="contabilidad">📑 Contabilidad</button>
    <button data-module="pagosTaller">💳 Pagos</button>
    <button data-module="reportes">📋 Reportes</button>
    <button data-module="ceoAI">👑 CEO AI</button>
    <button data-module="configuracion">⚙️ Configuración</button>
  `;

  menu.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => safeLoad(btn.dataset.module);
  });
}

// ================= LOADER SEGURO =================
async function safeLoad(name) {

  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;margin-top:50px;">
      <p style="color:#0ff;">🔄 Cargando ${name}...</p>
    </div>
  `;

  try {

    const modules = {
      dashboard: dashboardModule,
      ordenes: ordenesModule,
      clientes: clientesModule,
      inventario: inventarioModule,
      finanzas: finanzasModule,
      contabilidad: contabilidadModule,
      pagosTaller: pagosTallerModule,
      reportes: reportesModule,
      configuracion: configuracionModule,
      ceoAI: ceoAIModule
    };

    const mod = modules[name];

    if (!mod) throw new Error("Módulo no registrado");

    await mod(container, state);

  } catch (e) {

    console.error("❌ ERROR MODULO:", name, e);

    // 🔥 FALLBACK AUTOMÁTICO
    container.innerHTML = `
      <div style="text-align:center;color:red;">
        <h2>❌ Error cargando módulo</h2>
        <p>${name}</p>
        <small>${e.message}</small>

        <br/><br/>
        <button onclick="location.reload()"
          style="padding:10px;background:#00ffff;border:none;border-radius:8px;">
          🔄 Reiniciar sistema
        </button>
      </div>
    `;
  }
}

// ================= EXPORT =================
export { state };