/**
 * system-loader.js
 * Cargador principal del sistema
 */

import { iniciarApp } from "./js/core/app-init.js";
import { buildMenu, initRouter } from "./js/router.js";
import "./js/ai/superAI-orchestrator.js";

console.log("🚀 Iniciando sistema TallerPRO360...");

/* ===========================
INICIAR CUANDO EL DOM ESTE LISTO
=========================== */

document.addEventListener("DOMContentLoaded", () => {

  try{

    console.log("⚙️ Inicializando ERP...");

    iniciarApp();

    buildMenu();

    initRouter();

    console.log("✅ Sistema cargado correctamente");

  }
  catch(error){

    console.error("❌ Error iniciando sistema:",error);

  }

});