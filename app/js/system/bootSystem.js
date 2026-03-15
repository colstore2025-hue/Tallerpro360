/**
 * bootSystem.js
 * Sistema de arranque principal
 * TallerPRO360 ERP
 */

import { iniciarApp } from "../core/app-init.js";

export async function bootSystem(){

console.log("🚀 Boot System iniciado");

try{

/* ===========================
1. Verificar navegador
=========================== */

if(!window.localStorage){

throw new Error("LocalStorage no disponible");

}

/* ===========================
2. Verificar sesión
=========================== */

const uid = localStorage.getItem("uid");

if(!uid){

console.warn("Sesión no encontrada");

window.location.href="/login.html";
return;

}

/* ===========================
3. Verificar contenedor
=========================== */

const app = document.getElementById("appContent");

if(!app){

throw new Error("Contenedor appContent no existe");

}

/* ===========================
4. Diagnóstico inicial
=========================== */

console.log("Usuario activo:",uid);

app.innerHTML = `
<div style="padding:40px;text-align:center">
<h2>Iniciando TallerPRO360</h2>
<p>Preparando sistema...</p>
</div>
`;

/* ===========================
5. Iniciar ERP
=========================== */

await iniciarApp();

console.log("✅ Sistema cargado correctamente");

}
catch(error){

console.error("Error Boot System:",error);

mostrarError(error);

}

}

/* ===========================
Pantalla de error segura
=========================== */

function mostrarError(error){

const app = document.getElementById("appContent");

if(!app) return;

app.innerHTML = `
<div style="padding:40px;text-align:center">

<h2>⚠ Error iniciando el sistema</h2>

<p>${error.message}</p>

<button onclick="location.reload()"
style="padding:12px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer">

Reiniciar Sistema

</button>

</div>
`;

}