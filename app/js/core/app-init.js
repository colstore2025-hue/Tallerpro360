/**
 * app-init.js
 * Inicialización del sistema
 */

import { buildMenu, initRouter } from "../router.js";
import { loadAICore } from "../system/aiCoreLoader.js";

import { auth } from "./firebase-config.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


export function iniciarApp(){

console.log("🚀 Iniciando TallerPRO360...");

document.addEventListener("DOMContentLoaded",()=>{

verificarSesion();

});

}


function verificarSesion(){

onAuthStateChanged(auth,(user)=>{

if(user){

console.log("✅ Usuario autenticado:",user.email);

cargarSistema();

}else{

console.warn("⚠️ Usuario no autenticado");

window.location.href="/login.html";

}

});

}


async function cargarSistema(){

try{

console.log("⚙️ Iniciando núcleo ERP");

/* cargar IA */

await loadAICore();

/* construir menú */

buildMenu();

/* iniciar router */

initRouter();

console.log("✅ ERP listo");

}
catch(error){

console.error("🔥 Error iniciando sistema:",error);

}

}