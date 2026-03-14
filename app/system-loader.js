/**
 * system-loader.js
 * Loader principal del sistema
 * TallerPRO360 ERP
 */

console.log("⚡ System Loader iniciado");


/* =========================================
CARGAR APP
========================================= */

async function startSystem(){

try{

console.log("📦 Cargando app-init...");

const app = await import("./js/core/app-init.js");

if(app && app.iniciarApp){

app.iniciarApp();

}else{

throw new Error("iniciarApp no encontrado");

}

}catch(error){

console.error("🔥 Error cargando sistema:",error);

}

}


startSystem();