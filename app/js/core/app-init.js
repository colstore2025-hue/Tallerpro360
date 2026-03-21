/**
 * app-init.js - TallerPRO360 ULTRA
 */
import dashboard from "../modules/dashboard.js";
import ordenes from "../modules/ordenes.js";
import clientes from "../modules/clientes.js";
import inventario from "../modules/inventario.js";
import gerenteAI from "../modules/gerenteAI.js"; // ✅ Nombre actualizado
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import orquestador from "./orquestadorSupremo.js";

const state = {
  uid: localStorage.getItem("uid"),
  empresaId: localStorage.getItem("empresaId"),
  rol: localStorage.getItem("rol"),
  rolGlobal: localStorage.getItem("rolGlobal"),
  planTipo: localStorage.getItem("planTipo") || "pro"
};

const container = document.getElementById("appContainer");
const menu = document.getElementById("menu");

onAuthStateChanged(auth, user => {
  if (!user) {
    localStorage.clear();
    window.location.href = "/login.html";
    return;
  }
  state.uid = user.uid;
  // Re-validar empresaId
  state.empresaId = state.empresaId || localStorage.getItem("empresaId");
  
  if (state.empresaId || state.rolGlobal === 'superadmin') {
    initApp();
  } else {
    console.error("Falta empresaId en el perfil del usuario");
  }
});

function initApp() {
  renderMenu();
  loadModule("dashboard");
  // Activamos el modo Dios y auto-reparación
  orquestador.activarOrquestadorSupremo(state);
}

export async function loadModule(name) {
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;margin-top:50px;"><p style="color:#0ff;">🔄 Cargando ${name}...</p></div>`;

  const modules = {
    dashboard, ordenes, clientes, inventario,
    gerenteAI // Asegúrate de que gerenteAI.js exporte por defecto
  };

  try {
    const mod = modules[name];
    if (!mod) throw new Error(`Módulo ${name} no encontrado`);
    await mod(container, state);
  } catch (e) {
    console.error(`❌ Error en ${name}:`, e);
    container.innerHTML = `<div style="color:red;padding:20px;">⚠️ Error: ${e.message}</div>`;
  }
}

function renderMenu() {
  if (!menu) return;
  const items = [
    {id: "dashboard", n: "📊 Dashboard"},
    {id: "ordenes", n: "🧾 Órdenes"},
    {id: "inventario", n: "📦 Inventario"},
    {id: "gerenteAI", n: "👑 Gerente AI"}
  ];
  menu.innerHTML = items.map(i => `<button data-module="${i.id}">${i.n}</button>`).join("");
  menu.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadModule(btn.dataset.module);
  });
}
