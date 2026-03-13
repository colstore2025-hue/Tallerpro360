/**
 * system-loader.js
 * TallerPRO360 ERP SaaS
 * Cargador principal del sistema
 */

console.log("🚀 Cargando sistema TallerPRO360...");


/* ===============================
CARGAR APP INIT
=============================== */

import { iniciarApp } from "./js/core/app-init.js";


/* ===============================
CARGAR ROUTER
=============================== */

import { buildMenu, initRouter } from "./js/router.js";


/* ===============================
CARGAR IA GLOBAL
=============================== */

import "./js/ai/superAI-orchestrator.js";


/* ===============================
INICIAR SISTEMA
=============================== */

async function startSystem(){

console.log("⚙️ Inicializando sistema...");

try{

// iniciar autenticación y contexto empresa
iniciarApp();

// construir menú
buildMenu();

// iniciar router
initRouter();

console.log("✅ Sistema cargado correctamente");

}
catch(error){

console.error("❌ Error cargando sistema:",error);

}

}

startSystem();