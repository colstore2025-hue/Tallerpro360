/**
 * bootSystem.js
 * Boot del ERP · TallerPRO360
 * Inicializa módulos principales y dashboard
 */

import { bootStatus } from "./bootDiagnostic.js";

// 🚀 Módulos principales
import clientesModule from "../modules/clientes.js";
import dashboardModule from "../modules/dashboard.js";

export async function bootSystem() {
  bootStatus("🧠 Iniciando sistema...");

  try {
    // ===============================
    // Verificar sesión
    // ===============================
    const uid = localStorage.getItem("uid");
    const empresaId = localStorage.getItem("empresaId");

    if (!uid) {
      bootStatus("❌ Usuario no autenticado");
      throw new Error("Usuario no autenticado");
    }

    if (!empresaId) {
      bootStatus("⚠ Empresa no definida, cargando demo...");
      localStorage.setItem("empresaId", "demoEmpresa");
    }

    // ===============================
    // Inicializar layout y contenedor
    // ===============================
    const appContainer = document.getElementById("appContainer");
    const sidebar = document.getElementById("sidebar");

    if (!appContainer || !sidebar) {
      throw new Error("Contenedores principales no encontrados");
    }

    // ===============================
    // Configurar sidebar
    // ===============================
    sidebar.innerHTML = `
      <button id="btnDashboard">Dashboard</button>
      <button id="btnClientes">Clientes</button>
    `;

    document.getElementById("btnDashboard").onclick = () => {
      loadDashboard();
    };

    document.getElementById("btnClientes").onclick = () => {
      loadClientes();
    };

    bootStatus("✅ Sidebar cargada");

    // ===============================
    // Cargar módulo inicial
    // ===============================
    await loadDashboard();

    bootStatus("🚀 Sistema inicializado correctamente");

  } catch (error) {
    console.error("❌ Error bootSystem:", error);
    bootStatus(`❌ Error bootSystem: ${error.message}`);
    alert("Error inicializando sistema, revisa consola");
  }
}

// ===============================
// Funciones de carga de módulos
// ===============================
async function loadDashboard() {
  const container = document.getElementById("appContainer");
  container.innerHTML = `<p style="text-align:center;margin-top:50px;">🔄 Cargando dashboard...</p>`;

  const empresaId = localStorage.getItem("empresaId");
  try {
    await dashboardModule(container, { empresaId });
  } catch (e) {
    console.error("Error cargando dashboard:", e);
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando dashboard</p>`;
  }
}

async function loadClientes() {
  const container = document.getElementById("appContainer");
  container.innerHTML = `<p style="text-align:center;margin-top:50px;">🔄 Cargando clientes...</p>`;

  const empresaId = localStorage.getItem("empresaId");
  try {
    await clientesModule(container, { empresaId });
  } catch (e) {
    console.error("Error cargando clientes:", e);
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando clientes</p>`;
  }
}