/**
 * moduleLoader.js
 * 🔥 Loader central para TallerPRO360
 * Arranca dashboard y otros módulos dinámicamente
 */

import { bootStatus } from "./bootDiagnostic.js";

// ------------------------
// Inicialización principal
// ------------------------
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
    // Contenedor principal
    const container = document.getElementById("appContainer");

    // ------------------------
    // 🚀 Importar dashboard
    // ------------------------
    bootStatus("Importando dashboard...");
    const { default: dashboard } = await import("../modules/dashboard.js");

    bootStatus("Inicializando dashboard...");
    await dashboard(container, { empresaId: uid });

    bootStatus("Dashboard cargado correctamente ✅");

    // ------------------------
    // Opcional: otros módulos
    // ------------------------
    // Ejemplo:
    // const { default: clientesModule } = await import("../modules/clientes.js");
    // clientesModule(container, { empresaId: uid });

  } catch (e) {
    console.error("❌ Error cargando módulos:", e);
    bootStatus("Error cargando módulos");
    container.innerHTML = `<p style="color:red;text-align:center;margin-top:50px;">
      ⚠️ Error cargando el sistema. Revisa consola.
    </p>`;
  }
}