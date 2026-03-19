/**
 * orquestadorSupremo.js
 * 🧠 Orquestador + Auto-reparación PRO360
 * Nivel ULTRA + MODO DIOS
 * Ruta: /app/js/core/orquestadorSupremo.js
 */

import { state, loadModule } from "./app-init.js";
import { ejecutarGuardianIA } from "../ai/firestoreGuardianAI.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";

const db = window.db;

// ================= INIT =================
export function activarOrquestadorSupremo() {

  if (!state.empresaId) {
    console.warn("⚠️ Orquestador: empresaId no definido");
    return;
  }

  console.log("😈 ORQUESTADOR SUPREMO ACTIVADO");

  // 1️⃣ Guardian IA automático
  ejecutarGuardianIA({ empresaId: state.empresaId });

  // 2️⃣ Modo Dios Guardian (watcher y autocorrección)
  activarModoDiosGuardian(state.empresaId);

  // 3️⃣ Auto-reparación módulos + UI
  autoRepararUI();

  // 4️⃣ Ciclo continuo cada 10 segundos
  setInterval(() => {
    ejecutarGuardianIA({ empresaId: state.empresaId });
    autoRepararUI();
  }, 10000);
}

// ================= AUTO-REPARACIÓN =================
function autoRepararUI() {

  const appContainer = document.getElementById("appContainer");
  const menu = document.getElementById("menu");

  // Si falta contenedor principal, recrea la UI
  if (!appContainer || !menu) {
    console.warn("⚠️ UI faltante, recreando contenedores...");
    document.body.innerHTML = `
      <div id="menu"></div>
      <div id="appContainer"></div>
    `;
    return;
  }

  // Detectar módulos caídos y recargar
  const moduleButtons = menu.querySelectorAll("button[data-module]");
  moduleButtons.forEach(btn => {
    const modName = btn.dataset.module;
    try {
      if (appContainer.innerHTML.trim() === "") {
        console.log(`🔄 Re-cargando módulo: ${modName}`);
        loadModule(modName);
      }
    } catch (e) {
      console.error(`❌ Error cargando módulo ${modName}:`, e);
    }
  });
}

// ================= EXPORT =================
export default {
  activarOrquestadorSupremo
};