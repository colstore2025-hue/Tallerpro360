/**
 * system-loader.js
 * Cargador principal del sistema
 */

console.log("🚀 Iniciando sistema...");

import { iniciarApp } from "./js/core/app-init.js";
import { buildMenu, initRouter } from "./js/router.js";
import "./js/ai/superAI-orchestrator.js";


async function startSystem(){

try{

console.log("⚙️ Cargando ERP...");

iniciarApp();

buildMenu();

initRouter();

console.log("✅ Sistema cargado");

}
catch(error){

console.error("❌ Error iniciando sistema:",error);

}

}

startSystem();