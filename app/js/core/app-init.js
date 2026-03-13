/**
 * app-init.js
 * Inicialización del sistema TallerPRO360
 * Arranque principal del ERP
 */

import { buildMenu, initRouter } from "../router.js";

import { auth } from "./firebase-config.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================
INICIAR APP
========================================= */

export function iniciarApp(){

console.log("🚀 Iniciando TallerPRO360...");

document.addEventListener("DOMContentLoaded",()=>{

verificarSesion();

});

}


/* =========================================
VERIFICAR SESIÓN FIREBASE
========================================= */

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


/* =========================================
CARGAR SISTEMA ERP
========================================= */

function cargarSistema(){

try{

console.log("⚙️ Cargando sistema...");

/* ===============================
CREAR MENU
=============================== */

buildMenu();

/* ===============================
INICIAR ROUTER
=============================== */

initRouter();

/* ===============================
ESCuchar cambios de URL
=============================== */

window.addEventListener("hashchange",()=>{

initRouter();

});

console.log("✅ Sistema cargado correctamente");

}catch(error){

console.error("🔥 Error iniciando sistema:",error);

}

}