import { store, setStore } from "../core/store.js";
import { dataService } from "../services/dataService.js";
import { bootStatus } from "./bootDiagnostic.js";
import { fixTotalInicial, activarModoDiosGuardian } from "./firestoreGuardianGod.js";

export async function initApp() {
  bootStatus("🚀 Iniciando Motor TallerPRO360...");

  // 1. Recuperar sesión (Prioridad Alta)
  const uid = localStorage.getItem("uid");
  const empresaId = localStorage.getItem("empresaId");

  if (!uid || !empresaId) {
    location.href = "/login.html";
    return;
  }

  // 2. Hydrate Store (Llenar el estado inicial)
  setStore('user', { uid, rol: localStorage.getItem("rol") });
  setStore('empresa', { id: empresaId });

  try {
    // 3. Activar Guardian y Fixes de DB
    bootStatus("🛡️ Activando Guardian de Datos...");
    await fixTotalInicial(empresaId);
    activarModoDiosGuardian(empresaId);

    // 4. Iniciar suscripciones críticas (Background)
    // Esto hace que la app se sienta instantánea
    dataService.subscribeTo("ordenes");
    dataService.subscribeTo("clientes");
    dataService.subscribeTo("inventario");

    // 5. Cargar Dashboard inicial
    const container = document.getElementById("appContainer");
    bootStatus("📦 Cargando módulo Dashboard...");
    
    // Usamos tu lógica de Ejecución Segura
    await window.PRO360.ejecutarModuloSeguro("dashboard", store, container);

    bootStatus("✅ Sistema Estable.");

  } catch (e) {
    bootStatus("❌ Fallo Crítico en el Boot.");
    console.error(e);
  }
}
