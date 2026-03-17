/**
 * app-init.js
 * Core Loader PRO360 · ERP SaaS
 * Autor: PRO360 / Nexus-Starlink SAS
 * Última generación: Tesla Nivel PRO360
 */

import dashboardModule from "../modules/dashboard.js";
import ordenesModule from "../modules/ordenes.js";
import clientesModule from "../modules/clientes.js";
import inventarioModule from "../modules/inventario.js";
import contabilidadModule from "../modules/contabilidad.js";
import finanzasModule from "../modules/finanzas.js";
import pagosTallerModule from "../modules/pagosTaller.js";
import reportesModule from "../modules/reportes.js";
import configuracionModule from "../modules/configuracion.js";

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------------------------
// GLOBAL STATE
// ---------------------------
const state = {
  uid: localStorage.getItem("uid") || null,
  empresaId: localStorage.getItem("empresaId") || null,
  rol: localStorage.getItem("rol") || null,
  planTipo: localStorage.getItem("planTipo") || "freemium"
};

// ---------------------------
// ELEMENTOS DEL LAYOUT
// ---------------------------
const container = document.getElementById("appContainer");
const menu = document.getElementById("menu");
const logoutBtn = document.getElementById("logoutBtn");

// ---------------------------
// AUTENTICACIÓN
// ---------------------------
onAuthStateChanged(auth, user => {
  if (!user) {
    localStorage.clear();
    window.location.href = "/login.html";
  } else {
    state.uid = user.uid;
    initApp();
  }
});

// ---------------------------
// LOGOUT
// ---------------------------
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "/login.html";
  };
}

// ---------------------------
// INICIALIZAR APP
// ---------------------------
function initApp() {
  renderMenu();
  loadModule("dashboard");
}

// ---------------------------
// RENDER MENÚ
// ---------------------------
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
    <button data-module="configuracion">⚙️ Configuración</button>
  `;

  menu.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadModule(btn.dataset.module);
  });
}

// ---------------------------
// CARGAR MÓDULO
// ---------------------------
async function loadModule(name) {
  if (!container) return;

  container.innerHTML = `<p style="color:#0ff; text-align:center;">Cargando ${name}...</p>`;

  try {
    switch(name) {
      case "dashboard":
        await dashboardModule(container, state);
        break;
      case "ordenes":
        await ordenesModule(container, state);
        break;
      case "clientes":
        await clientesModule(container, state);
        break;
      case "inventario":
        await inventarioModule(container, state);
        break;
      case "finanzas":
        await finanzasModule(container, state);
        break;
      case "contabilidad":
        await contabilidadModule(container, state);
        break;
      case "pagosTaller":
        await pagosTallerModule(container, state);
        break;
      case "reportes":
        await reportesModule(container, state);
        break;
      case "configuracion":
        await configuracionModule(container, state);
        break;
      default:
        container.innerHTML = `<p style="color:red;">❌ Módulo no encontrado</p>`;
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p style="color:red;">Error cargando módulo: ${e.message}</p>`;
  }
}

// ---------------------------
// EXPORT (opcional)
// ---------------------------
export { loadModule, state };