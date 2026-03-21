/**
 * bootSystem.js
 * Boot del ERP · TallerPRO360
 */

import { bootStatus } from "./bootDiagnostic.js";
import clientesModule from "../modules/clientes.js";
import dashboardModule from "../modules/dashboard.js";

export async function bootSystem() {
  bootStatus("🧠 Iniciando sistema...");

  try {
    const uid = localStorage.getItem("uid");
    let empresaId = localStorage.getItem("empresaId");

    if (!uid) throw new Error("Usuario no autenticado");
    if (!empresaId) {
      empresaId = "demoEmpresa";
      localStorage.setItem("empresaId", empresaId);
      bootStatus("⚡ Empresa demo cargada");
    }

    const appContainer = document.getElementById("appContainer");
    const sidebar = document.getElementById("sidebar");

    if (!appContainer || !sidebar) throw new Error("Contenedores principales no encontrados");

    // Sidebar dinámico
    sidebar.innerHTML = `
      <button id="btnDashboard">Dashboard</button>
      <button id="btnClientes">Clientes</button>
    `;

    document.getElementById("btnDashboard").onclick = () => loadModule(dashboardModule);
    document.getElementById("btnClientes").onclick = () => loadModule(clientesModule);

    bootStatus("✅ Sidebar cargada");

    // Cargar módulo inicial (Dashboard)
    await loadModule(dashboardModule);

    bootStatus("🚀 Sistema inicializado correctamente");

  } catch (error) {
    console.error("❌ Error bootSystem:", error);
    bootStatus(`❌ Error bootSystem: ${error.message}`);
    alert("Error inicializando sistema, revisa consola");
  }
}

// Función genérica para cargar módulos
async function loadModule(moduleFunc) {
  const container = document.getElementById("appContainer");
  container.innerHTML = `<p style="text-align:center;margin-top:50px;">🔄 Cargando módulo...</p>`;
  try {
    await moduleFunc(container, { empresaId: localStorage.getItem("empresaId") });
  } catch (e) {
    console.error("Error cargando módulo:", e);
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando módulo</p>`;
  }
}