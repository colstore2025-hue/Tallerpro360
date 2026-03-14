/**
 * app-init.js
 * Inicialización del sistema
 */

import { buildMenu, initRouter } from "../router.js";

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


function cargarSistema(){

try{

console.log("⚙️ Cargando ERP...");

buildMenu();

initRouter();

console.log("✅ ERP cargado");

}catch(error){

console.error("🔥 Error iniciando sistema:",error);

}

}