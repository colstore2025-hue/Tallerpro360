/**
 * system-loader.js
 * Bootloader principal del sistema
 * TallerPRO360 ERP
 */

import { iniciarApp } from "./js/core/app-init.js";
import "./js/ai/superAI-orchestrator.js";

console.log("🚀 Iniciando sistema TallerPRO360...");


/* ===========================
ARRANQUE DEL SISTEMA
=========================== */

document.addEventListener("DOMContentLoaded", () => {

try{

console.log("⚙️ Cargando núcleo del ERP...");

/* iniciar sistema */

iniciarApp();

console.log("✅ Bootloader ejecutado correctamente");

}
catch(error){

console.error("❌ Error iniciando sistema:",error);

}

});