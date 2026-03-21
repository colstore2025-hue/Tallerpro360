/**
 * moduleLoader.js
 * Loader central para TallerPRO360
 * Arranca dashboard y otros módulos dinámicamente
 */

import { bootStatus } from "./bootDiagnostic.js";

export async function initApp() {
  bootStatus("DOM cargado, iniciando sistema...");

  const uid = localStorage.getItem("uid");
  if (!uid) {
    bootStatus("Usuario no autenticado, redirigiendo...");
    location.href = "/login.html";
    return;
  }

  bootStatus("Usuario autenticado, cargando módulos...");

  try {
    const container = document.getElementById("appContainer");
    if (!container) throw new Error("Contenedor appContainer no encontrado");

    bootStatus("Importando dashboard...");
    const { default: dashboard } = await import("../modules/dashboard.js");

    bootStatus("Inicializando dashboard...");
    await dashboard(container, { empresaId: localStorage.getItem("empresaId") });

    bootStatus("Dashboard cargado correctamente ✅");

  } catch (e) {
    console.error("❌ Error cargando módulos:", e);
    bootStatus("Error cargando módulos");
    const container = document.getElementById("appContainer");
    if (container) {
      container.innerHTML = `<p style="color:red;text-align:center;margin-top:50px;">
        ⚠️ Error cargando el sistema. Revisa consola.
      </p>`;
    }
  }
}