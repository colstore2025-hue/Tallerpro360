/**
 * app-init.js
 * Inicialización del sistema
 * TallerPRO360 ERP
 */

import { buildMenu, initRouter } from "../router.js";
import { loadAICore } from "../system/aiCoreLoader.js";

import { auth } from "./firebase-config.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


let sistemaIniciado = false;


/* ==============================
INICIAR APP
============================== */

export function iniciarApp(){

console.log("🚀 Iniciando TallerPRO360...");

/* evitar doble inicio */

if(sistemaIniciado){
console.warn("⚠️ El sistema ya fue iniciado");
return;
}

verificarSesion();

}


/* ==============================
VERIFICAR SESION
============================== */

function verificarSesion(){

console.log("🔐 Verificando sesión...");

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


/* ==============================
CARGAR SISTEMA
============================== */

async function cargarSistema(){

try{

console.log("⚙️ Iniciando núcleo ERP...");

/* evitar doble carga */

if(sistemaIniciado) return;

sistemaIniciado = true;


/* ==============================
CARGAR IA
============================== */

await loadAICore();

console.log("🧠 IA cargada");


/* ==============================
CONSTRUIR MENU
============================== */

buildMenu();

console.log("📋 Menú generado");


/* ==============================
INICIAR ROUTER
============================== */

initRouter();

console.log("🧭 Router iniciado");


/* ==============================
SISTEMA LISTO
============================== */

console.log("✅ ERP listo");

}
catch(error){

console.error("🔥 Error iniciando sistema:",error);

}

}