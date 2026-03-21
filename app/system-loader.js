/**
 * system-loader.js
 * Bootloader principal del ERP · TallerPRO360
 * Versión robusta con validación de sesión y bootStatus
 */

import { bootSystem } from "./bootSystem.js";
import { bootStatus } from "./bootDiagnostic.js";

console.log("⚡ System Loader iniciado");

window.addEventListener("DOMContentLoaded", async () => {
  try {
    bootStatus("🧠 Inicializando sistema...");

    // =============================
    // 1️⃣ Verificar sesión de usuario
    // =============================
    const uid = localStorage.getItem("uid");

    if (!uid || uid.length < 5) {
      console.warn("⚠ Usuario no autenticado o UID inválido");
      bootStatus("⚠ Redirigiendo a login...");
      location.href = "/login.html";
      return;
    }

    bootStatus(`✔ Usuario autenticado (UID: ${uid})`);

    // =============================
    // 2️⃣ Iniciar sistema
    // =============================
    console.log("🧠 Iniciando Boot del sistema");
    bootStatus("🔧 Cargando módulos y configuraciones...");

    await bootSystem();

    bootStatus("✅ Boot completado con éxito");
    console.log("✅ Boot completado");

  } catch (e) {
    console.error("❌ Error en system-loader:", e);
    bootStatus("❌ Error crítico durante boot");
    alert("Error crítico al iniciar la aplicación. Revisa la consola.");
  }
});