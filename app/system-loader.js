/**
 * system-loader.js
 * Bootloader principal del ERP
 * TallerPRO360
 */

import { bootSystem } from "./js/system/bootSystem.js";

console.log("⚡ System Loader iniciado");

/* ================================
Esperar DOM completamente cargado
================================ */

window.addEventListener("DOMContentLoaded", async () => {

try{

console.log("🧠 Iniciando Boot del sistema");

/* verificar sesión */

const uid = localStorage.getItem("uid");

if(!uid){

console.warn("⚠ Usuario no autenticado");

location.href = "/login.html";

return;

}

/* iniciar sistema */

await bootSystem();

console.log("✅ Boot completado");

}catch(e){

console.error("❌ Error en system-loader:", e);

}

});