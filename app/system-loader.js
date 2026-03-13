/**
 * system-loader.js
 * Bootloader principal del ERP
 */

import { iniciarApp } from "./js/core/app-init.js";
import "./js/ai/superAI-orchestrator.js";

console.log("🚀 Iniciando sistema TallerPRO360");


document.addEventListener("DOMContentLoaded", () => {

try{

console.log("⚙️ Arrancando núcleo del ERP");

iniciarApp();

}
catch(error){

console.error("❌ Error iniciando sistema:",error);

}

});