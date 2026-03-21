/**
 * system-loader.js
 * Bootloader principal del ERP · TallerPRO360
 */

import { bootSystem } from "./bootSystem.js";

console.log("⚡ System Loader iniciado");

window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("🧠 Iniciando Boot del sistema");
    await bootSystem();
    console.log("✅ Boot completado");
  } catch (e) {
    console.error("❌ Error en system-loader:", e);
  }
});